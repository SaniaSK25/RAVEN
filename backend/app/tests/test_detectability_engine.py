import pytest

from app.services.detectability_engine import DetectabilityEngine


class TestDetectabilityEngine:
    def setup_method(self) -> None:
        self.engine = DetectabilityEngine()

    def test_validate_with_all_fields(self) -> None:
        analysis = {
            "detection_method": "automated_monitoring",
            "detection_coverage": 0.9,
            "response_time": "fast",
        }
        assert self.engine.validate(analysis) is True

    def test_validate_missing_fields(self) -> None:
        analysis = {"detection_method": "automated_monitoring"}
        assert self.engine.validate(analysis) is False

    def test_calculate_high_detectability(self) -> None:
        analysis = {
            "detection_method": "automated_monitoring",
            "detection_coverage": 0.95,
            "response_time": "immediate",
        }
        result = self.engine.calculate(analysis)
        assert result.score == 1

    def test_calculate_low_detectability(self) -> None:
        analysis = {
            "detection_method": "none",
            "detection_coverage": 0.0,
            "response_time": "none",
        }
        result = self.engine.calculate(analysis)
        assert result.score == 5

    def test_calculate_moderate_detectability(self) -> None:
        analysis = {
            "detection_method": "peer_review",
            "detection_coverage": 0.6,
            "response_time": "moderate",
        }
        result = self.engine.calculate(analysis)
        assert result.score == 3

    def test_coverage_threshold_boundary(self) -> None:
        analysis = {
            "detection_method": "automated_monitoring",
            "detection_coverage": 0.75,
            "response_time": "fast",
        }
        result = self.engine.calculate(analysis)
        assert result.score <= 2

    def test_decision_path_steps(self) -> None:
        analysis = {
            "detection_method": "manual_testing",
            "detection_coverage": 0.5,
            "response_time": "slow",
        }
        result = self.engine.calculate(analysis)
        steps = [step["step"] for step in result.decision_path]
        assert "detection_method_assessment" in steps
        assert "detection_coverage_assessment" in steps
        assert "response_time_assessment" in steps
        assert "final_calculation" in steps
