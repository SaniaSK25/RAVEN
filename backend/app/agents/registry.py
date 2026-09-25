from __future__ import annotations

from typing import Any

from app.agents.analyzer import RequirementAnalyzer
from app.agents.base import BaseAgent
from app.agents.compliance_analyzer import ComplianceAnalyzer
from app.agents.script_generator import TestScriptGenerator

#: Registry of the three future AI agents, keyed by API short name.
AGENTS: dict[str, BaseAgent] = {
    "agent1": RequirementAnalyzer(),
    "agent2": TestScriptGenerator(),
    "agent3": ComplianceAnalyzer(),
}

ALIASES = {
    "agent1": "agent1",
    "agent-1": "agent1",
    "agent2": "agent2",
    "agent-2": "agent2",
    "agent3": "agent3",
    "agent-3": "agent3",
}


def agent_infos() -> list[dict[str, Any]]:
    return [agent.contract() for agent in AGENTS.values()]


def get_agent(key: str) -> BaseAgent:
    return AGENTS[key]
