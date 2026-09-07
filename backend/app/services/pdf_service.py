"""PDF helpers. Text extraction can be expanded without changing routers."""

from __future__ import annotations

from pathlib import Path


def is_pdf(file_name: str, mime_type: str | None = None) -> bool:
    name = file_name.lower()
    if name.endswith(".pdf"):
        return True
    return (mime_type or "").lower() == "application/pdf"


def extract_text(file_path: str, max_chars: int = 8000) -> str:
    """
    Best-effort PDF/text extraction.

    PDFs are parsed with pypdf when available. Plain .txt/.md files are read directly.
    """
    path = Path(file_path)
    if not path.exists():
        return ""

    suffix = path.suffix.lower()
    if suffix in {".txt", ".md"}:
        try:
            return path.read_text(encoding="utf-8", errors="ignore")[:max_chars]
        except OSError:
            return ""

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader  # type: ignore
        except ImportError:
            return ""
        try:
            reader = PdfReader(str(path))
            chunks: list[str] = []
            for page in reader.pages:
                chunks.append(page.extract_text() or "")
                if sum(len(part) for part in chunks) >= max_chars:
                    break
            return "\n".join(chunks)[:max_chars]
        except Exception:
            return ""

    return ""
