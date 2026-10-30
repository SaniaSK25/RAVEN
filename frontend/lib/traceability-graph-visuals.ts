import type { TraceEdgeType, TraceNodeType } from "@/lib/domain";

export const TRACE_GRAPH_NODE_WIDTH = 220;
export const TRACE_GRAPH_NODE_RADIUS = 8;
export const TRACE_GRAPH_COLUMN_GAP = 320;
export const TRACE_GRAPH_ROW_GAP = 120;
export const TRACE_GRAPH_ORPHAN_EDGE_COLOR = "#D97706";

export const TRACE_GRAPH_EDGE_VISUALS: Record<
  TraceEdgeType,
  { color: string; label: string }
> = {
  has_risk: { color: "#DC2626", label: "Has risk" },
  assessed_as: { color: "#71717A", label: "Assessed as" },
  mitigated_by: { color: "#2563EB", label: "Mitigated by" },
  verifies: { color: "#059669", label: "Verifies" },
};

interface NodeStyle {
  background: string;
  border: string;
  color: string;
}

export const TRACE_GRAPH_CURRENT_STYLE: Record<TraceNodeType, NodeStyle> = {
  requirement: { background: "#FAFAFA", border: "2px solid #52525B", color: "#18181B" },
  risk: { background: "#FEF2F2", border: "2px solid #B91C1C", color: "#7F1D1D" },
  assurance: { background: "#F4F4F5", border: "2px solid #A1A1AA", color: "#3F3F46" },
  test: { background: "#EFF6FF", border: "2px solid #1D4ED8", color: "#1E3A8A" },
};

export const TRACE_GRAPH_ORPHAN_STYLE: Record<TraceNodeType, NodeStyle> = {
  requirement: { background: "#FEF08A", border: "2px solid #CA8A04", color: "#713F12" },
  risk: { background: "#FFFBEB", border: "2px dashed #D97706", color: "#92400E" },
  assurance: { background: "#FFFBEB", border: "2px dashed #D97706", color: "#92400E" },
  test: { background: "#FFFBEB", border: "2px dashed #D97706", color: "#92400E" },
};

export const TRACE_GRAPH_TYPE_LABEL: Record<TraceNodeType, string> = {
  requirement: "Requirement",
  risk: "Risk assessment",
  assurance: "Assurance decision",
  test: "Test script",
};
