"""Layer 4 core — assurance decision from scores (deterministic).

The severity floor is checked FIRST and ignores the band: severity >= 4
always means scripted testing. Otherwise the band decides:
High -> scripted, Medium -> exploratory, Low -> unscripted.
Pure function: no LLM, no DB, no network.
"""


def decide_assurance(severity_score: int, band: str) -> dict:
    if not isinstance(severity_score, int) or not 1 <= severity_score <= 5:
        raise ValueError(f"severity_score must be an int 1-5, got {severity_score!r}.")
    if band not in ("Low", "Medium", "High"):
        raise ValueError(f"band must be Low/Medium/High, got {band!r}.")

    if severity_score >= 4:
        return {
            "assurance_level": "scripted",
            "generate_test": True,
            "rule_id": "ASR-SEV-FLOOR",
            "reason": (
                f"Severity {severity_score} >= 4 forces scripted testing "
                f"regardless of band ({band})."
            ),
        }
    if band == "High":
        return {
            "assurance_level": "scripted",
            "generate_test": True,
            "rule_id": "ASR-BAND-HIGH",
            "reason": "High band requires scripted testing.",
        }
    if band == "Medium":
        return {
            "assurance_level": "exploratory",
            "generate_test": False,
            "rule_id": "ASR-BAND-MEDIUM",
            "reason": "Medium band requires exploratory testing.",
        }
    return {
        "assurance_level": "unscripted",
        "generate_test": False,
        "rule_id": "ASR-BAND-LOW",
        "reason": "Low band allows unscripted testing.",
    }
