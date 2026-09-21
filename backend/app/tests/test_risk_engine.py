import pytest

from app.core.constants import RiskBand
from app.services.risk_engine import RiskEngine


class TestRiskEngine:
    def setup_method(self) -> None:
        self.engine = RiskEngine()

    def test_calculate_rpn(self) -> None:
        rpn = self.engine.calculate_rpn(5, 4, 3)
        assert rpn == 60

    def test_calculate_rpn_all_ones(self) -> None:
        rpn = self.engine.calculate_rpn(1, 1, 1)
        assert rpn == 1

    def test_calculate_rpn_max(self) -> None:
        rpn = self.engine.calculate_rpn(5, 5, 5)
        assert rpn == 125

    def test_determine_risk_band_low(self) -> None:
        assert self.engine.determine_risk_band(10) == RiskBand.LOW
        assert self.engine.determine_risk_band(25) == RiskBand.LOW

    def test_determine_risk_band_medium(self) -> None:
        assert self.engine.determine_risk_band(26) == RiskBand.MEDIUM
        assert self.engine.determine_risk_band(50) == RiskBand.MEDIUM

    def test_determine_risk_band_high(self) -> None:
        assert self.engine.determine_risk_band(51) == RiskBand.HIGH
        assert self.engine.determine_risk_band(80) == RiskBand.HIGH

    def test_determine_risk_band_critical(self) -> None:
        assert self.engine.determine_risk_band(81) == RiskBand.CRITICAL
        assert self.engine.determine_risk_band(125) == RiskBand.CRITICAL

    def test_calculate_full(self) -> None:
        rpn, risk_band, decision_path = self.engine.calculate(4, 3, 2)
        assert rpn == 24
        assert risk_band == RiskBand.LOW
        assert len(decision_path) == 2

    def test_decision_path_structure(self) -> None:
        _, _, decision_path = self.engine.calculate(5, 4, 3)
        steps = [step["step"] for step in decision_path]
        assert "rpn_calculation" in steps
        assert "risk_band_determination" in steps
