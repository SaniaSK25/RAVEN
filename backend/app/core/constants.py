from enum import IntEnum, StrEnum


class RequirementStatus(StrEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class SeverityScore(IntEnum):
    MINOR = 1
    LOW = 2
    MODERATE = 3
    HIGH = 4
    CRITICAL = 5


class ProbabilityScore(IntEnum):
    REMOTE = 1
    LOW = 2
    MODERATE = 3
    HIGH = 4
    ALMOST_CERTAIN = 5


class DetectabilityScore(IntEnum):
    HIGH = 1
    MODERATE = 2
    LOW = 3
    VERY_LOW = 4
    ALMOST_IMPOSSIBLE = 5


class RiskBand(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AssuranceLevel(StrEnum):
    SCRIPTED = "SCRIPTED"
    SEMI_SCRIPTED = "SEMI_SCRIPTED"
    MANUAL = "MANUAL"
    OBSERVATION = "OBSERVATION"


RISK_BAND_THRESHOLDS: dict[str, tuple[int, int]] = {
    RiskBand.LOW: (1, 25),
    RiskBand.MEDIUM: (26, 50),
    RiskBand.HIGH: (51, 80),
    RiskBand.CRITICAL: (81, 125),
}

ASSURANCE_MAPPING: dict[str, dict[str, object]] = {
    RiskBand.CRITICAL: {
        "level": AssuranceLevel.SCRIPTED,
        "generate_test_script": True,
        "reason": "Requirement falls under CRITICAL risk. Full scripted assurance required.",
    },
    RiskBand.HIGH: {
        "level": AssuranceLevel.SCRIPTED,
        "generate_test_script": True,
        "reason": "Requirement falls under HIGH risk. Scripted assurance required.",
    },
    RiskBand.MEDIUM: {
        "level": AssuranceLevel.SEMI_SCRIPTED,
        "generate_test_script": True,
        "reason": "Requirement falls under MEDIUM risk. Semi-scripted assurance recommended.",
    },
    RiskBand.LOW: {
        "level": AssuranceLevel.MANUAL,
        "generate_test_script": False,
        "reason": "Requirement falls under LOW risk. Manual assurance sufficient.",
    },
}
