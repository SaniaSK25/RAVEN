"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Background, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { Traceability, TraceNodeType } from "@/lib/domain";

interface TraceGraphProps {
  trace: Traceability;
  requirementId: string;
  /** False for trace-only stubs with no detail page (nodes don't navigate). */
  canOpenDetail: boolean;
}

const NODE_STYLE: Record<TraceNodeType, { background: string; border: string }> = {
  requirement: { background: "#fafafa", border: "1px solid #52525b" },
  risk: { background: "#fef2f2", border: "1px solid #b91c1c" },
  assurance: { background: "#f4f4f5", border: "1px solid #a1a1aa" },
  test: { background: "#eff6ff", border: "1px solid #1d4ed8" },
};

function targetFor(nodeId: string, type: TraceNodeType, requirementId: string): string | null {
  if (nodeId.startsWith("endpoint-")) return null;
  switch (type) {
    case "requirement":
      return `/requirements/${requirementId}`;
    case "risk":
      return `/requirements/${requirementId}?tab=risk`;
    case "assurance":
      return `/requirements/${requirementId}?tab=assurance`;
    case "test":
      return `/requirements/${requirementId}?tab=tests`;
  }
}

/**
 * Exploration graph for one requirement chain. Zoom, pan, select, and
 * click-to-navigate only — no editing.
 */
export default function TraceGraph({ trace, requirementId, canOpenDetail }: TraceGraphProps) {
  const router = useRouter();
  // React Flow measures the DOM, so render it only after client hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { nodes, edges } = useMemo(() => {
    const order: TraceNodeType[] = ["requirement", "risk", "assurance", "test"];
    const columns = new Map<TraceNodeType, number>();
    const rfNodes: Node[] = trace.nodes.map((node) => {
      const column = order.indexOf(node.type);
      const seen = columns.get(node.type) ?? 0;
      columns.set(node.type, seen + 1);
      const style = NODE_STYLE[node.type];
      return {
        id: node.id,
        position: { x: column * 260, y: seen * 110 },
        data: { label: `${node.type.toUpperCase()}\n${node.label}` },
        style: {
          ...style,
          color: "#18181b",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "pre-line",
          width: 200,
          textAlign: "center",
          borderRadius: 8,
        },
      };
    });
    const rfEdges: Edge[] = trace.edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      label: edge.type,
      labelStyle: { fontSize: 10, fill: "#71717a" },
      style: { stroke: "#a1a1aa" },
    }));
    return { nodes: rfNodes, edges: rfEdges };
  }, [trace]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    if (!canOpenDetail) return;
    const domain = trace.nodes.find((n) => n.id === node.id);
    if (!domain) return;
    const target = targetFor(domain.id, domain.type, requirementId);
    if (target) router.push(target);
  }

  if (!mounted) {
    return (
      <div
        aria-label="Loading chain graph"
        className="h-[420px] animate-pulse rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      />
    );
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <Background gap={20} color="#e4e4e7" />
      </ReactFlow>
    </div>
  );
}
