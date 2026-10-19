"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { Traceability, TraceNodeType } from "@/lib/domain";

interface TraceGraphProps {
  trace: Traceability;
}

const NODE_STYLE: Record<TraceNodeType, { background: string; border: string }> = {
  requirement: { background: "#fafafa", border: "1px solid #52525b" },
  risk: { background: "#fef2f2", border: "1px solid #b91c1c" },
  assurance: { background: "#f4f4f5", border: "1px solid #a1a1aa" },
  test: { background: "#eff6ff", border: "1px solid #1d4ed8" },
};

/**
 * Exploration graph for one requirement chain. Zoom uses explicit controls so
 * scrolling over the graph continues to scroll the page.
 */
export default function TraceGraph({ trace }: TraceGraphProps) {
  const [panEnabled, setPanEnabled] = useState(false);
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
        data: {
          label: `${{
            requirement: "Requirement",
            risk: "Risk assessment",
            assurance: "Assurance decision",
            test: "Test script",
          }[node.type]}\n${node.label}`,
        },
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
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={panEnabled}
        onPaneClick={() => setPanEnabled((enabled) => !enabled)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        className={`raven-trace-flow ${
          panEnabled
            ? "[&_.react-flow__pane]:cursor-grab [&_.react-flow__pane.dragging]:cursor-grabbing"
            : "[&_.react-flow__pane]:cursor-default [&_.react-flow__pane.dragging]:cursor-default"
        } [&_.react-flow__node]:cursor-default`}
      >
        <Background gap={20} color="#e4e4e7" />
        <Controls
          showInteractive={false}
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  );
}
