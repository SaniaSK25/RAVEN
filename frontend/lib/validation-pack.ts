/**
 * Validation-pack domain helpers.
 *
 * The backend payload is the source of truth.  This module only adapts it for
 * presentation and derives transparent, export-time findings.  Database IDs
 * remain available for the ZIP metadata crosswalk, but reader-facing labels
 * are built from requirement keys, versions, and report-scoped references.
 */

export type JsonRecord = Record<string, unknown>;

export interface EvidenceField {
  value: unknown;
  confidence: number | null;
  evidence: string | null;
}

export interface EvidenceRecord {
  id: string;
  requirement_version_id: string;
  fields: Record<string, EvidenceField | string | null>;
  created_at: string | null;
}

export interface ResultTrace {
  score: number | null;
  rule_id: string | null;
  rule_version: string | null;
  reasoning: string | null;
  decision_path: unknown;
  weighted_sum?: number | null;
  gamp_modifier?: number | null;
  controls_floor?: number | null;
}

export interface RiskRecord {
  id: string;
  requirement_version_id: string;
  evidence_id: string;
  evidence: EvidenceRecord | null;
  status: string;
  is_current: boolean;
  freshness: string;
  severity: number | null;
  probability: number | null;
  detectability: number | null;
  severity_result: ResultTrace | null;
  probability_result: ResultTrace | null;
  detectability_result: ResultTrace | null;
  gxp_impact: boolean;
  gxp_reason: string;
  gamp_category: string;
  gamp_reason: string;
  rpn: number | null;
  rpn_points: number | null;
  band: string;
  configuration_version: string | number | null;
  configuration_hash?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AssuranceRecord {
  id: string;
  risk_assessment_id: string;
  assurance_level: string;
  rule_id: string;
  rule_version: string;
  generate_test: boolean;
  reasoning: string;
  decision_path: unknown;
  freshness: string;
  created_at: string | null;
}

export interface PromptVersionRef {
  id: string;
  agent_name: string;
  version: number;
  hash: string;
}

export interface TestRecord {
  id: string;
  title: string | null;
  external_code: string | null;
  requirement_version_id: string;
  assurance_decision_id: string | null;
  status: string;
  version: number;
  origin: string;
  freshness: string;
  script: string;
  prompt_version: PromptVersionRef | null;
  created_at: string | null;
}

export interface ComplianceRecord {
  id: string;
  framework: string;
  clause: string;
  status: string;
  coverage: number;
  reasoning: string;
  prompt_version: PromptVersionRef | null;
  created_at: string | null;
}

export interface PackRequirement {
  id: string;
  req_key: string | null;
  display_key?: string | null;
  title: string;
  requirement_title?: string;
  status: string;
  version_id: string | null;
  version: number | null;
  text?: string;
  risks: RiskRecord[];
  evidence: EvidenceRecord[];
  assurance: AssuranceRecord[];
  tests: TestRecord[];
  compliance: ComplianceRecord[];
  compliance_evaluated: boolean;
}

export interface TraceabilityRow {
  requirement_id?: string;
  requirement_version?: number | string;
  risk_id?: string;
  severity?: number | string;
  probability?: number | string;
  detectability?: number | string;
  rpn?: number | string;
  band?: string;
  assurance_level?: string;
  assurance_label?: string;
  reason_code?: string;
  test_id?: string;
  test_title?: string;
  test_origin?: string;
  coverage_status?: string;
  stale?: boolean;
  orphan_flags?: string;
  [key: string]: unknown;
}

export interface TraceabilitySummary {
  requirements: number;
  covered_by_tests: number;
  covered_by_assurance: number;
  uncovered: number;
  stale: number;
  rows: number;
  stale_rows: number;
  orphans: { O1: number; O2: number; O3: number; total: number };
}

export interface OrphanRecord {
  type: string;
  entity_type: string;
  entity_id: string;
  entity_key: string;
  reason: string;
  detail: string;
}

export interface ChangeRecord {
  id: string;
  requirement_id: string;
  kind: string;
  status: string;
  impact: unknown;
  diff: unknown;
  baseline_assessment_id: string | null;
  carried_from_event_id: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface ExportDataset {
  generated_at: string;
  pack_reference?: string;
  requirements: PackRequirement[];
  traceability: {
    columns: string[];
    rows: TraceabilityRow[];
    summary?: TraceabilitySummary;
  };
  orphans: OrphanRecord[];
  changes: ChangeRecord[];
  compliance_evaluated: boolean;
  compliance_record_count?: number;
  test_execution_available?: boolean;
  summary?: JsonRecord;
}

export interface ReportReferences {
  packReference: string;
  requirementRefs: Map<string, string>;
  riskRefs: Map<string, string>;
  assuranceRefs: Map<string, string>;
  testRefs: Map<string, string>;
  evidenceRefs: Map<string, string>;
  requirementForRisk: Map<string, string>;
  requirementForAssurance: Map<string, string>;
  requirementForTest: Map<string, string>;
  requirementForEvidence: Map<string, string>;
  riskForAssurance: Map<string, string>;
}

export interface ParsedStep {
  number: number;
  action: string;
  expected: string;
}

export interface ParsedTestScript {
  preconditions: string;
  steps: ParsedStep[];
  raw: string;
  parsed: boolean;
}

export interface DerivedFinding {
  id: string;
  category: string;
  requirementRef: string;
  requirementVersion: string;
  related: string[];
  finding: string;
  source: string;
  recommendation: string;
  status: "Derived finding" | "Persisted compliance result";
  closureEvidence: string;
}

export const EVIDENCE_GROUPS = [
  {
    title: "Impact and severity evidence",
    fields: [
      ["patient_safety", "Patient safety"],
      ["product_quality", "Product quality"],
      ["batch_release", "Batch release"],
      ["data_integrity", "Data integrity"],
      ["regulatory_compliance", "Regulatory compliance"],
      ["business_continuity", "Business continuity"],
    ],
  },
  {
    title: "Complexity and probability evidence",
    fields: [
      ["functional_complexity", "Functional complexity"],
      ["dependency_complexity", "Dependency complexity"],
      ["workflow_complexity", "Workflow complexity"],
    ],
  },
  {
    title: "Detection and detectability evidence",
    fields: [
      ["detection_controls", "Detection controls"],
      ["traceability", "Traceability"],
      ["failure_visibility", "Failure visibility"],
    ],
  },
] as const;

export const RISK_BAND_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  low: "Low",
  medium: "Medium",
  high: "High",
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  return text(value) || "Not recorded";
}

export function formatConfidence(value: unknown): string {
  const numeric = finiteNumber(value);
  if (numeric === null) return "Not recorded";
  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${Math.round(percent)}%`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.toISOString().slice(0, 10)} ${parsed.toISOString().slice(11, 16)} UTC`;
}

export function humanizeKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function humanizeScalar(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return text(value) || "Not recorded";
}

const DECISION_FIELD_LABELS: Record<string, string> = {
  severity: "Severity score",
  probability: "Probability score",
  detectability: "Detectability score",
  band: "Risk band",
  level: "Selected assurance level",
  assurance_level: "Assurance level",
  generate_test: "Test generation requested",
  rule: "Rule",
  rule_id: "Rule identifier",
  rule_version: "Rule version",
};

/**
 * Render a stored decision path as readable lines.  This deliberately avoids
 * JSON punctuation so the PDF never exposes a raw JSON blob as its primary
 * explanation.
 */
export function humanizeDecisionPath(value: unknown, depth = 0): string[] {
  if (value === null || value === undefined) return ["Not recorded"];
  if (Array.isArray(value)) {
    if (!value.length) return ["Not recorded"];
    return value.flatMap((item, index) => {
      if (item !== null && typeof item === "object") {
        const nested = humanizeDecisionPath(item, depth + 1);
        return [`${index + 1}. ${nested[0]}`, ...nested.slice(1).map((line) => `   ${line}`)];
      }
      return [`${index + 1}. ${humanizeScalar(item)}`];
    });
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as JsonRecord);
    if (!entries.length) return ["Not recorded"];
    return entries.flatMap(([key, item]) => {
      const label = DECISION_FIELD_LABELS[key] || humanizeKey(key);
      if (item === null || item === undefined) return [`${label}: Not recorded`];
      if (Array.isArray(item)) {
        if (!item.length) return [`${label}: Not recorded`];
        const nested = humanizeDecisionPath(item, depth + 1);
        return [`${label}:`, ...nested.map((line) => `  ${line}`)];
      }
      if (typeof item === "object") {
        const nested = humanizeDecisionPath(item, depth + 1);
        return [`${label}:`, ...nested.map((line) => `  ${line}`)];
      }
      const scalar =
        key === "level" || key === "assurance_level"
          ? humanizeKey(humanizeScalar(item))
          : humanizeScalar(item);
      return [`${label}: ${scalar}`];
    });
  }
  return [humanizeScalar(value)];
}

export function describeAssuranceRule(ruleId: string): string {
  switch (ruleId) {
    case "ASR-SEV-FLOOR":
      return "The deterministic assurance implementation checks the severity floor first. A severity score of 4 or 5 selects scripted testing regardless of the overall risk band.";
    case "ASR-BAND-HIGH":
      return "The deterministic assurance implementation selects scripted testing when the overall risk band is High.";
    case "ASR-BAND-MEDIUM":
      return "The deterministic assurance implementation selects exploratory testing when the overall risk band is Medium.";
    case "ASR-BAND-LOW":
      return "The deterministic assurance implementation selects unscripted testing when the overall risk band is Low.";
    default:
      return "The stored rule identifier is shown above. The current implementation does not provide a generic explanation for this rule, so no behaviour is inferred from its name.";
  }
}

export function riskBandLabel(value: unknown): string {
  const raw = text(value);
  return RISK_BAND_LABELS[raw] || raw || "Not recorded";
}

export function assuranceLevelLabel(value: unknown): string {
  const raw = text(value);
  if (!raw) return "Not recorded";
  return humanizeKey(raw);
}

export function requirementKey(requirement: PackRequirement): string {
  return (
    text(requirement.display_key) ||
    text(requirement.req_key) ||
    `REQ-${requirement.id.slice(0, 8).toUpperCase()}`
  );
}

export function requirementHeading(requirement: PackRequirement): string {
  return `${requirementKey(requirement)} — Version ${requirement.version ?? "Not recorded"}`;
}

export function requirementDisplayTitle(requirement: PackRequirement): string {
  return text(requirement.title) || text(requirement.requirement_title) || "Untitled requirement";
}

export function testDisplayTitle(test: TestRecord, reference: string): string {
  return (
    text(test.title) ||
    text(test.external_code) ||
    `${reference} — Test script for the selected requirement version`
  );
}

function fieldObject(raw: unknown): EvidenceField | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as JsonRecord;
  return {
    value: value.value,
    confidence: finiteNumber(value.confidence),
    evidence: text(value.evidence) || null,
  };
}

export function getEvidenceField(
  evidence: EvidenceRecord | null | undefined,
  field: string,
): EvidenceField | null {
  if (!evidence) return null;
  return fieldObject(evidence.fields[field]);
}

export function evidenceRecordForRisk(
  requirement: PackRequirement,
  risk: RiskRecord,
): EvidenceRecord | null {
  if (risk.evidence) return risk.evidence;
  return requirement.evidence.find((record) => record.id === risk.evidence_id) || null;
}

function stableCompare(a: string, b: string): number {
  return a.localeCompare(b, "en");
}

function assignUnique(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  const result = `${base}-${suffix}`;
  used.add(result);
  return result;
}

function referenceHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function sortedRequirements(data: ExportDataset): PackRequirement[] {
  return [...data.requirements].sort((a, b) => {
    const keyCompare = stableCompare(requirementKey(a), requirementKey(b));
    return keyCompare || stableCompare(a.id, b.id);
  });
}

/**
 * Build one report-scoped reference map for an entire export.  All section PDFs
 * receive the same object, so RA-001 means the same assessment everywhere in a
 * pack even when the pack contains several requirements.
 */
export function buildReportReferences(data: ExportDataset): ReportReferences {
  const requirements = sortedRequirements(data);
  const requirementRefs = new Map<string, string>();
  const riskRefs = new Map<string, string>();
  const assuranceRefs = new Map<string, string>();
  const testRefs = new Map<string, string>();
  const evidenceRefs = new Map<string, string>();
  const requirementForRisk = new Map<string, string>();
  const requirementForAssurance = new Map<string, string>();
  const requirementForTest = new Map<string, string>();
  const requirementForEvidence = new Map<string, string>();
  const riskForAssurance = new Map<string, string>();
  const usedRequirements = new Set<string>();
  let riskCounter = 0;
  let assuranceCounter = 0;
  let testCounter = 0;
  let evidenceCounter = 0;

  for (const requirement of requirements) {
    const base = requirementKey(requirement);
    requirementRefs.set(requirement.id, assignUnique(base, usedRequirements));
    const sortedRisks = [...requirement.risks].sort((a, b) => {
      const created = stableCompare(a.created_at || "", b.created_at || "");
      return created || stableCompare(a.id, b.id);
    });
    const riskOrder = new Map<string, number>();
    for (const risk of sortedRisks) {
      riskCounter += 1;
      riskRefs.set(risk.id, `RA-${String(riskCounter).padStart(3, "0")}`);
      requirementForRisk.set(risk.id, requirement.id);
      riskOrder.set(risk.id, riskCounter);
    }
    const sortedAssurance = [...requirement.assurance].sort((a, b) => {
      const riskA = riskOrder.get(a.risk_assessment_id) || 0;
      const riskB = riskOrder.get(b.risk_assessment_id) || 0;
      return (
        riskA - riskB ||
        stableCompare(a.created_at || "", b.created_at || "") ||
        stableCompare(a.id, b.id)
      );
    });
    for (const assurance of sortedAssurance) {
      assuranceCounter += 1;
      assuranceRefs.set(assurance.id, `ASR-${String(assuranceCounter).padStart(3, "0")}`);
      requirementForAssurance.set(assurance.id, requirement.id);
      riskForAssurance.set(assurance.id, assurance.risk_assessment_id);
    }
    const sortedTests = [...requirement.tests].sort((a, b) => {
      const created = stableCompare(a.created_at || "", b.created_at || "");
      return created || stableCompare(a.id, b.id);
    });
    for (const test of sortedTests) {
      testCounter += 1;
      testRefs.set(test.id, `TS-${String(testCounter).padStart(3, "0")}`);
      requirementForTest.set(test.id, requirement.id);
    }
    const sortedEvidence = [...requirement.evidence].sort((a, b) => {
      const created = stableCompare(a.created_at || "", b.created_at || "");
      return created || stableCompare(a.id, b.id);
    });
    for (const evidence of sortedEvidence) {
      evidenceCounter += 1;
      evidenceRefs.set(evidence.id, `EV-${String(evidenceCounter).padStart(3, "0")}`);
      requirementForEvidence.set(evidence.id, requirement.id);
    }
  }

  const scope = requirements
    .map(
      (requirement) =>
        `${requirementRefs.get(requirement.id)}:${requirement.version_id || "no-version"}`,
    )
    .join("|");
  const packReference = text(data.pack_reference) || `VP-${referenceHash(scope)}`;
  return {
    packReference,
    requirementRefs,
    riskRefs,
    assuranceRefs,
    testRefs,
    evidenceRefs,
    requirementForRisk,
    requirementForAssurance,
    requirementForTest,
    requirementForEvidence,
    riskForAssurance,
  };
}

export function requirementForReference(
  refs: ReportReferences,
  requirementId: string,
  data: ExportDataset,
): PackRequirement | null {
  return data.requirements.find((item) => item.id === requirementId) || null;
}

export function riskReference(refs: ReportReferences, riskId: string): string {
  return refs.riskRefs.get(riskId) || "Risk assessment reference unavailable";
}

export function assuranceReference(
  refs: ReportReferences,
  assuranceId: string,
): string {
  return refs.assuranceRefs.get(assuranceId) || "Assurance decision reference unavailable";
}

export function testReference(refs: ReportReferences, testId: string): string {
  return refs.testRefs.get(testId) || "Test script reference unavailable";
}

export function evidenceReference(
  refs: ReportReferences,
  evidenceId: string,
): string {
  return refs.evidenceRefs.get(evidenceId) || "Evidence reference unavailable";
}

export function relatedRiskForAssurance(
  requirement: PackRequirement,
  assurance: AssuranceRecord,
): RiskRecord | null {
  return requirement.risks.find((risk) => risk.id === assurance.risk_assessment_id) || null;
}

export function relatedAssuranceForTest(
  requirement: PackRequirement,
  test: TestRecord,
): AssuranceRecord | null {
  if (!test.assurance_decision_id) return null;
  return (
    requirement.assurance.find(
      (assurance) => assurance.id === test.assurance_decision_id,
    ) || null
  );
}

export function testsForAssurance(
  requirement: PackRequirement,
  assurance: AssuranceRecord,
): TestRecord[] {
  return requirement.tests.filter(
    (test) => test.assurance_decision_id === assurance.id,
  );
}

export function traceabilitySummary(data: ExportDataset): TraceabilitySummary {
  const coverage = new Map<string, string>();
  for (const row of data.traceability.rows) {
    const key = text(row.requirement_id);
    if (key && !coverage.has(key)) coverage.set(key, text(row.coverage_status));
  }
  const items = sortedRequirements(data);
  for (const item of items) {
    const key = requirementKey(item);
    if (!coverage.has(key)) coverage.set(key, "uncovered");
  }
  const orphanCounts = { O1: 0, O2: 0, O3: 0, total: data.orphans.length };
  for (const orphan of data.orphans) {
    if (orphan.type === "O1" || orphan.type === "O2" || orphan.type === "O3") {
      orphanCounts[orphan.type] += 1;
    }
  }
  return {
    requirements: items.length,
    covered_by_tests: [...coverage.values()].filter((value) => value === "covered_by_tests").length,
    covered_by_assurance: [...coverage.values()].filter((value) => value === "covered_by_assurance").length,
    uncovered: [...coverage.values()].filter((value) => value === "uncovered").length,
    stale: [...coverage.values()].filter((value) => value === "stale").length,
    rows: data.traceability.rows.length,
    stale_rows: data.traceability.rows.filter((row) => row.stale === true).length,
    orphans: orphanCounts,
  };
}

export function coverageLabel(value: unknown): string {
  switch (text(value)) {
    case "covered_by_tests":
      return "Covered by tests";
    case "covered_by_assurance":
      return "Covered by assurance";
    case "uncovered":
      return "Uncovered";
    case "stale":
      return "Stale coverage";
    default:
      return text(value) || "Not recorded";
  }
}

export function parseTestScript(script: string): ParsedTestScript {
  const raw = script || "";
  const preconditionsMatch = /(^|\n)\s*preconditions?\s*:/i.exec(raw);
  const stepsMatch = /(^|\n)\s*(test\s+steps?|steps?)\s*:/i.exec(raw);
  let preconditions = "";
  let stepsText = "";

  if (preconditionsMatch && stepsMatch && stepsMatch.index > preconditionsMatch.index) {
    const preStart = preconditionsMatch.index + preconditionsMatch[0].length;
    preconditions = raw.slice(preStart, stepsMatch.index).trim();
    stepsText = raw.slice(stepsMatch.index + stepsMatch[0].length).trim();
  } else if (stepsMatch) {
    stepsText = raw.slice(stepsMatch.index + stepsMatch[0].length).trim();
  } else {
    return { preconditions: "", steps: [], raw, parsed: false };
  }

  const stepLines = stepsText.split(/\r?\n/);
  const steps: ParsedStep[] = [];
  let current: ParsedStep | null = null;
  for (const line of stepLines) {
    const match = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (match) {
      if (current) steps.push(current);
      const body = match[2].trim();
      const expectedMatch = /(?:expected(?:\s+result)?|expected:)\s*[:\-]?\s*(.*)$/i.exec(body);
      if (expectedMatch) {
        current = {
          number: Number(match[1]),
          action: body.slice(0, expectedMatch.index).replace(/[\s:;-]+$/, "").trim(),
          expected: expectedMatch[1].trim() || "Not recorded",
        };
      } else {
        current = { number: Number(match[1]), action: body, expected: "Not recorded" };
      }
    } else if (current && line.trim()) {
      current.action = `${current.action}\n${line.trim()}`;
    }
  }
  if (current) steps.push(current);

  if (!steps.length) {
    return { preconditions, steps: [], raw, parsed: false };
  }
  return { preconditions, steps, raw, parsed: true };
}

function orphanEntityRef(refs: ReportReferences, orphan: OrphanRecord): string {
  if (orphan.entity_type === "test") {
    return refs.testRefs.get(orphan.entity_id) || orphan.entity_key || "Test script";
  }
  if (orphan.entity_type === "risk") {
    return refs.riskRefs.get(orphan.entity_id) || orphan.entity_key || "Risk assessment";
  }
  return refs.requirementRefs.get(orphan.entity_id) || orphan.entity_key || "Requirement";
}

function orphanRequirement(
  refs: ReportReferences,
  data: ExportDataset,
  orphan: OrphanRecord,
): PackRequirement | null {
  let requirementId = "";
  if (orphan.entity_type === "requirement") {
    requirementId = orphan.entity_id;
  } else if (orphan.entity_type === "risk") {
    requirementId = refs.requirementForRisk.get(orphan.entity_id) || "";
  } else if (orphan.entity_type === "test") {
    requirementId = refs.requirementForTest.get(orphan.entity_id) || "";
  }
  if (!requirementId) return null;
  return requirementForReference(refs, requirementId, data);
}

function gapCategoryForOrphan(orphan: OrphanRecord): string {
  if (orphan.type === "O1") return "Requirement coverage gap";
  if (orphan.type === "O2") return "Orphaned test script";
  if (orphan.type === "O3") return "Risk without fresh assurance";
  return "Traceability finding";
}

function gapRecommendationForOrphan(orphan: OrphanRecord): string {
  if (orphan.reason === "scripted_no_tests") {
    return "Create or import a test script and link it to the requirement before relying on this pack.";
  }
  if (orphan.reason === "no_assurance") {
    return "Run the assurance decision workflow for the current risk assessment.";
  }
  if (orphan.reason === "stale_only") {
    return "Re-run the affected analysis and traceability synchronization so fresh artifacts cover the requirement.";
  }
  if (orphan.reason === "not_analyzed") {
    return "Run the risk assessment workflow for the current requirement version.";
  }
  if (orphan.type === "O2") {
    return "Link the test script to the intended requirement or retire the orphaned script.";
  }
  return "Review the traceability record and restore the missing active link.";
}

function gapClosureForOrphan(orphan: OrphanRecord): string {
  if (orphan.type === "O2") {
    return "An active verifies link connects the test script to the selected requirement.";
  }
  if (orphan.type === "O3") {
    return "A fresh assurance decision is reachable from the risk assessment through an active trace link.";
  }
  return "Fresh coverage exists: either a fresh linked test or a fresh exploratory/unscripted assurance decision.";
}

/**
 * Derive findings deterministically from the loaded snapshot.  These are
 * labelled "Derived finding" and are not presented as persisted approvals or
 * compliance verdicts.  Persisted compliance records are labelled separately.
 */
export function deriveGapFindings(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): DerivedFinding[] {
  const findings: DerivedFinding[] = [];
  const seen = new Set<string>();
  const add = (finding: Omit<DerivedFinding, "id">) => {
    const key = [
      finding.category,
      finding.requirementRef,
      finding.related.join(","),
      finding.finding,
    ].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ id: "", ...finding });
  };

  const orphanReasons = new Map<string, Set<string>>();
  for (const orphan of data.orphans) {
    const requirement = orphanRequirement(refs, data, orphan);
    const reqRef = requirement
      ? refs.requirementRefs.get(requirement.id) || requirementKey(requirement)
      : "Unlinked";
    if (!orphanReasons.has(reqRef)) orphanReasons.set(reqRef, new Set());
    orphanReasons.get(reqRef)?.add(orphan.reason);
    add({
      category: gapCategoryForOrphan(orphan),
      requirementRef: reqRef,
      requirementVersion: requirement?.version ? `Version ${requirement.version}` : "Not recorded",
      related: [orphanEntityRef(refs, orphan)],
      finding: orphan.detail,
      source: `Traceability ${orphan.type} · ${orphan.reason}`,
      recommendation: gapRecommendationForOrphan(orphan),
      status: "Derived finding",
      closureEvidence: gapClosureForOrphan(orphan),
    });
  }

  for (const requirement of sortedRequirements(data)) {
    const reqRef = refs.requirementRefs.get(requirement.id) || requirementKey(requirement);
    const version = requirement.version ? `Version ${requirement.version}` : "Not recorded";
    const reasons = orphanReasons.get(reqRef) || new Set<string>();
    const hasReason = (...values: string[]) => values.some((value) => reasons.has(value));

    if (!requirement.version_id) {
      add({
        category: "Requirement version",
        requirementRef: reqRef,
        requirementVersion: "Not recorded",
        related: [],
        finding: "No current requirement version is stored for this requirement.",
        source: "Requirement record",
        recommendation: "Restore or create a current requirement version before exporting this requirement.",
        status: "Derived finding",
        closureEvidence: "A current RequirementVersion exists and is selected for export.",
      });
    }

    if (!requirement.risks.length && !hasReason("not_analyzed")) {
      add({
        category: "Missing risk assessment",
        requirementRef: reqRef,
        requirementVersion: version,
        related: [],
        finding: "No risk assessment is stored for the current requirement version.",
        source: "Validation-pack dataset",
        recommendation: "Run the risk assessment workflow for this requirement version.",
        status: "Derived finding",
        closureEvidence: "A risk assessment is stored for the current requirement version.",
      });
    }

    if (!requirement.assurance.length) {
      if (!hasReason("no_assurance", "not_analyzed", "stale_only")) {
        add({
          category: "Missing assurance decision",
          requirementRef: reqRef,
          requirementVersion: version,
          related: requirement.risks.map((risk) => riskReference(refs, risk.id)),
          finding: "No assurance decision is stored for the current requirement version.",
          source: "Validation-pack dataset",
          recommendation: "Run the assurance workflow for the current risk assessment.",
          status: "Derived finding",
          closureEvidence: "A fresh assurance decision is stored for the risk assessment.",
        });
      }
    }

    for (const risk of requirement.risks) {
      const riskRef = riskReference(refs, risk.id);
      if (risk.freshness === "stale" || risk.freshness === "superseded") {
        if (!hasReason("stale_only")) {
          add({
            category: risk.freshness === "stale" ? "Stale risk assessment" : "Superseded risk assessment",
            requirementRef: reqRef,
            requirementVersion: version,
            related: [riskRef],
            finding: `The risk assessment freshness is ${risk.freshness}.`,
            source: `Risk assessment ${riskRef}`,
            recommendation: "Re-run the risk assessment for the current requirement version and preserve the historical record.",
            status: "Derived finding",
            closureEvidence: "A fresh risk assessment is linked to the selected requirement version.",
          });
        }
      }
      if (risk.severity === null || risk.probability === null || risk.detectability === null) {
        add({
          category: "Incomplete risk assessment",
          requirementRef: reqRef,
          requirementVersion: version,
          related: [riskRef],
          finding: "One or more risk scoring sub-results are missing.",
          source: `Risk assessment ${riskRef}`,
          recommendation: "Complete the severity, probability, and detectability results before relying on the assessment.",
          status: "Derived finding",
          closureEvidence: "All three scoring results and the deterministic rule trace are stored.",
        });
      }
    }

    for (const assurance of requirement.assurance) {
      const assuranceRef = assuranceReference(refs, assurance.id);
      const risk = relatedRiskForAssurance(requirement, assurance);
      const riskRef = risk ? riskReference(refs, risk.id) : "Risk reference unavailable";
      if (assurance.freshness === "stale" || assurance.freshness === "superseded") {
        if (!hasReason("stale_only")) {
          add({
            category: assurance.freshness === "stale" ? "Stale assurance decision" : "Superseded assurance decision",
            requirementRef: reqRef,
            requirementVersion: version,
            related: [assuranceRef, riskRef],
            finding: `The assurance decision freshness is ${assurance.freshness}.`,
            source: `Assurance decision ${assuranceRef}`,
            recommendation: "Re-run the assurance decision for the current risk assessment and preserve the historical record.",
            status: "Derived finding",
            closureEvidence: "A fresh assurance decision is linked to the current risk assessment.",
          });
        }
      }
      if (assurance.generate_test && !testsForAssurance(requirement, assurance).length) {
        if (!hasReason("scripted_no_tests")) {
          add({
            category: "Required test script missing",
            requirementRef: reqRef,
            requirementVersion: version,
            related: [assuranceRef, riskRef],
            finding: "The assurance decision requests test generation, but no test script is linked to it.",
            source: `Assurance decision ${assuranceRef}`,
            recommendation: "Generate or import a test script and associate it with the assurance decision.",
            status: "Derived finding",
            closureEvidence: "At least one test script is linked to the assurance decision.",
          });
        }
      }
    }

    for (const test of requirement.tests) {
      const testRef = testReference(refs, test.id);
      const status = text(test.status).toUpperCase();
      if (status !== "APPROVED" && status !== "SUPERSEDED") {
        add({
          category: "Test lifecycle",
          requirementRef: reqRef,
          requirementVersion: version,
          related: [testRef],
          finding: `Test lifecycle status is ${text(test.status) || "Not recorded"}. This is a lifecycle status, not an execution result.`,
          source: `Test script ${testRef}`,
          recommendation: "Complete the review lifecycle. Execution evidence must be captured separately; it is not stored by this export.",
          status: "Derived finding",
          closureEvidence: "TestScript.status is APPROVED. This does not imply that the script was executed or passed.",
        });
      }
      if (test.freshness === "stale" || test.freshness === "superseded") {
        if (!hasReason("stale_only")) {
          add({
            category: test.freshness === "stale" ? "Stale test script" : "Superseded test script",
            requirementRef: reqRef,
            requirementVersion: version,
            related: [testRef],
            finding: `The test script freshness is ${test.freshness}.`,
            source: `Test script ${testRef}`,
            recommendation: "Review or regenerate the test script for the current requirement version.",
            status: "Derived finding",
            closureEvidence: "A fresh test script is linked to the selected requirement version.",
          });
        }
      }
    }

    if (!requirement.compliance.length) {
      add({
        category: "Compliance evaluation not recorded",
        requirementRef: reqRef,
        requirementVersion: version,
        related: [],
        finding: "No persisted compliance result is available for this requirement version. This is an absence of a record, not a compliance verdict.",
        source: "ComplianceResult read path",
        recommendation: "Evaluate the applicable compliance topics if the validation scope requires a compliance conclusion.",
        status: "Derived finding",
        closureEvidence: "A persisted ComplianceResult exists for the selected requirement version.",
      });
    } else {
      for (const record of requirement.compliance) {
        const status = text(record.status).toUpperCase();
        if (status !== "COMPLIANT" && status !== "NOT_APPLICABLE") {
          add({
            category: "Persisted compliance result",
            requirementRef: reqRef,
            requirementVersion: version,
            related: [],
            finding: `${record.framework} ${record.clause}: stored status is ${text(record.status) || "Not recorded"} with coverage ${formatConfidence(record.coverage)}.`,
            source: `Compliance result for ${record.framework} ${record.clause}`,
            recommendation: "Review the persisted compliance result and its reasoning against the applicable framework.",
            status: "Persisted compliance result",
            closureEvidence: "A subsequent persisted compliance result reflects the reviewed position; this export does not create one.",
          });
        }
      }
    }
  }

  for (const change of data.changes) {
    const status = text(change.status).toLowerCase();
    if (status !== "open" && status !== "reanalyzed") continue;
    const requirement = data.requirements.find((item) => item.id === change.requirement_id);
    if (!requirement) continue;
    const reqRef = refs.requirementRefs.get(requirement.id) || requirementKey(requirement);
    add({
      category: "Unresolved change event",
      requirementRef: reqRef,
      requirementVersion: requirement.version ? `Version ${requirement.version}` : "Not recorded",
      related: [],
      finding: `Change event status is ${text(change.status) || "Not recorded"}${change.kind ? ` (${change.kind})` : ""}.`,
      source: `Change event dated ${formatDateTime(change.created_at)}`,
      recommendation: "Resolve or reanalyse the change and synchronize the affected traceability records.",
      status: "Derived finding",
      closureEvidence: "The change event is resolved and the affected current-version records have been reanalysed.",
    });
  }

  findings.sort(
    (a, b) =>
      stableCompare(a.requirementRef, b.requirementRef) ||
      stableCompare(a.category, b.category) ||
      stableCompare(a.finding, b.finding),
  );
  return findings.map((finding, index) => ({
    ...finding,
    id: `GAP-${String(index + 1).padStart(3, "0")}`,
  }));
}

export function filterRequirements(
  requirements: PackRequirement[],
  query: string,
): PackRequirement[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return requirements;
  return requirements.filter((requirement) => {
    const haystack = [
      requirementKey(requirement),
      requirement.req_key,
      requirement.title,
      requirement.requirement_title,
      requirement.text,
      requirement.status,
    ]
      .map((value) => text(value).toLowerCase())
      .join(" ");
    return haystack.includes(needle);
  });
}

export function matrixToCsv(data: ExportDataset): string {
  const columns = data.traceability.columns.length
    ? data.traceability.columns
    : [
        "requirement_id",
        "requirement_version",
        "risk_id",
        "severity",
        "probability",
        "detectability",
        "rpn",
        "band",
        "assurance_level",
        "assurance_label",
        "reason_code",
        "test_id",
        "test_title",
        "test_origin",
        "coverage_status",
        "stale",
        "orphan_flags",
      ];
  const escape = (value: unknown): string => {
    const raw = typeof value === "boolean" ? (value ? "true" : "false") : text(value);
    if (/[",\r\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };
  const lines = [columns.join(",")];
  for (const row of data.traceability.rows) {
    lines.push(columns.map((column) => escape(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function buildMetadataCrosswalk(data: ExportDataset, refs: ReportReferences) {
  return {
    pack_reference: refs.packReference,
    generated_at: data.generated_at,
    version_selection: "Current version per requirement",
    note: "Report references are scoped to this export pack. Database identifiers are retained in this machine-readable crosswalk only and are not displayed in the reader-facing PDFs.",
    requirements: sortedRequirements(data).map((requirement) => ({
      report_reference: refs.requirementRefs.get(requirement.id),
      requirement_id: requirement.id,
      requirement_key: requirement.req_key,
      display_key: requirementKey(requirement),
      title: requirementDisplayTitle(requirement),
      version: requirement.version,
      version_id: requirement.version_id,
      status: requirement.status,
      risks: requirement.risks.map((risk, index) => ({
        report_reference: refs.riskRefs.get(risk.id),
        risk_assessment_id: risk.id,
        evidence_id: risk.evidence_id,
        evidence_report_reference: refs.evidenceRefs.get(risk.evidence_id),
        sort_index: index,
      })),
      assurance_decisions: requirement.assurance.map((assurance) => ({
        report_reference: refs.assuranceRefs.get(assurance.id),
        assurance_decision_id: assurance.id,
        risk_assessment_id: assurance.risk_assessment_id,
        risk_report_reference: refs.riskRefs.get(assurance.risk_assessment_id),
      })),
      test_scripts: requirement.tests.map((test) => ({
        report_reference: refs.testRefs.get(test.id),
        test_script_id: test.id,
        assurance_decision_id: test.assurance_decision_id,
      })),
      evidence_records: requirement.evidence.map((evidence) => ({
        report_reference: refs.evidenceRefs.get(evidence.id),
        evidence_id: evidence.id,
      })),
    })),
  };
}
