"""
Import all SQLAlchemy models here.

Alembic discovers database tables through these imports.
Do NOT define another Base class in this file.
"""

from app.db.base_class import Base
from app.models.assurance_decision import AssuranceDecision
from app.models.compliance_result import ComplianceResult
from app.models.configuration_version import ConfigurationVersion
from app.models.detectability_result import DetectabilityResult
from app.models.evidence import Evidence
from app.models.probability_result import ProbabilityResult
from app.models.prompt_version import PromptVersion

# Core Models
from app.models.requirement import Requirement
from app.models.requirement_version import RequirementVersion
from app.models.risk_assessment import RiskAssessment
from app.models.severity_result import SeverityResult
from app.models.test_script import TestScript

__all__ = [
    "AssuranceDecision",
    "Base",
    "ComplianceResult",
    "ConfigurationVersion",
    "DetectabilityResult",
    "Evidence",
    "ProbabilityResult",
    "PromptVersion",
    "Requirement",
    "RequirementVersion",
    "RiskAssessment",
    "SeverityResult",
    "TestScript",
]
