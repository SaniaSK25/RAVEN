"""Link sync: the bridge between pure derivation and the database.

Sync applies :func:`derive_links` output to ``trace_links`` at the end
of every mutation, in the SAME transaction as the mutation itself.
See spec section 3.
"""

from __future__ import annotations


def link_stale(src_freshness: str | None, dst_freshness: str | None) -> bool:
    """A link is stale when either endpoint has freshness ``stale``."""
    return src_freshness == "stale" or dst_freshness == "stale"


def _freshness_of(snapshot, node_type: str, node_id: str) -> str | None:
    if node_type == "requirement":
        return None  # requirements are never stale
    if node_type == "risk":
        node = snapshot.risks.get(node_id)
    elif node_type == "assurance":
        node = snapshot.decisions.get(node_id)
    elif node_type == "test":
        node = snapshot.tests.get(node_id)
    else:
        return None
    return node.freshness if node is not None else None
