from app.models.requirement import Requirement
from app.models.risk import Risk 
from app.models.risk_score import RiskScore 
from app.models.assurance import AssuranceDecision
from app.models.test_script import TestScript 
from app.models.change_event import ChangeEvent 
from app.models.audit import AuditLog 
from app.models.user import User, Role 
from app.models.agent_config import AgentConfig 
from app.models.classification import Classification 
from app.models.compliance import ComplianceCheck
from app.models.export import ValidationExport
from app.models.traceability import TraceabilityNode, TraceabilityEdge

ALL_MODELS = [
    Requirement,
    Risk,
    RiskScore,
    AssuranceDecision,
    TestScript,
    ChangeEvent,
    AuditLog,
    User,
    Role,
    AgentConfig,
    Classification,
    ComplianceCheck,
    ValidationExport,
    TraceabilityNode,
    TraceabilityEdge
    5
]
