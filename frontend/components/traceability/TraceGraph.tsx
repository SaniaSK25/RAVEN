"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Traceability, TraceNodeType } from "@/lib/domain";
import {
  TRACE_GRAPH_COLUMN_GAP,
  TRACE_GRAPH_CURRENT_STYLE,
  TRACE_GRAPH_EDGE_VISUALS,
  TRACE_GRAPH_NODE_WIDTH,
  TRACE_GRAPH_NODE_RADIUS,
  TRACE_GRAPH_ORPHAN_EDGE_COLOR,
  TRACE_GRAPH_ORPHAN_STYLE,
  TRACE_GRAPH_ROW_GAP,
  TRACE_GRAPH_TYPE_LABEL,
} from "@/lib/traceability-graph-visuals";

interface TraceGraphProps {
  trace: Traceability;
  requirementId: string;
}

/**
 * Edge labels rendered at the midpoint of every edge collide when a back edge
 * (test -> requirement) crosses the forward chain. Edges are therefore
 * colour-coded and explained by a legend instead of carrying inline text.
 */
interface TraceGraphNodeData {
  label: string;
  href: string;
}

function TraceGraphNode({ data }: NodeProps<TraceGraphNodeData>) {
  return (
    <>
      {/* Custom nodes must render their own handles or React Flow has no
          anchor point for edges and silently drops every edge. They are
          styled invisible because the graph is read-only. */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
      />
      <Link
        href={data.href}
        className="block whitespace-pre-line rounded-md text-inherit underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        {data.label}
      </Link>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
      />
    </>
  );
}

const NODE_TYPES = { traceNode: TraceGraphNode };

function nodeHref(requirementId: string, nodeId: string, type: TraceNodeType) {
  const requirementPath = `/requirements/${encodeURIComponent(requirementId)}`;
  if (type === "requirement") return requirementPath;
  if (type === "test") {
    const testId = nodeId.startsWith("test:") ? nodeId.slice("test:".length) : nodeId;
    return `${requirementPath}#test-${encodeURIComponent(testId)}`;
  }
  return `${requirementPath}#${type}`;
}

/**
 * Static graph for one requirement chain. Nodes link to their corresponding
 * requirement detail sections; zoom, pan, drag, and selection stay disabled.
 *
 * Orphaned nodes (artifacts from a superseded version) are styled with dashed
 * amber borders and amber edges. Columns are derived from the node types that
 * are actually present, so an orphan-only graph starts at the left edge
 * instead of leaving an empty requirement column.
 */
export default function TraceGraph({ trace, requirementId }: TraceGraphProps) {
  // React Flow measures the DOM, so render it only after client hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Remount when the underlying node set changes so the entrance animation
  // replays every time a different version's graph is loaded.
  const graphKey = trace.nodes
    .map((node) => `${node.id}:${node.orphaned ? 1 : 0}`)
    .join("|");

  const { nodes, edges } = useMemo(() => {
    const order: TraceNodeType[] = ["requirement", "risk", "assurance", "test"];
    const presentTypes = order.filter((type) =>
      trace.nodes.some((node) => node.type === type),
    );
    const orphanIds = new Set(
      trace.nodes.filter((node) => node.orphaned).map((node) => node.id),
    );
    const columns = new Map<TraceNodeType, number>();
    const rfNodes: Node[] = trace.nodes.map((node) => {
      const column = presentTypes.indexOf(node.type);
      const seen = columns.get(node.type) ?? 0;
      columns.set(node.type, seen + 1);
      const style = node.orphaned
        ? TRACE_GRAPH_ORPHAN_STYLE[node.type]
        : TRACE_GRAPH_CURRENT_STYLE[node.type];
      return {
        id: node.id,
        type: "traceNode",
        position: {
          x: column * TRACE_GRAPH_COLUMN_GAP,
          y: seen * TRACE_GRAPH_ROW_GAP,
        },
        data: {
          label: `${TRACE_GRAPH_TYPE_LABEL[node.type]}\n${node.label}`,
          href: nodeHref(requirementId, node.id, node.type),
        },
        style: {
          ...style,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "pre-line",
          width: TRACE_GRAPH_NODE_WIDTH,
          textAlign: "center",
          borderRadius: TRACE_GRAPH_NODE_RADIUS,
          padding: "10px 14px",
        },
      };
    });
    const rfEdges: Edge[] = trace.edges.map((edge) => {
      const orphanEdge = orphanIds.has(edge.from) || orphanIds.has(edge.to);
      const stroke = orphanEdge
        ? TRACE_GRAPH_ORPHAN_EDGE_COLOR
        : TRACE_GRAPH_EDGE_VISUALS[edge.type].color;
      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        style: {
          stroke,
          strokeWidth: 1.8,
          strokeDasharray: orphanEdge ? "6 4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: stroke,
        },
        animated: true,
      };
    });
    return { nodes: rfNodes, edges: rfEdges };
  }, [requirementId, trace]);

  if (!mounted) {
    return (
      <div
        aria-label="Loading chain graph"
        className="h-[420px] animate-pulse rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      />
    );
  }

  const hasOrphans = trace.nodes.some((node) => node.orphaned);
  const presentEdgeTypes = [...new Set(trace.edges.map((edge) => edge.type))];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        {presentEdgeTypes.map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-5 rounded-full"
              style={{ background: TRACE_GRAPH_EDGE_VISUALS[type].color }}
            />
            {TRACE_GRAPH_EDGE_VISUALS[type].label}
          </span>
        ))}
        {hasOrphans ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border-2 border-dashed border-amber-600 bg-amber-50"
            />
            Orphaned artifact — superseded version or retired requirement
          </span>
        ) : null}
      </div>
      <div
        key={graphKey}
        className="h-[420px] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
      >
        <style>{`
          @keyframes nodeEntrance {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .raven-trace-flow .react-flow__node {
            animation: nodeEntrance 400ms ease-out both;
          }
          .raven-trace-flow .react-flow__node:nth-child(1) { animation-delay: 0ms; }
          .raven-trace-flow .react-flow__node:nth-child(2) { animation-delay: 80ms; }
          .raven-trace-flow .react-flow__node:nth-child(3) { animation-delay: 160ms; }
          .raven-trace-flow .react-flow__node:nth-child(4) { animation-delay: 240ms; }
          .raven-trace-flow .react-flow__node:nth-child(5) { animation-delay: 320ms; }
          .raven-trace-flow .react-flow__node:nth-child(6) { animation-delay: 400ms; }
          .raven-trace-flow .react-flow__node:nth-child(7) { animation-delay: 480ms; }
          .raven-trace-flow .react-flow__node:nth-child(8) { animation-delay: 560ms; }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          panOnScroll={false}
          panOnDrag={false}
          preventScrolling={false}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          className="raven-trace-flow [&_.react-flow__pane]:cursor-default [&_.react-flow__node]:cursor-pointer"
        >
          <Background gap={20} color="#FFECE5" />
        </ReactFlow>
      </div>
    </div>
  );
}
