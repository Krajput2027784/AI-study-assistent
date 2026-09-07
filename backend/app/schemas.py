"""Pydantic request and response schemas."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


class MessageResponse(BaseModel):
    detail: str


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def bcrypt_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes.")
        return value

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty.")
        return cleaned


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty.")
        return cleaned


class UserPublic(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = ""


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None


class NotePublic(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MaterialPublic(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    material_type: str
    file_name: str
    mime_type: str | None
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MediaCreateForm(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    kind: Literal["video", "audio"]
    source_url: HttpUrl | None = None
    duration: float | None = Field(default=None, ge=0)


class MediaPublic(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    kind: str
    file_path: str | None
    source_url: str | None
    duration: float | None
    created_at: datetime

    model_config = {"from_attributes": True}




class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    question_count: int = Field(default=5, ge=2, le=10)

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1)
    options: list[str] = Field(..., min_length=2)
    correct_answer: str = Field(..., min_length=1)
    explanation: str | None = None

    @field_validator("options")
    @classmethod
    def unique_options(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) < 2:
            raise ValueError("Each question needs at least two non-empty options.")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Question options must be unique.")
        return cleaned

    @field_validator("correct_answer")
    @classmethod
    def strip_answer(cls, value: str) -> str:
        return value.strip()


class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    questions: list[QuestionCreate] = Field(..., min_length=1)

    @field_validator("questions")
    @classmethod
    def correct_answer_in_options(cls, questions: list[QuestionCreate]) -> list[QuestionCreate]:
        for question in questions:
            if question.correct_answer not in question.options:
                raise ValueError("correct_answer must match one of the options.")
        return questions


class QuestionPublic(BaseModel):
    """Question shown while taking a quiz. Correct answers are omitted."""

    id: int
    question_text: str
    options: list[str]


class QuestionReview(BaseModel):
    id: int
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str | None
    selected_option: str | None
    is_correct: bool


class QuizSummary(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    question_count: int
    created_at: datetime


class QuizPublic(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    created_at: datetime
    questions: list[QuestionPublic]


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: str = Field(..., min_length=1)


class QuizSubmit(BaseModel):
    answers: list[AnswerSubmit] = Field(..., min_length=1)


class QuizAttemptPublic(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    score: int
    total_questions: int
    answers: list[dict[str, Any]]
    completed_at: datetime

    model_config = {"from_attributes": True}


class QuizSubmitResult(BaseModel):
    attempt: QuizAttemptPublic
    questions: list[QuestionReview]


class ChatSessionCreate(BaseModel):
    title: str = Field(default="New chat", min_length=1, max_length=255)


class ChatMessagePublic(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionPublic(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(ChatSessionPublic):
    messages: list[ChatMessagePublic]


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    material_id: int | None = None


class ChatMessageResponse(BaseModel):
    user_message: ChatMessagePublic
    assistant_message: ChatMessagePublic
    used_mock_ai: bool


class ProgressStats(BaseModel):
    total_notes: int
    total_materials: int
    total_quizzes: int
    quizzes_attempted: int
    average_quiz_score: float | None
    total_chat_sessions: int
    total_media: int


class DashboardResponse(BaseModel):
    user: UserPublic
    stats: ProgressStats
    recent_notes: list[NotePublic]
    recent_quizzes: list[QuizSummary]
    recent_materials: list[MaterialPublic]


class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool
