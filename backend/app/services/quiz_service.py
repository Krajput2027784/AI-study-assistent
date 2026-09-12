"""Quiz grading and optional AI quiz generation."""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


def get_gemini_url() -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def grade_quiz(questions, submitted: dict[int, str]):
    graded = []
    score = 0
    for q in questions:
        selected = submitted.get(q.id)
        ok = selected == q.correct_answer
        if ok:
            score += 1
        graded.append(
            type(
                "Graded",
                (),
                {
                    "question_id": q.id,
                    "question_text": q.question_text,
                    "options": list(q.options),
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation,
                    "selected_option": selected,
                    "is_correct": ok,
                },
            )()
        )
    return score, graded


def _fallback(topic: str, count: int) -> list[dict[str, Any]]:
    """Return deterministic study questions when Gemini is unavailable."""
    bank = [
        {
            "question_text": f"Which statement best describes {topic}?",
            "options": [
                f"A core concept studied in {topic}",
                "A type of hardware only",
                "A random unrelated topic",
                "None of these",
            ],
            "correct_answer": f"A core concept studied in {topic}",
            "explanation": "The first option is the study-focused description.",
        },
        {
            "question_text": f"Why is understanding {topic} useful for students?",
            "options": [
                "It helps build subject understanding",
                "It removes the need to study",
                "It is unrelated to learning",
                "It only applies to games",
            ],
            "correct_answer": "It helps build subject understanding",
            "explanation": "Understanding core concepts supports learning and problem solving.",
        },
        {
            "question_text": f"What is a good way to learn {topic}?",
            "options": [
                "Practice and review concepts",
                "Never revise",
                "Only memorize random words",
                "Skip examples",
            ],
            "correct_answer": "Practice and review concepts",
            "explanation": "Practice and spaced review improve learning.",
        },
        {
            "question_text": f"Which approach is most appropriate when studying {topic}?",
            "options": [
                "Break it into concepts and examples",
                "Avoid questions",
                "Study without checking understanding",
                "Ignore mistakes",
            ],
            "correct_answer": "Break it into concepts and examples",
            "explanation": "Concepts plus examples make difficult topics easier to understand.",
        },
        {
            "question_text": f"What should you do after making a mistake in {topic}?",
            "options": [
                "Review the mistake and correct it",
                "Ignore it",
                "Delete your notes",
                "Stop studying",
            ],
            "correct_answer": "Review the mistake and correct it",
            "explanation": "Error review is an important part of learning.",
        },
        {
            "question_text": f"Which is a useful study strategy for {topic}?",
            "options": [
                "Use examples and practice problems",
                "Avoid applying concepts",
                "Skip difficult sections",
                "Never test yourself",
            ],
            "correct_answer": "Use examples and practice problems",
            "explanation": "Applying concepts helps reinforce understanding.",
        },
        {
            "question_text": f"How can you check your understanding of {topic}?",
            "options": [
                "Explain the concept in your own words",
                "Read it once and stop",
                "Avoid practice",
                "Memorize without understanding",
            ],
            "correct_answer": "Explain the concept in your own words",
            "explanation": "Self-explanation is a useful way to check understanding.",
        },
        {
            "question_text": f"What should you do when a {topic} concept is confusing?",
            "options": [
                "Break it into smaller ideas and examples",
                "Skip it permanently",
                "Guess without checking",
                "Avoid asking questions",
            ],
            "correct_answer": "Break it into smaller ideas and examples",
            "explanation": "Breaking complex ideas into smaller parts can make them easier to learn.",
        },
        {
            "question_text": f"Which habit supports long-term learning of {topic}?",
            "options": [
                "Regular revision",
                "Studying only once",
                "Avoiding practice",
                "Ignoring feedback",
            ],
            "correct_answer": "Regular revision",
            "explanation": "Regular revision helps retain learned concepts.",
        },
        {
            "question_text": f"What is a good way to prepare for a {topic} exam?",
            "options": [
                "Review concepts and solve practice questions",
                "Study only the night before",
                "Avoid sample questions",
                "Ignore incorrect answers",
            ],
            "correct_answer": "Review concepts and solve practice questions",
            "explanation": "Concept review combined with practice is a strong preparation method.",
        },
    ]
    return bank[: max(2, min(count, len(bank)))]


def _normalise_questions(items: Any, count: int) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []

    valid: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            options = [str(option).strip() for option in item["options"]]
            answer = str(item["correct_answer"]).strip()
            question_text = str(item["question_text"]).strip()
        except (KeyError, TypeError):
            continue

        options = list(dict.fromkeys(option for option in options if option))
        if question_text and len(options) >= 2 and answer in options:
            valid.append(
                {
                    "question_text": question_text,
                    "options": options[:4],
                    "correct_answer": answer,
                    "explanation": str(item.get("explanation", "")).strip() or None,
                }
            )
        if len(valid) >= count:
            break

    return valid


def generate_quiz_questions(topic: str, count: int) -> tuple[list[dict[str, Any]], bool]:
    count = max(2, min(count, 10))

    if not GEMINI_API_KEY:
        return _fallback(topic, count), True

    prompt = (
        "Create a multiple-choice study quiz. Return ONLY a valid JSON array. "
        f"Topic: {topic}. Questions: {count}. "
        "Each object must contain question_text, options (4 strings), "
        "correct_answer (exactly one option), and explanation."
    )

    try:
        response = httpx.post(
            get_gemini_url(),
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"role": "user", "parts": [{"text": prompt}]}]},
            timeout=45,
        )
        if response.status_code != 200:
            logger.error("Gemini quiz generation HTTP error %d: %s", response.status_code, response.text)
            response.raise_for_status()

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates returned by Gemini")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p).strip()

        # Extract JSON array using regex if available
        json_match = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
        if json_match:
            clean_json = json_match.group(0)
        else:
            clean_json = text
            if clean_json.startswith("```"):
                clean_json = clean_json.strip("`")
                if clean_json.lower().startswith("json"):
                    clean_json = clean_json[4:].strip()

        parsed = json.loads(clean_json)
        questions = _normalise_questions(parsed, count)
        if len(questions) < count:
            # Complete a partially generated quiz with safe fallback questions.
            existing = {item["question_text"] for item in questions}
            for item in _fallback(topic, count):
                if item["question_text"] not in existing:
                    questions.append(item)
                if len(questions) >= count:
                    break

        if len(questions) < count:
            raise ValueError("Gemini did not return enough valid questions.")

        return questions[:count], False

    except Exception as exc:
        logger.exception("Quiz generation failed: %s", exc)
        return _fallback(topic, count), True
