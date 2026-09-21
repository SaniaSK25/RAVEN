from app.core.constants import ASSURANCE_MAPPING, RiskBand
from app.schemas.assurance import AssuranceResult


class AssuranceEngine:
    def validate(self, risk_band: str) -> bool:
        try:
            RiskBand(risk_band)
            return True
        except ValueError:
            return False

    def build_decision_path(self, risk_band: RiskBand, result: AssuranceResult) -> list[dict]:
        return [
            {
                "step": "risk_band_lookup",
                "input": risk_band,
                "rule": f"Risk band '{risk_band}' mapped to assurance level '{result.level}'",
            },
            {
                "step": "test_script_decision",
                "input": result.generate_test_script,
                "rule": f"Test script generation {'required' if result.generate_test_script else 'not required'} for {risk_band} risk",
            },
        ]

    def build_justification(self, risk_band: RiskBand, result: AssuranceResult) -> str:
        return result.reason

    def calculate(self, risk_band: str) -> AssuranceResult:
        band = RiskBand(risk_band)
        mapping = ASSURANCE_MAPPING[band]
        result = AssuranceResult(
            level=mapping["level"],  # type: ignore[arg-type]
            generate_test_script=mapping["generate_test_script"],  # type: ignore[arg-type]
            reason=mapping["reason"],  # type: ignore[arg-type]
        )
        return result
