from app.schemas.risk import ProbabilityResult


class ProbabilityEngine:
    FAILURE_RATE_MAP: dict[str, int] = {
        "negligible": 1,
        "low": 2,
        "moderate": 3,
        "high": 4,
        "very_high": 5,
    }

    OPERATIONAL_EXPOSURE_MAP: dict[str, int] = {
        "rare": 1,
        "infrequent": 2,
        "periodic": 3,
        "frequent": 4,
        "continuous": 5,
    }

    ENVIRONMENTAL_BONUS: int = 1

    def validate(self, analysis: dict) -> bool:
        required_keys = {"failure_rate", "operational_exposure"}
        return required_keys.issubset(analysis.keys())

    def build_decision_path(self, analysis: dict) -> list[dict]:
        path: list[dict] = []

        failure_rate = analysis.get("failure_rate", "negligible")
        failure_score = self.FAILURE_RATE_MAP.get(failure_rate, 1)
        path.append(
            {
                "step": "failure_rate_assessment",
                "input": failure_rate,
                "score": failure_score,
                "rule": f"Failure rate '{failure_rate}' maps to score {failure_score}",
            }
        )

        operational_exposure = analysis.get("operational_exposure", "rare")
        exposure_score = self.OPERATIONAL_EXPOSURE_MAP.get(operational_exposure, 1)
        path.append(
            {
                "step": "operational_exposure_assessment",
                "input": operational_exposure,
                "score": exposure_score,
                "rule": f"Operational exposure '{operational_exposure}' maps to score {exposure_score}",
            }
        )

        environmental_stress = analysis.get("environmental_stress", False)
        env_bonus = self.ENVIRONMENTAL_BONUS if environmental_stress else 0
        path.append(
            {
                "step": "environmental_stress_check",
                "input": environmental_stress,
                "bonus": env_bonus,
                "rule": f"Environmental stress {'adds bonus' if environmental_stress else 'no bonus'}",
            }
        )

        final_score = min(max(failure_score, exposure_score) + env_bonus, 5)
        path.append(
            {
                "step": "final_calculation",
                "rule": f"max(failure={failure_score}, exposure={exposure_score}) + env_bonus={env_bonus} = {final_score}",
            }
        )

        return path

    def build_justification(self, analysis: dict, decision_path: list[dict]) -> str:
        failure_rate = analysis.get("failure_rate", "negligible")
        exposure = analysis.get("operational_exposure", "rare")
        env_stress = analysis.get("environmental_stress", False)
        final_step = decision_path[-1]
        score_str = final_step.get("rule", "").split("=")[-1].strip()
        parts = [
            f"Probability assessed as {score_str} based on:",
            f"failure rate '{failure_rate}',",
            f"operational exposure '{exposure}',",
        ]
        if env_stress:
            parts.append("with environmental stress adding +1 bonus.")
        else:
            parts.append("without environmental stress bonus.")
        return " ".join(parts)

    def calculate(self, analysis: dict) -> ProbabilityResult:
        decision_path = self.build_decision_path(analysis)
        justification = self.build_justification(analysis, decision_path)
        final_step = decision_path[-1]
        score_str = final_step.get("rule", "").split("=")[-1].strip()
        score = int(score_str) if score_str.isdigit() else 1
        return ProbabilityResult(
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
