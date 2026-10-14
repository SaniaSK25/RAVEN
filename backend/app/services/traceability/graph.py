"""Graph API builder (spec section 8). Pure function over a snapshot."""

from __future__ import annotations


def build_graph(
    snapshot,
    orphans: list | None = None,
    requirement_key: str | None = None,
    include_inactive: bool = False,
) -> dict:
    """Build ``{"nodes", "edges", "summary"}`` for frontend consumption."""
    orphans = orphans or []
    orphan_nodes = {(o.entity_type, o.entity_id) for o in orphans}

    nodes: dict[str, dict] = {}
    for req in snapshot.requirements.values():
        if requirement_key and req.req_key != requirement_key:
            continue
        nodes[f"requirement:{req.id}"] = {
            "id": f"requirement:{req.id}",
            "type": "requirement",
            "label": req.req_key,
            "stale": False,
            "orphan": ("requirement", req.id) in orphan_nodes,
            "meta": {
                "version": req.version,
                "status": req.status,
                "change_pending": req.id in snapshot.open_change_requirement_ids,
            },
        }
    for risk in snapshot.risks.values():
        nodes[f"risk:{risk.id}"] = {
            "id": f"risk:{risk.id}",
            "type": "risk",
            "label": f"RSK-{risk.id[:8]}",
            "stale": risk.freshness == "stale",
            "orphan": ("risk", risk.id) in orphan_nodes,
            "meta": {
                "version": risk.requirement_version_id,
                "severity": risk.severity,
                "probability": risk.probability,
                "detectability": risk.detectability,
                "rpn": risk.rpn,
                "band": risk.band,
            },
        }
    for decision in snapshot.decisions.values():
        nodes[f"assurance:{decision.id}"] = {
            "id": f"assurance:{decision.id}",
            "type": "assurance",
            "label": f"{decision.level}:{decision.reason_code or decision.id[:8]}",
            "stale": decision.freshness == "stale",
            "orphan": ("assurance", decision.id) in orphan_nodes,
            "meta": {
                "level": decision.level,
                "reason_code": decision.reason_code,
                "method": decision.method,
            },
        }
    for test in snapshot.tests.values():
        label = test.external_code or f"TS-{test.id[:8]}"
        nodes[f"test:{test.id}"] = {
            "id": f"test:{test.id}",
            "type": "test",
            "label": label,
            "stale": test.freshness == "stale",
            "orphan": ("test", test.id) in orphan_nodes,
            "meta": {
                "title": test.title,
                "origin": test.origin,
                "test_type": test.test_type,
            },
        }

    edges: list[dict] = []
    for link in snapshot.links:
        if not link.active and not include_inactive:
            continue
        if link.suppressed and not include_inactive:
            continue
        source, target = (
            f"{link.src_type}:{link.src_id}",
            f"{link.dst_type}:{link.dst_id}",
        )
        if requirement_key and source not in nodes and target not in nodes:
            continue
        edges.append(
            {
                "id": f"link:{link.id}",
                "source": source,
                "target": target,
                "type": link.link_type,
                "origin": link.origin,
                "active": link.active,
                "stale": link.stale,
                "suppressed": link.suppressed,
            }
        )

    if requirement_key:
        # Focus mode: keep only the connected component of the requirement.
        wanted = next(
            (
                nid
                for nid, n in nodes.items()
                if n["type"] == "requirement" and n["label"] == requirement_key
            ),
            None,
        )
        if wanted is not None:
            adjacency: dict[str, set[str]] = {}
            for edge in edges:
                adjacency.setdefault(edge["source"], set()).add(edge["target"])
                adjacency.setdefault(edge["target"], set()).add(edge["source"])
            seen = {wanted}
            frontier = [wanted]
            while frontier:
                current = frontier.pop()
                for neighbour in adjacency.get(current, ()):
                    if neighbour in nodes and neighbour not in seen:
                        seen.add(neighbour)
                        frontier.append(neighbour)
            nodes = {nid: n for nid, n in nodes.items() if nid in seen}
            edges = [e for e in edges if e["source"] in seen and e["target"] in seen]

    nodes_list = [nodes[nid] for nid in sorted(nodes)]
    edges.sort(key=lambda e: e["id"])
    stale_edges = sum(1 for e in edges if e["stale"])
    return {
        "nodes": nodes_list,
        "edges": edges,
        "summary": {
            "nodes": len(nodes_list),
            "edges": len(edges),
            "stale_nodes": sum(1 for n in nodes_list if n["stale"]),
            "stale_edges": stale_edges,
            "orphan_nodes": sum(1 for n in nodes_list if n["orphan"]),
        },
    }
