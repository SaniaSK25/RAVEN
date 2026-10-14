"""Shared helpers for the terminal traceability demo.

This folder is a scratch demo area (NOT part of the pytest suite).
It uses its own SQLite file so the real `raven.db` is never touched.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "trace_demo.db"


def get_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.db.base import Base

    engine = create_engine(f"sqlite:///{DB_PATH}")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def seed_scenario(session):
    """Seed 5 requirements covering every assurance outcome."""
    from app.models.assurance_decision import AssuranceDecision
    from app.models.configuration_version import ConfigurationVersion
    from app.models.engine_results import (
        DetectabilityResult,
        ProbabilityResult,
        SeverityResult,
    )
    from app.models.enums import (
        AssuranceLevel,
        RequirementStatus,
        RiskBand,
        TestScriptStatus,
    )
    from app.models.prompt_version import PromptVersion
    from app.models.requirement import Requirement
    from app.models.requirement_version import RequirementVersion
    from app.models.risk_assessment import RiskAssessment
    from app.models.test_script import TestScript

    config = ConfigurationVersion(version="1.0.0", config_hash="c" * 64)
    prompt = PromptVersion(agent_name="demo", version=1, prompt="p", hash="d" * 64)
    session.add_all([config, prompt])
    session.flush()

    def add_requirement(key, text):
        req = Requirement(
            title=key, description=text, req_key=key,
            status=RequirementStatus.DRAFT, created_by="demo",
        )
        session.add(req)
        session.flush()
        ver = RequirementVersion(
            requirement_id=req.id, version_number=1, text=text,
            hash_sha256=sha(text), is_current=True,
        )
        session.add(ver)
        session.flush()
        req.current_version_id = ver.id
        return req, ver

    def add_analysis(ver, sev, prob, det, band, level, rule):
        risk = RiskAssessment(
            requirement_version_id=ver.id, evidence_id=__import__("uuid").uuid4(),
            rule_config_version_id=config.id, gxp_impact=True, gxp_reason="g",
            gamp_category="4", gamp_reason="g", rpn=sev * prob * det,
            band=band, status="FINAL", is_current=True,
        )
        session.add(risk)
        session.flush()
        session.add_all(
            [
                SeverityResult(
                    risk_assessment_id=risk.id, score=sev, rule_id="SEV-Rx",
                    rule_version="1", decision_path=[], reasoning="r",
                ),
                ProbabilityResult(
                    risk_assessment_id=risk.id, score=prob, rule_id="PROB-Sx",
                    rule_version="1", decision_path=[], weighted_sum=7.0,
                    gamp_modifier=0.0, reasoning="r",
                ),
                DetectabilityResult(
                    risk_assessment_id=risk.id, score=det, rule_id="DET-Sx",
                    rule_version="1", decision_path=[], controls_floor=None,
                    reasoning="r",
                ),
            ]
        )
        decision = AssuranceDecision(
            risk_assessment_id=risk.id, assurance_level=level, rule_id=rule,
            rule_version="1", generate_test=(level == AssuranceLevel.SCRIPTED),
            reasoning="r", decision_path={},
        )
        session.add(decision)
        session.flush()
        # Back-link the sub-results the way the engines persist them.
        risk.severity_result_id = session.query(SeverityResult).filter(
            SeverityResult.risk_assessment_id == risk.id
        ).one().id
        risk.probability_result_id = session.query(ProbabilityResult).filter(
            ProbabilityResult.risk_assessment_id == risk.id
        ).one().id
        risk.detectability_result_id = session.query(DetectabilityResult).filter(
            DetectabilityResult.risk_assessment_id == risk.id
        ).one().id
        return risk, decision

    def add_script(ver, decision, title):
        script = TestScript(
            requirement_version_id=ver.id, assurance_decision_id=decision.id,
            prompt_version_id=prompt.id, script=f"Steps for {title}",
            status=TestScriptStatus.DRAFT, version=1, title=title,
        )
        session.add(script)
        session.flush()
        return script

    # LIMS-001: scripted, HIGH band, 2 generated scripts.
    r1, v1 = add_requirement("LIMS-001", "The system shall enforce unique user IDs.")
    _, d1 = add_analysis(
        v1, 4, 4, 4, RiskBand.HIGH, AssuranceLevel.SCRIPTED, "ASR-BAND-HIGH"
    )
    add_script(v1, d1, "Verify unique user IDs")
    add_script(v1, d1, "Verify duplicate ID rejected")
    # LIMS-002: exploratory, MEDIUM band, no scripts.
    r2, v2 = add_requirement("LIMS-002", "The audit log shall be searchable.")
    add_analysis(
        v2, 3, 3, 3, RiskBand.MEDIUM, AssuranceLevel.EXPLORATORY, "ASR-BAND-MEDIUM"
    )
    # LIMS-003: supplier-leverage, LOW band, no scripts.
    r3, v3 = add_requirement("LIMS-003", "The OS shall be a supported version.")
    add_analysis(
        v3, 2, 2, 2, RiskBand.LOW, AssuranceLevel.UNSCRIPTED, "ASR-BAND-LOW"
    )
    # LIMS-004: never analysed.
    add_requirement("LIMS-004", "Reports shall export to PDF.")
    # LIMS-005: severity-5 floor -> scripted despite MEDIUM band, 1 script.
    r5, v5 = add_requirement("LIMS-005", "Sterile barrier integrity shall hold.")
    _, d5 = add_analysis(
        v5, 5, 3, 3, RiskBand.MEDIUM, AssuranceLevel.SCRIPTED, "ASR-SEV-FLOOR"
    )
    add_script(v5, d5, "Verify barrier integrity")

    session.commit()
    return {"LIMS-001": r1, "LIMS-002": r2, "LIMS-003": r3, "LIMS-005": r5}
