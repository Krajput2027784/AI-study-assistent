"""Shared FastAPI dependencies."""

from fastapi import Depends, HTTPException, Query, status
from fastapi.routing import APIRoute
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.requests import Request
from sqlalchemy.orm import Session

from app.auth import decode_access_token
from app.config import MAX_AUDIO_BYTES, MAX_MATERIAL_BYTES, MAX_VIDEO_BYTES
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=True)
bearer_scheme_optional = HTTPBearer(auto_error=False)


class LargeFormRequest(Request):
    """Allow study-file uploads larger than Starlette's 1MB default part size."""

    async def form(self, *args, **kwargs):
        kwargs.setdefault("max_part_size", max(MAX_VIDEO_BYTES, MAX_MATERIAL_BYTES, MAX_AUDIO_BYTES))
        return await super().form(*args, **kwargs)


class LargeFormRoute(APIRoute):
    def get_route_handler(self):
        original_handler = super().get_route_handler()

        async def custom_handler(request: Request):
            request = LargeFormRequest(request.scope, request.receive)
            return await original_handler(request)

        return custom_handler


def get_current_user_from_token_str(token_str: str, db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token_str)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    return get_current_user_from_token_str(credentials.credentials, db)


def get_current_user_flexible(
    token: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
    db: Session = Depends(get_db),
) -> User:
    """Allow either Authorization: Bearer or ?token=... query parameter."""
    raw_token = None
    if credentials and credentials.credentials:
        raw_token = credentials.credentials
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide Bearer token or token parameter.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return get_current_user_from_token_str(raw_token, db)
