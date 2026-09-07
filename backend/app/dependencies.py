"""Shared FastAPI dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRoute
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.requests import Request
from sqlalchemy.orm import Session

from app.auth import decode_access_token
from app.config import MAX_VIDEO_BYTES
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=True)


class LargeFormRequest(Request):
    """Allow study-file uploads larger than Starlette's 1MB default part size."""

    async def form(self, *args, **kwargs):
        kwargs.setdefault("max_part_size", MAX_VIDEO_BYTES)
        return await super().form(*args, **kwargs)


class LargeFormRoute(APIRoute):
    def get_route_handler(self):
        original_handler = super().get_route_handler()

        async def custom_handler(request: Request):
            request = LargeFormRequest(request.scope, request.receive)
            return await original_handler(request)

        return custom_handler


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(credentials.credentials)
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
