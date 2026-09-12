"""Gemini-backed AI helper with a safe mock fallback."""

from __future__ import annotations

import logging
from typing import Iterable

import httpx

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


def get_gemini_url() -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def is_gemini_configured() -> bool:
    return bool(GEMINI_API_KEY)


def _extract_gemini_text(data: dict) -> str:
    """Safely extract all text parts from Gemini response."""
    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    text_parts = [p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p]
    return "".join(text_parts).strip()


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
                        "stay academic, provide examples where useful, and do not invent sources."
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
            get_gemini_url(),
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=45.0,
        )
        if response.status_code != 200:
            logger.error(
                "Gemini request failed with status %d: %s",
                response.status_code,
                response.text,
            )
            response.raise_for_status()

        data = response.json()
        text = _extract_gemini_text(data)
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


def enhance_note_text(
    title: str,
    content: str,
    instruction: str | None = None,
) -> tuple[str, bool]:
    """Enhance and structure study notes into a comprehensive study guide."""
    if not is_gemini_configured():
        fallback = (
            f"# {title or 'Study Notes'}\n\n"
            "## Summary\n"
            f"{content}\n\n"
            "## Key Takeaways\n"
            "- Review these notes regularly for better recall.\n"
            "- Connect these concepts with relevant textbook examples.\n"
        )
        return fallback, True

    inst = instruction or "Structure and enhance these study notes with clear headings, key concepts, and takeaways."
    prompt = (
        f"{inst}\n\n"
        f"Title: {title}\n"
        f"Rough Notes:\n{content}\n\n"
        "Format output in clean, readable Markdown suitable for student revision."
    )

    try:
        response = httpx.post(
            get_gemini_url(),
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"role": "user", "parts": [{"text": prompt}]}]},
            timeout=45.0,
        )
        if response.status_code != 200:
            logger.error("Gemini note enhancement failed (%d): %s", response.status_code, response.text)
            response.raise_for_status()

        data = response.json()
        text = _extract_gemini_text(data)
        if not text:
            raise ValueError("Empty text received from Gemini")
        return text, False
    except Exception as exc:
        logger.exception("Note enhancement failed: %s", exc)
        return f"# {title}\n\n{content}\n\n*(AI enhancement unavailable)*", True
