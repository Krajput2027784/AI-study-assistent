"""Dashboard summary for the authenticated student."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Material, Note, Quiz, User
from app.routers.progress import build_progress_stats
from app.schemas import DashboardResponse, MaterialPublic, NotePublic, QuizSummary, UserPublic

router = APIRouter()


@router.get(
    "",
    response_model=DashboardResponse,
    summary="Get a dashboard summary for the logged-in student",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:
    stats = build_progress_stats(db, current_user.id)

    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.updated_at.desc())
        .limit(5)
        .all()
    )
    quizzes = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .limit(5)
        .all()
    )
    materials = (
        db.query(Material)
        .filter(Material.user_id == current_user.id)
        .order_by(Material.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardResponse(
        user=UserPublic.model_validate(current_user),
        stats=stats,
        recent_notes=[NotePublic.model_validate(note) for note in notes],
        recent_quizzes=[
            QuizSummary(
                id=quiz.id,
                user_id=quiz.user_id,
                title=quiz.title,
                description=quiz.description,
                question_count=len(quiz.questions),
                created_at=quiz.created_at,
            )
            for quiz in quizzes
        ],
        recent_materials=[MaterialPublic.model_validate(item) for item in materials],
    )
