from __future__ import annotations

from app.utils.paralinguistic import prepare_text_for_model


def test_turbo_keeps_tags_and_normalizes_case() -> None:
    text = "Hello [LAUGH] there [whisper]"
    assert prepare_text_for_model(text, "turbo") == "Hello [laugh] there [whisper]"


def test_multilingual_keeps_tags_and_normalizes_case() -> None:
    text = "Bonjour [SIGH] ami"
    assert prepare_text_for_model(text, "multilingual") == "Bonjour [sigh] ami"


def test_standard_converts_supported_tags_to_spoken_cues() -> None:
    text = "Hello [laugh] there [cough]"
    assert prepare_text_for_model(text, "standard") == "Hello haha there cough"


def test_standard_strips_unknown_bracket_tags() -> None:
    text = "Hello [unknown] there"
    assert prepare_text_for_model(text, "standard") == "Hello there"


def test_standard_converts_spaced_tag_forms() -> None:
    text = "Hello [  LAUGH  ] there"
    assert prepare_text_for_model(text, "standard") == "Hello haha there"


def test_standard_strips_leftover_bracket_text() -> None:
    text = "Hello [laugh!] there"
    assert prepare_text_for_model(text, "standard") == "Hello there"
