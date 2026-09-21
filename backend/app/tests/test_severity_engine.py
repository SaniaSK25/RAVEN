import pytest

from app.services.severity_engine import SeverityEngine


class TestSeverityEngine:
    def setup_method(self) -> None:
        self.engine = SeverityEngine()

    def test_validate_with_all_fields(self) -> None:
        analysis = {
            "safety_impact": "high",
            "system_function": "core",
            "compliance_impact": True,
        }
        assert self.engine.validate(analysis) is True

    def test_validate_missing_fields(self) -> None:
        analysis = {"safety_impact": "high"}
        assert self.engine.validate(analysis) is False

    def test_calculate_critical_severity(self) -> None:
        analysis = {
            "safety_impact": "catastrophic",
            "system_function": "core",
            "compliance_impact": True,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 5
        assert len(result.decision_path) == 4
        assert "CRITICAL" in result.justification or "catastrophic" in result.justification

    def test_calculate_low_severity(self) -> None:
        analysis = {
            "safety_impact": "none",
            "system_function": "auxiliary",
            "compliance_impact": False,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 1

    def test_calculate_moderate_severity(self) -> None:
        analysis = {
            "safety_impact": "moderate",
            "system_function": "important",
            "compliance_impact": False,
        }
        result = self.engine.calculate(analysis)
        assert result.score == 3

    def test_compliance_bonus_caps_at_5(self) -> None:
        analysis = {
            "safety_impact": "high",
            "system_function": "core",
            "compliance_impact": True,
        }
        result = self.engine.calculate(analysis)
        assert result.score <= 5

    def test_decision_path_steps(self) -> None:
        analysis = {
            "safety_impact": "moderate",
            "system_function": "important",
            "compliance_impact": True,
        }
        result = self.engine.calculate(analysis)
        steps = [step["step"] for step in result.decision_path]
        assert "safety_impact_assessment" in steps
        assert "system_function_assessment" in steps
        assert "compliance_check" in steps
        assert "final_calculation" in steps
