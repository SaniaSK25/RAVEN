from app.schemas.risk import DetectabilityResult


class DetectabilityEngine:
    DETECTION_METHOD_MAP: dict[str, int] = {
        "automated_monitoring": 1,
        "manual_testing": 3,
        "peer_review": 2,
        "inspection": 4,
        "none": 5,
    }

    DETECTION_COVERAGE_THRESHOLDS: list[tuple[float, int]] = [
        (0.9, 1),
        (0.75, 2),
        (0.5, 3),
        (0.25, 4),
        (0.0, 5),
    ]

    RESPONSE_TIME_MAP: dict[str, int] = {
        "immediate": 1,
        "fast": 2,
        "moderate": 3,
        "slow": 4,
        "none": 5,
    }

    def validate(self, analysis: dict) -> bool:
        required_keys = {"detection_method", "detection_coverage"}
        return required_keys.issubset(analysis.keys())

    def build_decision_path(self, analysis: dict) -> list[dict]:
        path: list[dict] = []

        detection_method = analysis.get("detection_method", "none")
        method_score = self.DETECTION_METHOD_MAP.get(detection_method, 5)
        path.append(
            {
                "step": "detection_method_assessment",
                "input": detection_method,
                "score": method_score,
                "rule": f"Detection method '{detection_method}' maps to score {method_score}",
            }
        )

        detection_coverage = analysis.get("detection_coverage", 0.0)
        coverage_score = 5
        for threshold, score in self.DETECTION_COVERAGE_THRESHOLDS:
            if detection_coverage >= threshold:
                coverage_score = score
                break
        path.append(
            {
                "step": "detection_coverage_assessment",
                "input": detection_coverage,
                "score": coverage_score,
                "rule": f"Detection coverage {detection_coverage:.0%} maps to score {coverage_score}",
            }
        )

        response_time = analysis.get("response_time", "none")
        response_score = self.RESPONSE_TIME_MAP.get(response_time, 5)
        path.append(
            {
                "step": "response_time_assessment",
                "input": response_time,
                "score": response_score,
                "rule": f"Response time '{response_time}' maps to score {response_score}",
            }
        )

        final_score = min(max(method_score, coverage_score, response_score), 5)
        path.append(
            {
                "step": "final_calculation",
                "rule": f"max(method={method_score}, coverage={coverage_score}, response={response_score}) = {final_score}",
            }
        )

        return path

    def build_justification(self, analysis: dict, decision_path: list[dict]) -> str:
        method = analysis.get("detection_method", "none")
        coverage = analysis.get("detection_coverage", 0.0)
        response = analysis.get("response_time", "none")
        final_step = decision_path[-1]
        score_str = final_step.get("rule", "").split("=")[-1].strip()
        return (
            f"Detectability assessed as {score_str} based on: "
            f"detection method '{method}', "
            f"coverage {coverage:.0%}, "
            f"response time '{response}'."
        )

    def calculate(self, analysis: dict) -> DetectabilityResult:
        decision_path = self.build_decision_path(analysis)
        justification = self.build_justification(analysis, decision_path)
        final_step = decision_path[-1]
        score_str = final_step.get("rule", "").split("=")[-1].strip()
        score = int(score_str) if score_str.isdigit() else 1
        return DetectabilityResult(
            score=score,
            decision_path=decision_path,
            justification=justification,
        )
