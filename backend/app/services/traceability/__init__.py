"""RAVEN Layer 6 — traceability pure services.

Implements sections 2 (derivation), 4 (orphans), 5 (impact), 6.2/6.3
(diff), 7 (matrix) and 8 (graph) of the TRACEABILITY MATRIX spec as
pure functions over an in-memory :class:`TraceSnapshot`. No LLM, no DB,
no network, no clock.

Node ids are opaque strings (``str(requirement.id)`` for the UUID keys
used by RAVEN). The functions never inspect id format.
"""

from app.services.traceability.snapshot import TraceSnapshot

__all__ = ["TraceSnapshot"]
