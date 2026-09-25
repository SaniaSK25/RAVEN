from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, ClassVar

from app.core.exceptions import AgentNotImplementedError


class BaseAgent(ABC):
    """Contract holder for a future AI agent.

    RAVEN deliberately ships no LLM integration. Every agent is a *documented*
    placeholder whose only job is to describe, at runtime, the exact interface an
    implementer must satisfy. The deterministic engines never call an agent: an
    agent produces evidence or draft text, which is then stored through the normal
    REST API and processed by the rule engines.

    To implement an agent:

    1. Subclass the placeholder (for example ``app.agents.analyzer.RequirementAnalyzer``).
    2. Implement ``run`` so it returns a payload matching ``response_model``.
    3. POST that payload to ``ingest_endpoint`` (or call the matching service).
    4. Never compute a compliance decision - the engines own severity, probability,
       detectability, RPN, assurance level and coverage status.
    """

    name: ClassVar[str] = "agent"
    version: ClassVar[str] = "0.0.0"
    purpose: ClassVar[str] = ""
    request_model: ClassVar[str] = ""
    response_model: ClassVar[str] = ""
    placeholder_service: ClassVar[str] = ""
    ingest_endpoint: ClassVar[str] = ""
    notes: ClassVar[str] = ""

    #: Human readable inventory of what the implementation may read.
    inputs: ClassVar[dict[str, str]] = {}
    #: Human readable inventory of what the implementation must return.
    outputs: ClassVar[dict[str, str]] = {}
    #: Ordered implementation steps for the developer who picks this up.
    steps: ClassVar[tuple[str, ...]] = ()
    #: Hard boundaries. Violating one of these breaks RAVEN's determinism claim.
    must_not: ClassVar[tuple[str, ...]] = ()
    #: Why this step is reproducible even though it is LLM assisted.
    determinism: ClassVar[str] = ""
    #: Configuration keys / settings the implementation should honour.
    settings: ClassVar[dict[str, str]] = {}

    @property
    def status(self) -> str:
        return "placeholder"

    def contract(self) -> dict[str, Any]:
        """Machine readable description of the integration contract."""
        return {
            "name": self.name,
            "version": self.version,
            "purpose": self.purpose,
            "status": self.status,
            "placeholder_service": self.placeholder_service,
            "request_model": self.request_model,
            "response_model": self.response_model,
            "ingest_endpoint": self.ingest_endpoint,
            "inputs": dict(self.inputs),
            "outputs": dict(self.outputs),
            "steps": list(self.steps),
            "must_not": list(self.must_not),
            "determinism": self.determinism,
            "settings": dict(self.settings),
            "notes": self.notes,
        }

    @abstractmethod
    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Produce the agent output for ``payload``."""
        raise NotImplementedError


class PlaceholderAgent(BaseAgent):
    """Base for the three agent placeholders shipped with the workbench.

    ``run`` refuses with HTTP 501 and returns the implementation contract in the
    error payload, so an integrator can see what is missing without reading code.
    """

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise AgentNotImplementedError(
            f"Agent '{self.name}' is a placeholder. Implement {self.placeholder_service} "
            f"and keep the {self.request_model} -> {self.response_model} contract, then "
            f"publish results via {self.ingest_endpoint}.",
            code="agent_not_implemented",
            details=self.contract(),
        )
