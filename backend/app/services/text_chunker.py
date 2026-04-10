from __future__ import annotations

import re


def chunk_text(text: str, max_chars: int = 500) -> list[str]:
    """Split long text into chunks, preserving sentence boundaries and tags."""
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []

    # Split on paragraph breaks first
    paragraphs = re.split(r"\n\s*\n", text)

    for para in paragraphs:
        if len(para) <= max_chars:
            chunks.append(para.strip())
            continue

        # Split paragraph on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", para)
        current = ""

        for sentence in sentences:
            if not current:
                current = sentence
            elif len(current) + len(sentence) + 1 <= max_chars:
                current += " " + sentence
            else:
                chunks.append(current.strip())
                current = sentence

        if current:
            chunks.append(current.strip())

    return [c for c in chunks if c]


def parse_multi_speaker(text: str) -> list[dict]:
    """Parse multi-speaker script format.

    Format:
        SPEAKER A: Hello there!
        SPEAKER B: Hi, how are you?
    """
    lines = text.strip().split("\n")
    segments: list[dict] = []
    current_speaker = None
    current_text = ""

    pattern = re.compile(r"^([A-Z][A-Z\s]+[A-Z]):\s*(.*)$")

    for line in lines:
        match = pattern.match(line.strip())
        if match:
            if current_speaker and current_text.strip():
                segments.append({
                    "speaker": current_speaker,
                    "text": current_text.strip(),
                })
            current_speaker = match.group(1).strip()
            current_text = match.group(2)
        else:
            if current_speaker:
                current_text += " " + line.strip()

    if current_speaker and current_text.strip():
        segments.append({
            "speaker": current_speaker,
            "text": current_text.strip(),
        })

    return segments
