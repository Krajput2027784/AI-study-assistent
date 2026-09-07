"""Gemini-backed AI helper with a safe mock fallback."""

from __future__ import annotations

import logging
from typing import Iterable

import httpx

from app.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY)


def _mock_reply(user_text: str) -> str:
    preview = user_text.strip()[:180] or "your question"
    return (
        "AI is running in mock mode because GEMINI_API_KEY is not set. "
        f"Here is a study-assistant style reply to: {preview}. "
        "Add a Gemini API key in backend/.env to enable real answers."
    )


def _history_to_gemini_contents(history: Iterable[dict[str, str]]) -> list[dict]:
    contents: list[dict] = []
    for item in history:
        role = item.get("role", "user")
        gemini_role = "model" if role == "assistant" else "user"
        contents.append(
            {
                "role": gemini_role,
                "parts": [{"text": item.get("content", "")}],
            }
        )
    return contents


def generate_study_reply(
    history: list[dict[str, str]],
    extra_context: str | None = None,
) -> tuple[str, bool]:
    """
    Return (reply_text, used_mock).

    history items: {"role": "user"|"assistant"|"system", "content": "..."}.
    """
    if extra_context:
        history = [
            {
                "role": "user",
                "content": (
                    "Use this study material as extra context if it helps:\n"
                    f"{extra_context}\n\nAnswer the student's latest question using this context when relevant."
                ),
            },
            *history,
        ]

    if not is_gemini_configured():
        last_user = next((item["content"] for item in reversed(history) if item.get("role") == "user"), "")
        return _mock_reply(last_user), True

    payload = {
        "system_instruction": {
            "parts": [
                {
                    "text": (
                        "You are a helpful AI study assistant. Explain clearly, "
                        "stay academic, and do not invent sources."
                    )
                }
            ]
        },
        "contents": _history_to_gemini_contents(
            [item for item in history if item.get("role") in {"user", "assistant"}]
        ),
    }

    try:
        response = httpx.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=45.0,
        )
        response.raise_for_status()
        data = response.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text")
        )
        if not text:
            logger.warning("Gemini returned an empty response: %s", data)
            return "I could not generate a response right now. Please try again.", False
        return text, False
    except Exception as exc:
        logger.exception("Gemini request failed: %s", exc)
        last_user = next((item["content"] for item in reversed(history) if item.get("role") == "user"), "")
        return (
            "The Gemini request failed, so this is a fallback study-assistant reply. "
            f"You asked: {last_user[:180]}",
            True,
        )
