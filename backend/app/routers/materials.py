"""Study material upload, listing, download, and delete."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import (
    ALLOWED_MATERIAL_EXTENSIONS,
    BASE_DIR,
    MATERIALS_DIR,
    MAX_MATERIAL_BYTES,
)
from app.database import get_db
from app.dependencies import LargeFormRoute, get_current_user, get_current_user_flexible
from app.models import Material, User
from app.schemas import MaterialPublic

router = APIRouter(route_class=LargeFormRoute)


def _get_owned_material(db: Session, material_id: int, user_id: int) -> Material:
    material = (
        db.query(Material)
        .filter(Material.id == material_id, Material.user_id == user_id)
        .first()
    )
    if material is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found.")
    return material


def _validate_material_file(filename: str, content_type: str | None, size: int) -> str:
    if size <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")
    if size > MAX_MATERIAL_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {MAX_MATERIAL_BYTES // (1024 * 1024)}MB.",
        )

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_MATERIAL_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a PDF or common study document.",
        )
    return suffix.lstrip(".") or "file"


@router.post(
    "/upload",
    response_model=MaterialPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a study material file",
)
async def upload_material(
    title: str = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Material:
    original_name = file.filename or "upload.bin"
    content = await file.read()
    material_type = _validate_material_file(original_name, file.content_type, len(content))

    stored_name = f"{uuid.uuid4().hex}_{Path(original_name).name}"
    dest = MATERIALS_DIR / stored_name
    dest.write_bytes(content)

    relative_path = dest.relative_to(BASE_DIR).as_posix()
    material = Material(
        user_id=current_user.id,
        title=title.strip() or Path(original_name).stem,
        description=description,
        material_type=material_type,
        file_path=relative_path,
        file_name=original_name,
        mime_type=file.content_type,
        file_size=len(content),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.get(
    "",
    response_model=list[MaterialPublic],
    summary="List uploaded study materials",
)
def list_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Material]:
    return (
        db.query(Material)
        .filter(Material.user_id == current_user.id)
        .order_by(Material.created_at.desc())
        .all()
    )


@router.get(
    "/{material_id}",
    response_model=MaterialPublic,
    summary="Get study material metadata",
)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Material:
    return _get_owned_material(db, material_id, current_user.id)


@router.get(
    "/{material_id}/download",
    summary="Download a study material file",
)
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
) -> FileResponse:
    material = _get_owned_material(db, material_id, current_user.id)
    absolute = (BASE_DIR / material.file_path).resolve()
    materials_root = MATERIALS_DIR.resolve()
    if not absolute.is_relative_to(materials_root) or not absolute.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File is missing on disk.")
    return FileResponse(
        path=absolute,
        filename=material.file_name,
        media_type=material.mime_type or "application/octet-stream",
    )


@router.delete(
    "/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a study material and its file",
)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    material = _get_owned_material(db, material_id, current_user.id)
    absolute = (BASE_DIR / material.file_path).resolve()
    db.delete(material)
    db.commit()
    if absolute.exists() and absolute.is_relative_to(MATERIALS_DIR.resolve()):
        absolute.unlink(missing_ok=True)
