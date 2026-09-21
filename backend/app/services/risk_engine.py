from app.core.constants import RISK_BAND_THRESHOLDS, RiskBand
from app.schemas.risk import RiskAssessmentResponse


class RiskEngine:
    def calculate_rpn(self, severity: int, probability: int, detectability: int) -> int:
        return severity * probability * detectability

    def determine_risk_band(self, rpn: int) -> RiskBand:
        for band, (low, high) in RISK_BAND_THRESHOLDS.items():
            if low <= rpn <= high:
                return RiskBand(band)
        return RiskBand.CRITICAL

    def build_decision_path(
        self,
        severity: int,
        probability: int,
        detectability: int,
        rpn: int,
        risk_band: RiskBand,
    ) -> list[dict]:
        return [
            {
                "step": "rpn_calculation",
                "inputs": {
                    "severity": severity,
                    "probability": probability,
                    "detectability": detectability,
                },
                "rule": f"RPN = S({severity}) x P({probability}) x D({detectability}) = {rpn}",
            },
            {
                "step": "risk_band_determination",
                "input": rpn,
                "risk_band": risk_band,
                "rule": f"RPN {rpn} falls into '{risk_band}' band",
            },
        ]

    def calculate(
        self,
        severity: int,
        probability: int,
        detectability: int,
    ) -> tuple[int, RiskBand, list[dict]]:
        rpn = self.calculate_rpn(severity, probability, detectability)
        risk_band = self.determine_risk_band(rpn)
        decision_path = self.build_decision_path(
            severity, probability, detectability, rpn, risk_band
        )
        return rpn, risk_band, decision_path
