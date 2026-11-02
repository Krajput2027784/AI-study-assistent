"""Signup, login, and current-user endpoints."""

import time

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    reset_token_matches_password,
    verify_password,
)
from app.config import PASSWORD_RESET_BASE_URL
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
)
from app.services.email_service import send_password_reset_email

router = APIRouter()

# Do not let someone spam an inbox: at most one reset email per address per minute.
_RESET_COOLDOWN_SECONDS = 60
_last_reset_request: dict[str, float] = {}


@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a student account",
)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    email = payload.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name,
        email=email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive a JWT access token",
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Email a password reset link",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> MessageResponse:
    # Always answer the same way so nobody can use this to find out which emails are registered.
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is not None:
        now = time.monotonic()
        last = _last_reset_request.get(user.email)
        if last is None or now - last >= _RESET_COOLDOWN_SECONDS:
            _last_reset_request[user.email] = now
            token = create_password_reset_token(user.id, user.hashed_password)
            reset_url = f"{PASSWORD_RESET_BASE_URL}/reset-password?token={token}"
            background_tasks.add_task(send_password_reset_email, user.email, user.full_name, reset_url)
    return MessageResponse(
        detail="If an account exists for this email, a password reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Set a new password using the emailed reset token",
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This reset link is invalid or has expired. Please request a new one.",
    )
    try:
        data = decode_password_reset_token(payload.token)
        user_id = int(data["sub"])
    except (ValueError, KeyError, TypeError):
        raise invalid

    user = db.get(User, user_id)
    if user is None or not reset_token_matches_password(data, user.hashed_password):
        raise invalid

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(detail="Password updated. You can now log in with your new password.")


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get the authenticated student profile",
)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
