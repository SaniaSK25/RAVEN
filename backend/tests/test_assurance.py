"""Assurance decision tests — band mapping and input validation."""

import pytest

from app.services.assurance import decide_assurance


def test_severity_five_forces_scripted_even_in_low_band():
    result = decide_assurance(5, "Low")
    assert result["assurance_level"] == "scripted"
    assert result["generate_test"] is True
    assert result["rule_id"] == "ASR-SEV-5"


def test_severity_four_uses_low_band():
    result = decide_assurance(4, "Low")
    assert result["assurance_level"] == "unscripted"
    assert result["generate_test"] is False
    assert result["rule_id"] == "ASR-BAND-LOW"


def test_severity_five_forces_scripted_even_in_medium_band():
    result = decide_assurance(5, "Medium")
    assert result["assurance_level"] == "scripted"
    assert result["generate_test"] is True
    assert result["rule_id"] == "ASR-SEV-5"


def test_medium_band_is_exploratory_for_severity_four():
    result = decide_assurance(4, "Medium")
    assert result["assurance_level"] == "exploratory"
    assert result["generate_test"] is False
    assert result["rule_id"] == "ASR-BAND-MEDIUM"


def test_each_risk_band_maps_to_its_assurance_level():
    assert decide_assurance(4, "High")["rule_id"] == "ASR-BAND-HIGH"
    assert decide_assurance(4, "High")["generate_test"] is True
    assert decide_assurance(4, "Medium")["assurance_level"] == "exploratory"
    assert decide_assurance(4, "Low")["assurance_level"] == "unscripted"
    assert decide_assurance(4, "Low")["generate_test"] is False


def test_invalid_inputs_raise():
    with pytest.raises(ValueError):
        decide_assurance(0, "Low")
    with pytest.raises(ValueError):
        decide_assurance(4, "CRITICAL")
