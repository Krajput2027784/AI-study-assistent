"""Authenticated student profile updates."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import UserPublic, UserUpdate

router = APIRouter()


@router.put(
    "/me",
    response_model=UserPublic,
    summary="Update the authenticated student profile",
)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        email = payload.email.lower()
        clash = db.query(User).filter(User.email == email, User.id != current_user.id).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        current_user.email = email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
