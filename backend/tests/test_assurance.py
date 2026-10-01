"""Assurance decision tests — floor priority, band mapping, validation."""

import pytest

from app.services.assurance import decide_assurance


def test_severity_floor_ignores_low_band():
    result = decide_assurance(4, "Low")
    assert result["assurance_level"] == "scripted"
    assert result["generate_test"] is True
    assert result["rule_id"] == "ASR-SEV-FLOOR"


def test_severity_5_forces_scripted():
    assert decide_assurance(5, "Medium")["rule_id"] == "ASR-SEV-FLOOR"


def test_band_decides_below_floor():
    assert decide_assurance(3, "High")["rule_id"] == "ASR-BAND-HIGH"
    assert decide_assurance(3, "High")["generate_test"] is True
    assert decide_assurance(3, "Medium")["assurance_level"] == "exploratory"
    assert decide_assurance(2, "Low")["assurance_level"] == "unscripted"
    assert decide_assurance(2, "Low")["generate_test"] is False


def test_invalid_inputs_raise():
    with pytest.raises(ValueError):
        decide_assurance(0, "Low")
    with pytest.raises(ValueError):
        decide_assurance(3, "CRITICAL")
