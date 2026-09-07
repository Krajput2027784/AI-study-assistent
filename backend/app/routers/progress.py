"""Learning progress statistics for the authenticated student."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import ChatSession, Material, MediaResource, Note, Quiz, QuizAttempt, User
from app.schemas import ProgressStats

router = APIRouter()


def build_progress_stats(db: Session, user_id: int) -> ProgressStats:
    total_notes = db.query(func.count(Note.id)).filter(Note.user_id == user_id).scalar() or 0
    total_materials = db.query(func.count(Material.id)).filter(Material.user_id == user_id).scalar() or 0
    total_quizzes = db.query(func.count(Quiz.id)).filter(Quiz.user_id == user_id).scalar() or 0
    total_chat_sessions = (
        db.query(func.count(ChatSession.id)).filter(ChatSession.user_id == user_id).scalar() or 0
    )
    total_media = (
        db.query(func.count(MediaResource.id)).filter(MediaResource.user_id == user_id).scalar() or 0
    )
    quizzes_attempted = (
        db.query(func.count(func.distinct(QuizAttempt.quiz_id)))
        .filter(QuizAttempt.user_id == user_id)
        .scalar()
        or 0
    )

    avg_ratio = (
        db.query(func.avg(QuizAttempt.score * 1.0 / QuizAttempt.total_questions))
        .filter(QuizAttempt.user_id == user_id, QuizAttempt.total_questions > 0)
        .scalar()
    )
    average_quiz_score = round(float(avg_ratio) * 100, 2) if avg_ratio is not None else None

    return ProgressStats(
        total_notes=total_notes,
        total_materials=total_materials,
        total_quizzes=total_quizzes,
        quizzes_attempted=quizzes_attempted,
        average_quiz_score=average_quiz_score,
        total_chat_sessions=total_chat_sessions,
        total_media=total_media,
    )


@router.get(
    "",
    response_model=ProgressStats,
    summary="Get study statistics for the current student",
)
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressStats:
    return build_progress_stats(db, current_user.id)
