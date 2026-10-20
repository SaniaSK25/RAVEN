export interface BackendRequirementVersion {
  version: number;
  text: string;
  is_current: boolean;
  created_at: string | null;
}

export interface BackendRequirement {
  id: string;
  req_key: string | null;
  title: string;
  description: string;
  status: string;
  current_version_id: string | null;
  text: string;
  version: number;
  created_at: string | null;
  versions: BackendRequirementVersion[];
}

export interface BackendRequirementDetail extends BackendRequirement {
  token_usage: {
    run_count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  risk: {
    id: string;
    severity: number | null;
    probability: number | null;
    detectability: number | null;
    rpn: number;
    band: string;
    freshness: string;
  } | null;
  assurance: {
    id: string;
    level: string;
    reason_code: string;
    label: string;
    method: string;
    freshness: string;
  } | null;
  tests: Array<{
    id: string;
    title: string | null;
    origin: string;
    freshness: string;
    external_code: string | null;
    script: string | null;
  }>;
}

export interface BackendAssessmentRecord {
  id: string;
  requirement_id: string | null;
  requirement_key: string | null;
  requirement_title: string | null;
  requirement_version_id: string;
  version: number | null;
  current_requirement_version: number | null;
  is_current_version: boolean;
  is_current: boolean;
  status: string;
  freshness: string;
  severity: number | null;
  probability: number | null;
  detectability: number | null;
  severity_rule_id: string | null;
  probability_rule_id: string | null;
  detectability_rule_id: string | null;
  severity_reasoning: string | null;
  probability_reasoning: string | null;
  detectability_reasoning: string | null;
  severity_decision_path: Array<Record<string, unknown>>;
  probability_decision_path: Array<Record<string, unknown>>;
  detectability_decision_path: Array<Record<string, unknown>>;
  gamp_reason: string | null;
  rpn: number | null;
  rpn_points: number | null;
  band: string | null;
  gxp_impact: boolean | null;
  gamp_category: string | null;
  rule_version: string | null;
  created_at: string | null;
}

export interface BackendAssuranceRecord {
  id: string;
  risk_assessment_id: string;
  requirement_id: string | null;
  requirement_key: string | null;
  requirement_title: string | null;
  requirement_version_id: string | null;
  version: number | null;
  current_requirement_version: number | null;
  is_current_version: boolean;
  assurance_level: "SCRIPTED" | "EXPLORATORY" | "UNSCRIPTED";
  rule_id: string;
  rule_version: string;
  generate_test: boolean;
  reasoning: string;
  decision_path: Record<string, unknown> | null;
  freshness: string;
  assessment_freshness: string | null;
  severity: number | null;
  rpn: number | null;
  rpn_points: number | null;
  gxp_impact: boolean | null;
  gamp_category: string | null;
  band: string | null;
  created_at: string | null;
}

export interface BackendPage<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface BackendTraceMatrix {
  total: number;
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface BackendTraceGraph {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    stale: boolean;
    orphan: boolean;
    orphaned?: boolean;
    meta: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
}

export interface BackendOrphans {
  orphans: Array<{
    type: string;
    entity_type: string;
    entity_id: string;
    entity_key: string;
    reason: string;
    detail: string;
  }>;
  summary: Record<string, number>;
}

export interface BackendChangeEvent {
  id: string;
  requirement_id: string;
  kind: string;
  status: string;
  impact: Record<string, unknown>;
  diff: Record<string, unknown> | null;
  baseline_assessment_id: string | null;
  carried_from_event_id: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_by: string;
  created_at: string | null;
  requirement_key?: string | null;
  requirement_title?: string;
  current_version?: number | null;
  current_text?: string;
}

export interface BackendTest {
  id: string;
  title: string | null;
  origin: string;
  freshness: string;
  external_code: string | null;
  requirement_version_id: string;
  assurance_decision_id: string | null;
  status: string;
  version: number;
  script: string;
  created_at: string | null;
  requirement_id: string;
  requirement_key: string | null;
  requirement_title: string;
}

export const RAVEN_BASE_PATH = "/raven";

export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${RAVEN_BASE_PATH}/api/v1/${normalizedPath}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : `Backend request failed (${response.status}).`;
    throw new Error(detail);
  }
  return body as T;
}
