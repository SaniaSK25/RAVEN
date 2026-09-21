import pytest

from app.services.probability_engine import ProbabilityEngine


class TestProbabilityEngine:
    def setup_method(self) -> None:
        self.engine = ProbabilityEngine()

    def test_validate_with_all_fields(self) -> None:
        analysis = {
            "failure_rate": "high",
            "operational_exposure": "continuous",
            "environmental_stress": True,
        }
        assert self.engine.validate(analysis) is True

    def test_validate_missing_fields(self) -> None:
        analysis = {"failure_rate": "high"}
        assert self.engine.validate(analysis) is False

    def test_calculate_high_probability(self) -> None:
        analysis = {
            "failure_rate": "very_high",
            "operational_exposure": "continuous",
            "environmental_stress": True,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 5

    def test_calculate_low_probability(self) -> None:
        analysis = {
            "failure_rate": "negligible",
            "operational_exposure": "rare",
            "environmental_stress": False,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 1

    def test_calculate_moderate_probability(self) -> None:
        analysis = {
            "failure_rate": "moderate",
            "operational_exposure": "periodic",
            "environmental_stress": False,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 3

    def test_environmental_bonus_caps_at_5(self) -> None:
        analysis = {
            "failure_rate": "very_high",
            "operational_exposure": "continuous",
            "environmental_stress": True,
        }
        result = self.engine.calculate(analysis)
        assert result.score <= 5

    def test_decision_path_steps(self) -> None:
        analysis = {
            "failure_rate": "moderate",
            "operational_exposure": "frequent",
            "environmental_stress": False,
        }
        result = self.engine.calculate(analysis)
        steps = [step["step"] for step in result.decision_path]
        assert "failure_rate_assessment" in steps
        assert "operational_exposure_assessment" in steps
        assert "environmental_stress_check" in steps
        assert "final_calculation" in steps
