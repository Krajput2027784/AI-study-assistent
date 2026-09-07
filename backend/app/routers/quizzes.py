"""Quiz creation, taking, and scoring."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Question, Quiz, QuizAttempt, User
from app.schemas import (
    QuestionPublic,
    QuestionReview,
    QuizAttemptPublic,
    QuizCreate,
    QuizPublic,
    QuizSubmit,
    QuizSubmitResult,
    QuizSummary,
    QuizGenerateRequest,
)
from app.services.quiz_service import grade_quiz, generate_quiz_questions

router = APIRouter()


@router.post(
    "/generate",
    response_model=QuizPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a study quiz with AI",
)
def generate_quiz(
    payload: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizPublic:
    questions, _used_fallback = generate_quiz_questions(payload.topic.strip(), payload.question_count)
    quiz = Quiz(user_id=current_user.id, title=f"{payload.topic.strip()} Quiz", description="AI-generated study quiz")
    db.add(quiz)
    db.flush()
    for item in questions:
        db.add(Question(quiz_id=quiz.id, question_text=item["question_text"], options=item["options"], correct_answer=item["correct_answer"], explanation=item.get("explanation")))
    db.commit()
    quiz = _get_owned_quiz(db, quiz.id, current_user.id)
    return QuizPublic(
        id=quiz.id, user_id=quiz.user_id, title=quiz.title, description=quiz.description, created_at=quiz.created_at,
        questions=[QuestionPublic(id=q.id, question_text=q.question_text, options=list(q.options)) for q in quiz.questions],
    )


def _get_owned_quiz(db: Session, quiz_id: int, user_id: int) -> Quiz:
    quiz = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.id == quiz_id, Quiz.user_id == user_id)
        .first()
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return quiz


def _to_summary(quiz: Quiz) -> QuizSummary:
    return QuizSummary(
        id=quiz.id,
        user_id=quiz.user_id,
        title=quiz.title,
        description=quiz.description,
        question_count=len(quiz.questions),
        created_at=quiz.created_at,
    )


@router.post(
    "",
    response_model=QuizPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a quiz with multiple-choice questions",
)
def create_quiz(
    payload: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizPublic:
    quiz = Quiz(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description,
    )
    db.add(quiz)
    db.flush()
    for item in payload.questions:
        db.add(
            Question(
                quiz_id=quiz.id,
                question_text=item.question_text.strip(),
                options=item.options,
                correct_answer=item.correct_answer,
                explanation=item.explanation,
            )
        )
    db.commit()
    quiz = _get_owned_quiz(db, quiz.id, current_user.id)
    return QuizPublic(
        id=quiz.id,
        user_id=quiz.user_id,
        title=quiz.title,
        description=quiz.description,
        created_at=quiz.created_at,
        questions=[
            QuestionPublic(id=q.id, question_text=q.question_text, options=list(q.options))
            for q in quiz.questions
        ],
    )


@router.get(
    "",
    response_model=list[QuizSummary],
    summary="List quizzes owned by the current student",
)
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuizSummary]:
    quizzes = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return [_to_summary(quiz) for quiz in quizzes]


@router.get(
    "/attempts",
    response_model=list[QuizAttemptPublic],
    summary="List quiz attempts for the current student",
)
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuizAttempt]:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )


@router.get(
    "/{quiz_id}",
    response_model=QuizPublic,
    summary="Get a quiz for solving (correct answers hidden)",
)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizPublic:
    quiz = _get_owned_quiz(db, quiz_id, current_user.id)
    return QuizPublic(
        id=quiz.id,
        user_id=quiz.user_id,
        title=quiz.title,
        description=quiz.description,
        created_at=quiz.created_at,
        questions=[
            QuestionPublic(id=q.id, question_text=q.question_text, options=list(q.options))
            for q in quiz.questions
        ],
    )


@router.post(
    "/{quiz_id}/submit",
    response_model=QuizSubmitResult,
    summary="Submit answers and store a scored attempt",
)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizSubmitResult:
    quiz = _get_owned_quiz(db, quiz_id, current_user.id)
    question_ids = {q.id for q in quiz.questions}
    submitted: dict[int, str] = {}
    for answer in payload.answers:
        if answer.question_id not in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {answer.question_id} does not belong to this quiz.",
            )
        if answer.question_id in submitted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {answer.question_id} was submitted more than once.",
            )
        question = next(q for q in quiz.questions if q.id == answer.question_id)
        if answer.selected_option not in list(question.options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid option for question {answer.question_id}.",
            )
        submitted[answer.question_id] = answer.selected_option

    missing = question_ids - submitted.keys()
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please answer every question before submitting the quiz.",
        )

    score, graded = grade_quiz(quiz.questions, submitted)
    stored_answers = [
        {
            "question_id": item.question_id,
            "selected_option": item.selected_option,
            "is_correct": item.is_correct,
        }
        for item in graded
    ]
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=len(quiz.questions),
        answers=stored_answers,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizSubmitResult(
        attempt=QuizAttemptPublic.model_validate(attempt),
        questions=[
            QuestionReview(
                id=item.question_id,
                question_text=item.question_text,
                options=item.options,
                correct_answer=item.correct_answer,
                explanation=item.explanation,
                selected_option=item.selected_option,
                is_correct=item.is_correct,
            )
            for item in graded
        ],
    )
