"""Weighted risk score + band tests — boundaries, extremes, validation.

Formula: points = 12xS + 5xP + 3xD (== 20 x weighted avg), rpn = points/20.
Bands: Low points<=45 (rpn<=2.25), Medium 46-67, High >=68 (rpn>=3.4).
No AWS."""

import pathlib

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
    # Severity 5 alone forces High; a pure product would give 5x1x1=5 (Low).
    assert calculate_rpn(5, 1, 1)["band"] == "High"
    assert calculate_rpn(5, 1, 1)["rpn_points"] == 68


def test_thresholds_are_configurable():
    # Team raises low_max 45 -> 50: 46 points moves Medium -> Low.
    assert calculate_rpn(2, 2, 4, low_max=50) == {
        "rpn": 2.3,
        "rpn_points": 46,
        "band": "Low",
    }
    assert calculate_rpn(2, 2, 4)["band"] == "Medium"


def test_out_of_range_scores_raise():
    with pytest.raises(ValueError):
        calculate_rpn(0, 3, 3)
    with pytest.raises(ValueError):
        calculate_rpn(3, 6, 3)
    with pytest.raises(ValueError):
        calculate_rpn(True, 3, 3)  # bool is not a valid score


def test_deterministic_across_repeats():
    first = calculate_rpn(4, 3, 4)
    for _ in range(100):
        assert calculate_rpn(4, 3, 4) == first


def test_engine_source_is_pure():
    src = (
        pathlib.Path(__file__)
        .parent.parent.joinpath("app", "services", "rpn.py")
        .read_text()
    )
    for banned in (
        "sqlalchemy",
        "app.db",
        "httpx",
        "anthropic",
        "requests",
        "socket",
        "datetime",
        "random",
    ):
        assert banned not in src
