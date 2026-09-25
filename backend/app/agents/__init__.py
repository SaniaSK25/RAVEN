from __future__ import annotations

from typing import Any

from app.agents.analyzer import RequirementAnalyzer
from app.agents.base import BaseAgent, PlaceholderAgent
from app.agents.compliance_analyzer import ComplianceAnalyzer
from app.agents.registry import AGENTS, agent_infos, get_agent
from app.agents.script_generator import TestScriptGenerator


async def run_placeholder(agent_key: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Run a placeholder agent. Always raises HTTP 501 until an implementation lands."""
    return await get_agent(agent_key).run(payload)


__all__ = [
    "AGENTS",
    "BaseAgent",
    "ComplianceAnalyzer",
    "PlaceholderAgent",
    "RequirementAnalyzer",
    "TestScriptGenerator",
    "agent_infos",
    "get_agent",
    "run_placeholder",
]
