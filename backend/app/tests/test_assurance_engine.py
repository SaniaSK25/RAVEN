import pytest

from app.services.assurance_engine import AssuranceEngine


class TestAssuranceEngine:
    def setup_method(self) -> None:
        self.engine = AssuranceEngine()

    def test_validate_valid_band(self) -> None:
        assert self.engine.validate("LOW") is True
        assert self.engine.validate("MEDIUM") is True
        assert self.engine.validate("HIGH") is True
        assert self.engine.validate("CRITICAL") is True

    def test_validate_invalid_band(self) -> None:
        assert self.engine.validate("INVALID") is False
        assert self.engine.validate("") is False

    def test_calculate_critical(self) -> None:
        result = self.engine.calculate("CRITICAL")
        assert result.level == "SCRIPTED"
        assert result.generate_test_script is True
        assert "CRITICAL" in result.reason

    def test_calculate_high(self) -> None:
        result = self.engine.calculate("HIGH")
        assert result.level == "SCRIPTED"
        assert result.generate_test_script is True
        assert "HIGH" in result.reason

    def test_calculate_medium(self) -> None:
        result = self.engine.calculate("MEDIUM")
        assert result.level == "SEMI_SCRIPTED"
        assert result.generate_test_script is True
        assert "MEDIUM" in result.reason

    def test_calculate_low(self) -> None:
        result = self.engine.calculate("LOW")
        assert result.level == "MANUAL"
        assert result.generate_test_script is False
        assert "LOW" in result.reason
