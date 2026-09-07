"""AI study chat sessions and messages."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import ChatMessage, ChatSession, Material, User
from app.schemas import (
    ChatMessageCreate,
    ChatMessagePublic,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionDetail,
    ChatSessionPublic,
)
from app.services.ai_service import generate_study_reply
from app.services.pdf_service import extract_text
from app.config import BASE_DIR

router = APIRouter()


def _get_owned_session(db: Session, session_id: int, user_id: int) -> ChatSession:
    session = (
        db.query(ChatSession)
        .options(selectinload(ChatSession.messages))
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    return session


@router.post(
    "/sessions",
    response_model=ChatSessionPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new AI chat session",
)
def create_session(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatSession:
    session = ChatSession(user_id=current_user.id, title=payload.title.strip())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get(
    "/sessions",
    response_model=list[ChatSessionPublic],
    summary="List AI chat sessions",
)
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionDetail,
    summary="Get a chat session and its messages",
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatSessionDetail:
    session = _get_owned_session(db, session_id, current_user.id)
    messages = sorted(session.messages, key=lambda item: item.created_at)
    return ChatSessionDetail(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[ChatMessagePublic.model_validate(msg) for msg in messages],
    )


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    summary="Send a message and receive an AI reply",
)
def send_message(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageResponse:
    session = _get_owned_session(db, session_id, current_user.id)

    extra_context = None
    if payload.material_id is not None:
        material = (
            db.query(Material)
            .filter(Material.id == payload.material_id, Material.user_id == current_user.id)
            .first()
        )
        if material is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found.")
        extra_context = extract_text(str(BASE_DIR / material.file_path))

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=payload.content.strip(),
    )
    db.add(user_message)
    db.flush()

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in sorted(session.messages, key=lambda item: item.created_at)
        if msg.id != user_message.id
    ]
    history.append({"role": "user", "content": user_message.content})

    reply_text, used_mock = generate_study_reply(history, extra_context=extra_context)

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=reply_text,
    )
    session.updated_at = datetime.utcnow()
    if session.title == "New chat":
        session.title = user_message.content[:80]

    db.add(assistant_message)
    db.add(session)
    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)

    return ChatMessageResponse(
        user_message=ChatMessagePublic.model_validate(user_message),
        assistant_message=ChatMessagePublic.model_validate(assistant_message),
        used_mock_ai=used_mock,
    )
