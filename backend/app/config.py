"""Application settings loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    value = value.strip()
    return value if value else default


def _resolve_sqlite_url(url: str) -> str:
    """Keep SQLite files inside the backend folder even if cwd differs."""
    if not url.startswith("sqlite"):
        return url

    if ":memory:" in url:
        return "sqlite:///:memory:"

    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
        raw_path = url.replace("sqlite:///", "", 1)
        if raw_path == ":memory:":
            return "sqlite:///:memory:"
        path = Path(raw_path)
        if not path.is_absolute():
            path = BASE_DIR / path
        return "sqlite:///" + path.resolve().as_posix()

    return url


DATABASE_URL = _resolve_sqlite_url(_env("DATABASE_URL", "sqlite:///./app.db") or "sqlite:///./app.db")
SECRET_KEY = _env("SECRET_KEY", "change-this-secret-key") or "change-this-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES = int(_env("ACCESS_TOKEN_EXPIRE_MINUTES", "60") or "60")
GEMINI_API_KEY = _env("GEMINI_API_KEY", "") or ""
GEMINI_MODEL = _env("GEMINI_MODEL", "gemini-3.6-flash") or "gemini-3.6-flash"
FRONTEND_URL = _env("FRONTEND_URL", "http://localhost:3000") or "http://localhost:3000"
JWT_ALGORITHM = "HS256"

# Build allowed origins list from FRONTEND_URL and common dev ports
_raw_origins = [u.strip().rstrip("/") for u in FRONTEND_URL.split(",") if u.strip()]
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
ALLOWED_ORIGINS = list(dict.fromkeys(_raw_origins + _default_origins))

UPLOADS_DIR = BASE_DIR / "uploads"
MATERIALS_DIR = UPLOADS_DIR / "materials"
VIDEOS_DIR = UPLOADS_DIR / "videos"
AUDIO_DIR = UPLOADS_DIR / "audio"

MAX_MATERIAL_BYTES = 50 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
MAX_AUDIO_BYTES = 50 * 1024 * 1024

ALLOWED_MATERIAL_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
}
ALLOWED_MATERIAL_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv"}
ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
}

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".aac"}
ALLOWED_AUDIO_MIME_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/aac",
}


def ensure_upload_dirs() -> None:
    for folder in (MATERIALS_DIR, VIDEOS_DIR, AUDIO_DIR):
        folder.mkdir(parents=True, exist_ok=True)
