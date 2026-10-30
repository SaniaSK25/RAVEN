import type { TraceEdgeType, TraceNodeType } from "@/lib/domain";

export const TRACE_GRAPH_NODE_WIDTH = 220;
export const TRACE_GRAPH_COLUMN_GAP = 320;
export const TRACE_GRAPH_ROW_GAP = 120;

export const TRACE_GRAPH_EDGE_VISUALS: Record<
  TraceEdgeType,
  { color: string; label: string }
> = {
  has_risk: { color: "#F16C30", label: "Has risk" },
  assessed_as: { color: "#F16C30", label: "Assessed as" },
  mitigated_by: { color: "#F16C30", label: "Mitigated by" },
  verifies: { color: "#F16C30", label: "Verifies" },
};

interface NodeStyle {
  background: string;
  border: string;
  color: string;
}

export const TRACE_GRAPH_CURRENT_STYLE: Record<TraceNodeType, NodeStyle> = {
  requirement: { background: "#FFECE5", border: "2px solid #F16C30", color: "#111111" },
  risk: { background: "#FFECE5", border: "2px solid #F16C30", color: "#111111" },
  assurance: { background: "#FFFFFF", border: "2px solid #F16C30", color: "#111111" },
  test: { background: "#FFECE5", border: "2px solid #F16C30", color: "#111111" },
};

export const TRACE_GRAPH_ORPHAN_STYLE: Record<TraceNodeType, NodeStyle> = {
  requirement: { background: "#FFECE5", border: "2px solid #F16C30", color: "#111111" },
  risk: { background: "#FFECE5", border: "2px dashed #F16C30", color: "#111111" },
  assurance: { background: "#FFECE5", border: "2px dashed #F16C30", color: "#111111" },
  test: { background: "#FFECE5", border: "2px dashed #F16C30", color: "#111111" },
};

export const TRACE_GRAPH_TYPE_LABEL: Record<TraceNodeType, string> = {
  requirement: "Requirement",
  risk: "Risk assessment",
  assurance: "Assurance decision",
  test: "Test script",
};
