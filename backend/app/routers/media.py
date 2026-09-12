"""Video and audio resources: upload a file or store a URL."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import (
    ALLOWED_AUDIO_EXTENSIONS,
    ALLOWED_AUDIO_MIME_TYPES,
    ALLOWED_VIDEO_EXTENSIONS,
    ALLOWED_VIDEO_MIME_TYPES,
    AUDIO_DIR,
    BASE_DIR,
    MAX_AUDIO_BYTES,
    MAX_VIDEO_BYTES,
    VIDEOS_DIR,
)
from app.database import get_db
from app.dependencies import LargeFormRoute, get_current_user, get_current_user_flexible
from app.models import MediaResource, User
from app.schemas import MediaPublic

router = APIRouter(route_class=LargeFormRoute)


def _get_owned_media(db: Session, media_id: int, user_id: int) -> MediaResource:
    item = (
        db.query(MediaResource)
        .filter(MediaResource.id == media_id, MediaResource.user_id == user_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media resource not found.")
    return item


def _validate_media_file(kind: str, filename: str, content_type: str | None, size: int) -> None:
    max_bytes = MAX_VIDEO_BYTES if kind == "video" else MAX_AUDIO_BYTES
    if size <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")
    if size > max_bytes:
        limit_label = "100MB" if kind == "video" else "50MB"
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {limit_label}.",
        )

    suffix = Path(filename).suffix.lower()
    mime = (content_type or "").split(";")[0].strip().lower()
    if kind == "video":
        allowed_ext, allowed_mime = ALLOWED_VIDEO_EXTENSIONS, ALLOWED_VIDEO_MIME_TYPES
    else:
        allowed_ext, allowed_mime = ALLOWED_AUDIO_EXTENSIONS, ALLOWED_AUDIO_MIME_TYPES

    if suffix not in allowed_ext and mime not in allowed_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported {kind} file type.",
        )


@router.post(
    "",
    response_model=MediaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a video or audio resource",
)
async def create_media(
    title: str = Form(...),
    kind: str = Form(...),
    description: str | None = Form(default=None),
    source_url: str | None = Form(default=None),
    duration: float | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MediaResource:
    kind = kind.strip().lower()
    if kind not in {"video", "audio"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="kind must be video or audio.")

    url = (source_url or "").strip() or None
    relative_path = None

    has_file = file is not None and file.filename
    if has_file:
        original_name = file.filename or "media.bin"
        content = await file.read()
        _validate_media_file(kind, original_name, file.content_type, len(content))
        folder = VIDEOS_DIR if kind == "video" else AUDIO_DIR
        dest = folder / f"{uuid.uuid4().hex}_{Path(original_name).name}"
        dest.write_bytes(content)
        relative_path = dest.relative_to(BASE_DIR).as_posix()
    elif url:
        if not (url.startswith("http://") or url.startswith("https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source_url must start with http:// or https://",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either an uploaded file or a source_url.",
        )

    item = MediaResource(
        user_id=current_user.id,
        title=title.strip(),
        description=description,
        kind=kind,
        file_path=relative_path,
        source_url=url,
        duration=duration,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get(
    "",
    response_model=list[MediaPublic],
    summary="List video and audio resources",
)
def list_media(
    kind: str | None = Query(default=None, description="Optional filter: video or audio"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MediaResource]:
    query = db.query(MediaResource).filter(MediaResource.user_id == current_user.id)
    if kind:
        kind = kind.strip().lower()
        if kind not in {"video", "audio"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="kind must be video or audio.")
        query = query.filter(MediaResource.kind == kind)
    return query.order_by(MediaResource.created_at.desc()).all()


@router.get(
    "/{media_id}",
    response_model=MediaPublic,
    summary="Get one video or audio resource",
)
def get_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MediaResource:
    return _get_owned_media(db, media_id, current_user.id)


@router.get(
    "/{media_id}/file",
    summary="Stream an uploaded video or audio file",
)
def stream_media_file(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
) -> FileResponse:
    item = _get_owned_media(db, media_id, current_user.id)
    if not item.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This media uses an external URL.")
    absolute = (BASE_DIR / item.file_path).resolve()
    folder = VIDEOS_DIR.resolve() if item.kind == "video" else AUDIO_DIR.resolve()
    if not absolute.is_relative_to(folder) or not absolute.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media file is missing on disk.")
    return FileResponse(path=absolute, filename=absolute.name)


@router.delete(
    "/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a video or audio resource",
)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    item = _get_owned_media(db, media_id, current_user.id)
    absolute = (BASE_DIR / item.file_path).resolve() if item.file_path else None
    folder = VIDEOS_DIR if item.kind == "video" else AUDIO_DIR
    db.delete(item)
    db.commit()
    if absolute and absolute.exists() and absolute.is_relative_to(folder.resolve()):
        absolute.unlink(missing_ok=True)
