"""Notes CRUD for the authenticated student."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Note, User
from app.schemas import (
    NoteAiEnhanceRequest,
    NoteAiEnhanceResponse,
    NoteCreate,
    NotePublic,
    NoteUpdate,
)
from app.services.ai_service import enhance_note_text

router = APIRouter()


def _get_owned_note(db: Session, note_id: int, user_id: int) -> Note:
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


@router.post(
    "/ai-enhance",
    response_model=NoteAiEnhanceResponse,
    summary="Enhance or summarize study notes using AI",
)
def ai_enhance_note(
    payload: NoteAiEnhanceRequest,
    current_user: User = Depends(get_current_user),
) -> NoteAiEnhanceResponse:
    enhanced, used_mock = enhance_note_text(
        title=payload.title,
        content=payload.content,
        instruction=payload.instruction,
    )
    return NoteAiEnhanceResponse(
        enhanced_content=enhanced,
        used_mock_ai=used_mock,
    )


@router.post(
    "",
    response_model=NotePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a note",
)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = Note(user_id=current_user.id, title=payload.title.strip(), content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get(
    "",
    response_model=list[NotePublic],
    summary="List notes, with optional search",
)
def list_notes(
    q: str | None = Query(default=None, description="Search in title and content"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Note]:
    query = db.query(Note).filter(Note.user_id == current_user.id)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((Note.title.ilike(like)) | (Note.content.ilike(like)))
    return query.order_by(Note.updated_at.desc()).all()


@router.get(
    "/{note_id}",
    response_model=NotePublic,
    summary="Get one note",
)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    return _get_owned_note(db, note_id, current_user.id)


@router.put(
    "/{note_id}",
    response_model=NotePublic,
    summary="Update a note",
)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = _get_owned_note(db, note_id, current_user.id)
    if payload.title is not None:
        note.title = payload.title.strip()
    if payload.content is not None:
        note.content = payload.content
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a note",
)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    note = _get_owned_note(db, note_id, current_user.id)
    db.delete(note)
    db.commit()
