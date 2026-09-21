from app.schemas.risk import SeverityResult


class SeverityEngine:
    SAFETY_IMPACT_MAP: dict[str, int] = {
        "none": 1,
        "minor": 2,
        "moderate": 3,
        "high": 4,
        "catastrophic": 5,
    }

    SYSTEM_FUNCTION_MAP: dict[str, int] = {
        "auxiliary": 1,
        "supporting": 2,
        "important": 3,
        "critical": 4,
        "core": 5,
    }

    COMPLIANCE_BONUS: int = 1

    def validate(self, analysis: dict) -> bool:
        required_keys = {"safety_impact", "system_function"}
        return required_keys.issubset(analysis.keys())

    def build_decision_path(self, analysis: dict) -> list[dict]:
        path: list[dict] = []
        safety_impact = analysis.get("safety_impact", "none")
        safety_score = self.SAFETY_IMPACT_MAP.get(safety_impact, 1)
        path.append(
            {
                "step": "safety_impact_assessment",
                "input": safety_impact,
                "score": safety_score,
                "rule": f"Safety impact '{safety_impact}' maps to score {safety_score}",
            }
        )

        system_function = analysis.get("system_function", "auxiliary")
        function_score = self.SYSTEM_FUNCTION_MAP.get(system_function, 1)
        path.append(
            {
                "step": "system_function_assessment",
                "input": system_function,
                "score": function_score,
                "rule": f"System function '{system_function}' maps to score {function_score}",
            }
        )

        compliance_impact = analysis.get("compliance_impact", False)
        compliance_bonus = self.COMPLIANCE_BONUS if compliance_impact else 0
        path.append(
            {
                "step": "compliance_check",
                "input": compliance_impact,
                "bonus": compliance_bonus,
                "rule": f"Compliance impact {'adds bonus' if compliance_impact else 'no bonus'}",
            }
        )

        final_score = min(max(safety_score, function_score) + compliance_bonus, 5)
        path.append(
            {
                "step": "final_calculation",
                "rule": f"max(safety={safety_score}, function={function_score}) + compliance_bonus={compliance_bonus} = {final_score}",
            }
        )

        return path

    def build_justification(self, analysis: dict, decision_path: list[dict]) -> str:
        safety_impact = analysis.get("safety_impact", "none")
        system_function = analysis.get("system_function", "auxiliary")
        compliance = analysis.get("compliance_impact", False)
        final_step = decision_path[-1]
        score = final_step.get("score", final_step.get("rule", "").split("=")[-1].strip())
        parts = [
            f"Severity assessed as {score} based on:",
            f"safety impact '{safety_impact}',",
            f"system function criticality '{system_function}',",
        ]
        if compliance:
            parts.append("with compliance requirement adding +1 bonus.")
        else:
            parts.append("without compliance requirement bonus.")
        return " ".join(parts)

    def calculate(self, analysis: dict) -> SeverityResult:
        decision_path = self.build_decision_path(analysis)
        justification = self.build_justification(analysis, decision_path)
        final_step = decision_path[-1]
        score_str = final_step.get("rule", "").split("=")[-1].strip()
        score = int(score_str) if score_str.isdigit() else 1
        return SeverityResult(
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
