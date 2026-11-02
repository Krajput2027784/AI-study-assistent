"""FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS, ALLOW_LOCAL_NETWORK_CORS, GEMINI_MODEL, SECRET_KEY, ensure_upload_dirs
from app.database import init_db
from app.routers import auth, chat, dashboard, materials, media, notes, progress, quizzes, users
from app.schemas import HealthResponse
from app.services.ai_service import is_gemini_configured

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if SECRET_KEY == "change-this-secret-key":
        logger.warning("SECRET_KEY is still the example value. Change it in backend/.env before real use.")
    ensure_upload_dirs()
    init_db()
    yield


app = FastAPI(
    title="AI Study Assistant API",
    description=(
        "Backend API for the AI Study Assistant. "
        "Authenticate with JWT, then manage notes, materials, media, quizzes, chat, and progress."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=(r"https?://(localhost|127\.0\.0\.1)(:\d+)?" + (r"|https?://(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)[0-9.]+(:\d+)?" if ALLOW_LOCAL_NETWORK_CORS else r"")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="API health check",
)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="ai-study-assistant-backend",
        gemini_configured=is_gemini_configured(),
        gemini_model=GEMINI_MODEL,
    )


# Also create tables on import so the app works even if lifespan is skipped.
ensure_upload_dirs()
init_db()
