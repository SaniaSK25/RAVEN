"""Graph API builder (spec section 8). Pure function over a snapshot."""

from __future__ import annotations


def build_graph(
    snapshot,
    orphans: list | None = None,
    requirement_key: str | None = None,
    include_inactive: bool = False,
    requirement_version_id: str | None = None,
    requirement_version_number: int | None = None,
    is_version_current: bool = True,
) -> dict:
    """Build ``{"nodes", "edges", "summary"}`` for frontend consumption.

    When a specific ``requirement_version_id`` is provided only the current
    assessment for that version is emitted (superseded assessments that share
    the same version are dropped).

    When ``is_version_current`` is False the graph enters **orphan mode**:
    no requirement node is emitted at all. The old version's risk, assurance
    and test nodes are emitted as orphaned artifacts, still connected to each
    other, so the graph shows a disconnected chain that belongs to a version
    that has been superseded.
    """
    orphans = orphans or []
    orphan_nodes = {(o.entity_type, o.entity_id) for o in orphans}
    orphan_mode = requirement_version_id is not None and not is_version_current

    nodes: dict[str, dict] = {}
    risk_requirements = {}

    # --- Requirement nodes -------------------------------------------------
    # In orphan mode the requirement has been superseded, so it is not shown.
    if not orphan_mode:
        for req in snapshot.requirements.values():
            if requirement_key and req.req_key != requirement_key:
                continue
            nodes[f"requirement:{req.id}"] = {
                "id": f"requirement:{req.id}",
                "type": "requirement",
                "label": req.req_key,
                "stale": False,
                "orphan": ("requirement", req.id) in orphan_nodes,
                "orphaned": False,
                "meta": {
                    "version": req.version,
                    "status": req.status,
                    "change_pending": req.id in snapshot.open_change_requirement_ids,
                },
            }

    # --- Risk nodes --------------------------------------------------------
    for risk in snapshot.risks.values():
        if (
            requirement_version_id is not None
            and risk.requirement_version_id != requirement_version_id
        ):
            continue
        # Only the current assessment for a version — superseded rows sharing
        # the same requirement_version_id must not appear as duplicate nodes.
        if requirement_version_id is not None and not risk.is_current:
            continue
        requirement = snapshot.requirements.get(risk.requirement_id)
        requirement_label = requirement.req_key if requirement else "Unknown requirement"
        risk_requirements[risk.id] = requirement_label
        if orphan_mode:
            label = (
                f"Orphaned Risk · {requirement_label} · v{requirement_version_number}"
            )
        elif requirement_version_id is not None:
            label = f"Risk assessment · {requirement_label} · v{requirement_version_number}"
        else:
            label = f"Risk assessment · {requirement_label}"
        nodes[f"risk:{risk.id}"] = {
            "id": f"risk:{risk.id}",
            "type": "risk",
            "label": label,
            "stale": risk.freshness in ("stale", "superseded"),
            "orphan": ("risk", risk.id) in orphan_nodes,
            "orphaned": orphan_mode,
            "meta": {
                "version": risk.requirement_version_id,
                "severity": risk.severity,
                "probability": risk.probability,
                "detectability": risk.detectability,
                "rpn": risk.rpn,
                "band": risk.band,
            },
        }

    # --- Assurance nodes ---------------------------------------------------
    scoped_risk_ids = {
        risk_id
        for risk_id, risk in snapshot.risks.items()
        if requirement_version_id is None
        or (
            risk.requirement_version_id == requirement_version_id
            and risk.is_current
        )
    }
    for decision in snapshot.decisions.values():
        if requirement_version_id is not None and decision.risk_id not in scoped_risk_ids:
            continue
        requirement_label = risk_requirements.get(decision.risk_id, "Requirement")
        if orphan_mode:
            label = f"Orphaned Assurance · {requirement_label} · v{requirement_version_number}"
        else:
            label = f"{decision.level.title()} assurance · {requirement_label}"
        nodes[f"assurance:{decision.id}"] = {
            "id": f"assurance:{decision.id}",
            "type": "assurance",
            "label": label,
            "stale": decision.freshness in ("stale", "superseded"),
            "orphan": ("assurance", decision.id) in orphan_nodes,
            "orphaned": orphan_mode,
            "meta": {
                "level": decision.level,
                "reason_code": decision.reason_code,
                "method": decision.method,
            },
        }

    # --- Test nodes --------------------------------------------------------
    for test in snapshot.tests.values():
        if (
            requirement_version_id is not None
            and test.requirement_version_id != requirement_version_id
        ):
            continue
        requirement_label = risk_requirements.get(test.risk_id or "")
        if orphan_mode:
            identifier = test.external_code or test.title
            label = (
                f"Orphaned Test · {identifier}"
                if identifier
                else f"Orphaned Test · v{requirement_version_number}"
            )
        else:
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
            "orphaned": orphan_mode,
            "meta": {
                "title": test.title,
                "origin": test.origin,
                "test_type": test.test_type,
            },
        }

    # --- Edges -------------------------------------------------------------
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
        # Orphan artifacts are intentionally disconnected from the requirement.
        if orphan_mode and (
            source.startswith("requirement:") or target.startswith("requirement:")
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

    # --- Focus mode --------------------------------------------------------
    if requirement_key and not orphan_mode:
        # Keep only the connected component of the requirement.
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
