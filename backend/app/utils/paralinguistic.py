from __future__ import annotations

import re

VALID_TAGS = {"laugh", "cough", "chuckle", "whisper", "sigh", "gasp"}
_VALID_TAGS_PATTERN = "|".join(sorted((re.escape(t) for t in VALID_TAGS), key=len, reverse=True))
TAG_PATTERN = re.compile(r"\[\s*(" + _VALID_TAGS_PATTERN + r")\s*\]", re.IGNORECASE)
ALL_TAG_PATTERN = re.compile(r"\[([^\[\]]+)\]")

NON_TURBO_REPLACEMENTS = {
    "laugh": " haha ",
    "chuckle": " hehe ",
    "cough": " cough ",
    "whisper": " softly ",
    "sigh": " ah ",
    "gasp": " oh ",
}

MODELS_WITH_NATIVE_TAGS = {"turbo", "multilingual"}


def validate_tags(text: str) -> list[str]:
    """Return list of invalid tags found in text."""
    all_tags = ALL_TAG_PATTERN.findall(text)
    cleaned = [t.strip().lower() for t in all_tags]
    return [t for t in cleaned if t and t not in VALID_TAGS]


def extract_tags(text: str) -> list[dict]:
    """Extract tag positions from text."""
    results = []
    for match in TAG_PATTERN.finditer(text):
        results.append({
            "tag": match.group(1).lower(),
            "start": match.start(),
            "end": match.end(),
        })
    return results


def clean_text(text: str) -> str:
    """Normalize tag casing."""
    def replacer(m: re.Match) -> str:
        return f"[{m.group(1).lower()}]"
    return TAG_PATTERN.sub(replacer, text)


def prepare_text_for_model(text: str, model: str) -> str:
    """
    Normalize/convert paralinguistic tags for model compatibility.
    - turbo/multilingual: keep bracket tags (normalized lower-case).
    - standard: convert known tags to spoken cues.
    """
    normalized = clean_text(text)
    if model in MODELS_WITH_NATIVE_TAGS:
        return normalized

    def replacer(m: re.Match) -> str:
        tag = m.group(1).strip().lower()
        return NON_TURBO_REPLACEMENTS.get(tag, " ")

    converted = ALL_TAG_PATTERN.sub(replacer, normalized)
    # Safety net: strip any bracketed leftovers so non-native models never read tags.
    converted = re.sub(r"\[[^\]]*\]", " ", converted)
    # Collapse whitespace after replacements.
    return re.sub(r"\s+", " ", converted).strip()
