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
# 30 days by default so students are not logged out after an hour.
ACCESS_TOKEN_EXPIRE_MINUTES = int(_env("ACCESS_TOKEN_EXPIRE_MINUTES", "43200") or "43200")
GEMINI_API_KEY = _env("GEMINI_API_KEY", "") or ""
GEMINI_MODEL = _env("GEMINI_MODEL", "gemini-3.6-flash") or "gemini-3.6-flash"
# Production default = the live Vercel site (set FRONTEND_URL=http://localhost:3000 in backend/.env for local work).
FRONTEND_URL = _env("FRONTEND_URL", "https://ai-study-assistent-live.vercel.app") or "https://ai-study-assistent-live.vercel.app"
# Off by default (production-safe). Set to true only to test from a phone on the same Wi-Fi.
ALLOW_LOCAL_NETWORK_CORS = (_env("ALLOW_LOCAL_NETWORK_CORS", "false") or "false").lower() == "true"
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

def _env_mb(name: str, default_mb: int) -> int:
    """Read a size limit in MB from the environment and return bytes."""
    try:
        value = int(_env(name, str(default_mb)) or default_mb)
    except ValueError:
        value = default_mb
    return max(1, value) * 1024 * 1024


# Per-FILE upload limits (there is no total-storage cap in the code).
MAX_MATERIAL_BYTES = _env_mb("MAX_MATERIAL_MB", 50)
MAX_VIDEO_BYTES = _env_mb("MAX_VIDEO_MB", 100)
MAX_AUDIO_BYTES = _env_mb("MAX_AUDIO_MB", 50)

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


# ---- Forgot-password / email settings ----
PASSWORD_RESET_EXPIRE_MINUTES = int(_env("PASSWORD_RESET_EXPIRE_MINUTES", "30") or "30")
# Reset links point to this site. Defaults to the first URL in FRONTEND_URL.
PASSWORD_RESET_BASE_URL = (
    _env("PASSWORD_RESET_BASE_URL", _raw_origins[0] if _raw_origins else "http://localhost:3000")
    or "http://localhost:3000"
).rstrip("/")
SMTP_HOST = _env("SMTP_HOST", "") or ""
SMTP_PORT = int(_env("SMTP_PORT", "587") or "587")
SMTP_USERNAME = _env("SMTP_USERNAME", "") or ""
# Gmail shows app passwords with spaces ("abcd efgh ijkl mnop"); remove them.
SMTP_PASSWORD = (_env("SMTP_PASSWORD", "") or "").replace(" ", "")
SMTP_FROM = _env("SMTP_FROM", SMTP_USERNAME) or SMTP_USERNAME


def ensure_upload_dirs() -> None:
    for folder in (MATERIALS_DIR, VIDEOS_DIR, AUDIO_DIR):
        folder.mkdir(parents=True, exist_ok=True)
