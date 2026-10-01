"""Weighted risk score + band tests — boundaries, extremes, validation.

Formula: points = 12xS + 5xP + 3xD (== 20 x weighted avg), rpn = points/20.
Bands: Low points<=45 (rpn<=2.29), Medium 46-67, High >=68 (rpn>=3.4).
No AWS."""

import pytest

from app.services.rpn import calculate_rpn


def test_band_boundaries_exact():
    assert calculate_rpn(2, 3, 2) == {"rpn": 2.25, "rpn_points": 45, "band": "Low"}
    assert calculate_rpn(2, 2, 4) == {"rpn": 2.3, "rpn_points": 46, "band": "Medium"}
    assert calculate_rpn(4, 2, 3) == {"rpn": 3.35, "rpn_points": 67, "band": "Medium"}
    assert calculate_rpn(4, 1, 5) == {"rpn": 3.4, "rpn_points": 68, "band": "High"}


def test_min_and_max():
    assert calculate_rpn(1, 1, 1) == {"rpn": 1.0, "rpn_points": 20, "band": "Low"}
    assert calculate_rpn(5, 5, 5) == {"rpn": 5.0, "rpn_points": 100, "band": "High"}


def test_sample_requirement_scores_75_high():
    assert calculate_rpn(4, 3, 4) == {"rpn": 3.75, "rpn_points": 75, "band": "High"}


def test_severity_dominates():
    # Severity 5 alone forces High; old multiply gave 5x1x1=5 (Low).
    assert calculate_rpn(5, 1, 1)["band"] == "High"
    assert calculate_rpn(5, 1, 1)["rpn_points"] == 68


def test_out_of_range_scores_raise():
    with pytest.raises(ValueError):
        calculate_rpn(0, 3, 3)
    with pytest.raises(ValueError):
        calculate_rpn(3, 6, 3)
