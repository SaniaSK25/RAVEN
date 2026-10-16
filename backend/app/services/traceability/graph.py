"""Graph API builder (spec section 8). Pure function over a snapshot."""

from __future__ import annotations


def build_graph(
    snapshot,
    orphans: list | None = None,
    requirement_key: str | None = None,
    include_inactive: bool = False,
    requirement_version_id: str | None = None,
    requirement_version_number: int | None = None,
) -> dict:
    """Build ``{"nodes", "edges", "summary"}`` for frontend consumption."""
    orphans = orphans or []
    orphan_nodes = {(o.entity_type, o.entity_id) for o in orphans}

    nodes: dict[str, dict] = {}
    risk_requirements = {}
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
        if (
            requirement_version_id is not None
            and risk.requirement_version_id != requirement_version_id
        ):
            continue
        requirement = snapshot.requirements.get(risk.requirement_id)
        requirement_label = requirement.req_key if requirement else "Unknown requirement"
        risk_requirements[risk.id] = requirement_label
        nodes[f"risk:{risk.id}"] = {
            "id": f"risk:{risk.id}",
            "type": "risk",
            "label": (
                f"Risk assessment · {requirement_label} · v{requirement_version_number}"
                if requirement_version_id is not None
                else f"Risk assessment · {requirement_label}"
            ),
            "stale": risk.freshness in ("stale", "superseded"),
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
    scoped_risk_ids = {
        risk_id
        for risk_id, risk in snapshot.risks.items()
        if requirement_version_id is None
        or risk.requirement_version_id == requirement_version_id
    }
    for decision in snapshot.decisions.values():
        if requirement_version_id is not None and decision.risk_id not in scoped_risk_ids:
            continue
        nodes[f"assurance:{decision.id}"] = {
            "id": f"assurance:{decision.id}",
            "type": "assurance",
            "label": (
                f"{decision.level.title()} assurance · "
                f"{risk_requirements.get(decision.risk_id, 'Requirement')}"
            ),
            "stale": decision.freshness in ("stale", "superseded"),
            "orphan": ("assurance", decision.id) in orphan_nodes,
            "meta": {
                "level": decision.level,
                "reason_code": decision.reason_code,
                "method": decision.method,
            },
        }
    for test in snapshot.tests.values():
        if (
            requirement_version_id is not None
            and test.requirement_version_id != requirement_version_id
        ):
            continue
        requirement_label = risk_requirements.get(test.risk_id or "")
        label = (
            test.external_code
            or test.title
            or (
                f"Test script · {requirement_label}"
                if requirement_label
                else "Test script"
            )
        )
        nodes[f"test:{test.id}"] = {
            "id": f"test:{test.id}",
            "type": "test",
            "label": label,
            "stale": test.freshness in ("stale", "superseded"),
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
        if requirement_version_id is not None and (
            source not in nodes or target not in nodes
        ):
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

    if requirement_version_id is not None:
        for node in nodes.values():
            if node["type"] == "requirement":
                node["meta"]["version"] = requirement_version_number

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
