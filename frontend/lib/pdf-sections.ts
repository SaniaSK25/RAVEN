import html2canvas from "html2canvas";
import { PdfBuilder, type PdfTableColumn } from "@/lib/pdf-layout";
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
import {
  assuranceLevelLabel,
  assuranceReference,
  coverageLabel,
  deriveGapFindings,
  describeAssuranceRule,
  evidenceRecordForRisk,
  evidenceReference,
  EVIDENCE_GROUPS,
  formatConfidence,
  formatDateTime,
  formatValue,
  getEvidenceField,
  humanizeDecisionPath,
  humanizeKey,
  parseTestScript,
  relatedRiskForAssurance,
  riskBandLabel,
  riskReference,
  testDisplayTitle,
  testReference,
  testsForAssurance,
  traceabilitySummary,
  type AssuranceRecord,
  type EvidenceRecord,
  type ExportDataset,
  type PackRequirement,
  type ReportReferences,
  type RiskRecord,
  type TestRecord,
} from "@/lib/validation-pack";

export const SECTION_TITLES = {
  risk: "Risk Assessment",
  assurance: "Assurance Rationale",
  tests: "Test Scripts",
  traceability: "Traceability Matrix",
  gaps: "Gap Report",
  appendices: "Appendices",
  evidence: "Evidence Index",
  limitations: "Limitations and Methodology",
} as const;

function orderedRequirements(data: ExportDataset): PackRequirement[] {
  return [...data.requirements].sort((a, b) =>
    (a.display_key || a.req_key || a.id).localeCompare(
      b.display_key || b.req_key || b.id,
      "en",
    ),
  );
}

function requirementSummary(builder: PdfBuilder, requirement: PackRequirement): void {
  builder.subheading(
    `${requirement.display_key || requirement.req_key || "Requirement"} — Requirement`,
  );
  builder.paragraph(requirement.title || requirement.requirement_title || "Untitled requirement", {
    fontSize: 9.8,
    gapAfter: 1.2,
  });
  builder.metaRow(
    "Requirement version",
    requirement.version ? `Version ${requirement.version}` : "Not recorded",
  );
}

function renderEvidenceGroup(
  builder: PdfBuilder,
  evidence: EvidenceRecord,
  group: (typeof EVIDENCE_GROUPS)[number],
): boolean {
  const fields = group.fields
    .map(([key, label]) => ({
      key,
      label,
      field: getEvidenceField(evidence, key),
    }))
    .filter((entry) => entry.field !== null);
  if (!fields.length) return false;
  builder.subheading(group.title);
  for (const entry of fields) {
    const field = entry.field;
    if (!field) continue;
    builder.labelParagraph(
      `${entry.label} — ${formatValue(field.value)}`,
      field.evidence || "No supporting sentence was stored for this field.",
      { meta: `Confidence: ${formatConfidence(field.confidence)}` },
    );
  }
  return true;
}

function renderEvidenceNarrative(
  builder: PdfBuilder,
  evidence: EvidenceRecord,
  refs: ReportReferences,
  relatedRisks: string[],
): void {
  builder.subheading("Supporting evidence");
  builder.metaRow("Evidence record", evidenceReference(refs, evidence.id));
  builder.metaRow("Recorded", formatDateTime(evidence.created_at));
  if (relatedRisks.length) {
    builder.metaRow("Related risk assessment", relatedRisks.join(", "));
  } else {
    builder.metaRow("Related risk assessment", "No risk assessment is linked to this evidence record");
  }
  let rendered = false;
  for (const group of EVIDENCE_GROUPS) {
    rendered = renderEvidenceGroup(builder, evidence, group) || rendered;
  }
  if (!rendered) {
    builder.paragraph(
      "The linked evidence record has no readable field values. No evidence sentence is substituted.",
    );
  }
}

function renderDerivedClassifications(
  builder: PdfBuilder,
  risk: RiskRecord,
  evidence: EvidenceRecord | null,
): void {
  builder.subheading("Derived classifications");
  builder.labelParagraph(
    `GxP impact — ${formatValue(risk.gxp_impact)}`,
    risk.gxp_reason || "No GxP rationale was stored.",
  );
  builder.labelParagraph(
    `GAMP category — ${formatValue(risk.gamp_category)}`,
    risk.gamp_reason || "No GAMP rationale was stored.",
  );
  const gxpField = getEvidenceField(evidence, "gxp_impact");
  const gampField = getEvidenceField(evidence, "gamp_category");
  if (gxpField?.evidence && gxpField.evidence !== risk.gxp_reason) {
    builder.labelParagraph("GxP derivation evidence", gxpField.evidence, {
      meta: `Confidence: ${formatConfidence(gxpField.confidence)}`,
    });
  }
  if (gampField?.evidence && gampField.evidence !== risk.gamp_reason) {
    builder.labelParagraph("GAMP derivation evidence", gampField.evidence, {
      meta: `Confidence: ${formatConfidence(gampField.confidence)}`,
    });
  }
}

function renderFactorTrace(
  builder: PdfBuilder,
  label: string,
  score: number | null,
  trace: RiskRecord["severity_result"],
): void {
  builder.subheading(`${label} — ${score ?? "Not recorded"}`);
  builder.metaRow(
    "Scoring rule",
    `${trace?.rule_id || "Not recorded"} · Version ${trace?.rule_version || "Not recorded"}`,
  );

  const steps = Array.isArray(trace?.decision_path)
    ? trace.decision_path.filter(
        (step): step is Record<string, unknown> =>
          step !== null && typeof step === "object" && !Array.isArray(step),
      )
    : [];
  const inputSteps = steps.filter(
    (step) => typeof step.check === "string" && step.check !== "computation",
  );
  const calculation = steps.find((step) => step.check === "computation");
  const inputRows = inputSteps.map((step) => ({
    input: humanizeKey(step.check as string),
    result:
      typeof step.result === "boolean"
        ? step.result
          ? "Yes"
          : "No"
        : step.result ?? "—",
    points: step.points ?? "—",
    weight: step.weight ?? "—",
    evidence: step.evidence || "—",
  }));
  const calculationLabels: Record<string, string> = {
    sum: "Input total",
    mapped: "Mapped score",
    mapped_score: "Mapped score",
    gamp_category: "GAMP category",
    gamp_modifier: "GAMP modifier",
    controls_floor: "Controls floor",
    floor_applied: "Controls floor applied",
    final_score: "Final score",
    outcome: "Outcome",
  };
  const calculationRows = calculation
    ? Object.entries(calculation)
        .filter(([key, value]) => key !== "check" && value !== null && value !== undefined)
        .map(([key, value]) => ({
          step: calculationLabels[key] || humanizeKey(key),
          value: typeof value === "boolean" ? (value ? "Yes" : "No") : value,
        }))
    : [];

  const rationale = trace?.reasoning?.replace(/\s+Supporting evidence:[\s\S]*$/, "");
  builder.labelParagraph(
    "Scoring rationale",
    rationale || "No scoring rationale was stored for this factor.",
    { gapAfter: 2 },
  );

  if (inputRows.length) {
    builder.table(
      [
        { header: "Input", key: "input", width: 25 },
        { header: "Result", key: "result", width: 15 },
        { header: "Points", key: "points", width: 10, align: "center" },
        { header: "Weight", key: "weight", width: 10, align: "center" },
        { header: "Supporting evidence", key: "evidence", width: 90 },
      ],
      inputRows,
      { fontSize: 8.8, headerFontSize: 9 },
    );
  }
  if (calculationRows.length) {
    builder.table(
      [
        { header: "Calculation", key: "step", width: 35 },
        { header: "Value", key: "value", width: 25 },
      ],
      calculationRows,
      { fontSize: 8.8, headerFontSize: 9 },
    );
  }
}

function riskBandColor(value: string): [number, number, number] | undefined {
  switch (value.toLowerCase()) {
    case "low":
      return [241, 108, 48];
    case "medium":
      return [204, 81, 35];
    case "high":
      return [157, 57, 23];
    case "critical":
      return [17, 17, 17];
    default:
      return undefined;
  }
}

function renderRiskRecord(
  builder: PdfBuilder,
  requirement: PackRequirement,
  risk: RiskRecord,
  refs: ReportReferences,
): void {
  const key = requirement.display_key || requirement.req_key || "Requirement";
  const riskRef = riskReference(refs, risk.id);
  const evidence = evidenceRecordForRisk(requirement, risk);
  builder.subheading(`Risk Assessment — ${key}, Version ${requirement.version ?? "Not recorded"}`);
  builder.metaRow("Report reference", riskRef);
  builder.metaRow("Freshness", risk.freshness || "Not recorded");
  builder.metaRow("Current assessment", risk.is_current ? "Yes" : "No");
  builder.metaRow("Created", formatDateTime(risk.created_at));
  builder.metaRow("Last updated", formatDateTime(risk.updated_at));
  builder.metaRow("GxP impact", formatValue(risk.gxp_impact));
  builder.metaRow("GAMP category", formatValue(risk.gamp_category));

  builder.subheading("Risk score");
  builder.table(
    [
      { header: "Factor", key: "factor", width: 30 },
      { header: "Score", key: "score", width: 15, align: "center" },
      { header: "Rule", key: "rule", width: 35 },
      { header: "Rule version", key: "rule_version", width: 25 },
    ],
    [
      ["Severity", risk.severity, risk.severity_result],
      ["Probability", risk.probability, risk.probability_result],
      ["Detectability", risk.detectability, risk.detectability_result],
    ].map(([factor, score, trace]) => ({
      factor,
      score: score ?? "Not recorded",
      rule: (trace as RiskRecord["severity_result"])?.rule_id || "Not recorded",
      rule_version:
        (trace as RiskRecord["severity_result"])?.rule_version || "Not recorded",
    })),
    { fontSize: 8.6 },
  );
  const riskBand = riskBandLabel(risk.band);
  builder.metadataGroup(
    "Derived classification",
    [
      ["RPN points", risk.rpn_points ?? "Not recorded"],
      ["Normalized RPN", risk.rpn ?? "Not recorded"],
      ["Risk band", riskBand],
      ["Configuration version", risk.configuration_version ?? "Not recorded"],
    ],
    { valueColors: { "Risk band": riskBandColor(riskBand) } },
  );

  builder.subheading("Scoring rule trace");
  renderFactorTrace(builder, "Severity", risk.severity, risk.severity_result);
  renderFactorTrace(builder, "Probability", risk.probability, risk.probability_result);
  renderFactorTrace(builder, "Detectability", risk.detectability, risk.detectability_result);

  renderDerivedClassifications(builder, risk, evidence);
  if (evidence) {
    renderEvidenceNarrative(
      builder,
      evidence,
      refs,
      risk.evidence_id ? [riskRef] : [],
    );
  } else {
    builder.subheading("Supporting evidence");
    builder.paragraph(
      "No supporting evidence record is linked to this risk assessment. No evidence is substituted.",
    );
  }
}

export function renderRiskAssessmentSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.risk, { newPage: true, landscape: false });
  builder.callout(
    "Each assessment below is scoped to the selected current requirement version. Scores, classifications, and rationales are reproduced from the stored record.",
  );
  orderedRequirements(data).forEach((requirement) => {
    requirementSummary(builder, requirement);
    if (!requirement.risks.length) {
      builder.paragraph(
        "No risk assessment is stored for the current requirement version. This is an absence of a record; no risk score is inferred.",
      );
      return;
    }
    const sorted = [...requirement.risks].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "", "en"),
    );
    sorted.forEach((risk) => {
      builder.divider();
      builder.beginCard();
      renderRiskRecord(builder, requirement, risk, refs);
      builder.endCard();
    });
  });
}

function renderAssuranceRecord(
  builder: PdfBuilder,
  requirement: PackRequirement,
  assurance: AssuranceRecord,
  refs: ReportReferences,
): void {
  const key = requirement.display_key || requirement.req_key || "Requirement";
  const assuranceRef = assuranceReference(refs, assurance.id);
  const risk = relatedRiskForAssurance(requirement, assurance);
  const riskRef = risk ? riskReference(refs, risk.id) : "Not linked";
  builder.subheading(
    `Assurance Decision — ${key}, Version ${requirement.version ?? "Not recorded"}`,
  );
  builder.metaRow("Report reference", assuranceRef);
  builder.metaRow("Assurance level", assuranceLevelLabel(assurance.assurance_level));
  builder.metaRow("Test generation requested", assurance.generate_test ? "Yes" : "No");
  builder.metaRow("Freshness", assurance.freshness || "Not recorded");
  builder.metaRow("Recorded", formatDateTime(assurance.created_at));
  builder.metaRow("Related risk assessment", riskRef);
  if (risk) {
    const riskBand = riskBandLabel(risk.band);
    builder.metaRow("Risk band", riskBand, { valueColor: riskBandColor(riskBand) });
    builder.metaRow("Severity score", risk.severity ?? "Not recorded");
  }

  builder.subheading("Decision inputs");
  const inputLines = humanizeDecisionPath(assurance.decision_path);
  if (inputLines.length && inputLines[0] !== "Not recorded") {
    builder.bullets(inputLines);
  } else {
    builder.paragraph("No decision inputs were stored for this assurance decision.");
  }

  builder.subheading("Decision rule");
  builder.metaRow("Rule", assurance.rule_id || "Not recorded");
  builder.metaRow("Rule version", assurance.rule_version || "Not recorded");
  builder.labelParagraph("Rule explanation", describeAssuranceRule(assurance.rule_id));
  builder.labelParagraph(
    "Stored rationale",
    assurance.reasoning || "No assurance rationale was stored.",
  );

  builder.subheading("Related test scripts");
  const tests = testsForAssurance(requirement, assurance);
  if (!tests.length) {
    builder.paragraph(
      assurance.generate_test
        ? "The assurance decision requests test generation, but no test script is linked to this decision."
        : "This assurance decision does not request test generation, and no test script is linked to it.",
    );
  } else {
    for (const test of tests) {
      builder.labelParagraph(
        `${testReference(refs, test.id)} — ${testDisplayTitle(test, testReference(refs, test.id))}`,
        `Freshness: ${test.freshness || "Not recorded"}`,
      );
    }
  }
}

export function renderAssuranceSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.assurance, { newPage: true, landscape: false });
  builder.callout(
    "The assurance level and rule below are stored decisions. The explanation is derived from the current deterministic assurance implementation; it does not replace the stored rationale.",
  );
  orderedRequirements(data).forEach((requirement) => {
    requirementSummary(builder, requirement);
    if (!requirement.assurance.length) {
      builder.paragraph(
        "No assurance decision is stored for the current requirement version. No assurance level is inferred.",
      );
      return;
    }
    const sorted = [...requirement.assurance].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "", "en"),
    );
    sorted.forEach((assurance) => {
      builder.beginCard();
      renderAssuranceRecord(builder, requirement, assurance, refs);
      builder.endCard();
    });
  });
}

function renderTestRecord(
  builder: PdfBuilder,
  requirement: PackRequirement,
  test: TestRecord,
  refs: ReportReferences,
): void {
  const key = requirement.display_key || requirement.req_key || "Requirement";
  const testRef = testReference(refs, test.id);
  const assurance = requirement.assurance.find(
    (item) => item.id === test.assurance_decision_id,
  );
  const risk = assurance ? relatedRiskForAssurance(requirement, assurance) : null;
  builder.subheading(`Test Script — ${key}, Version ${requirement.version ?? "Not recorded"}`);
  builder.metaRow("Report reference", testRef);
  builder.metaRow("Title", testDisplayTitle(test, testRef));
  builder.metaRow("External code", test.external_code || "Not recorded");
  builder.metaRow("Freshness", test.freshness || "Not recorded");
  builder.metaRow("Script revision", test.version ?? "Not recorded");
  builder.metaRow("Origin", test.origin || "Not recorded");
  builder.metaRow("Recorded", formatDateTime(test.created_at));
  builder.metaRow(
    "Related assurance decision",
    assurance ? assuranceReference(refs, assurance.id) : "Not linked",
  );
  builder.metaRow(
    "Related risk assessment",
    risk ? riskReference(refs, risk.id) : "Not linked",
  );
  builder.metaRow(
    "Prompt provenance",
    test.prompt_version
      ? `${test.prompt_version.agent_name} · version ${test.prompt_version.version}`
      : "Not recorded",
  );
  builder.callout(
    "Execution results are not recorded in the export dataset; no pass or fail result is implied.",
    "warning",
  );

  const parsed = parseTestScript(test.script);
  if (!parsed.parsed) {
    builder.subheading("Stored test script");
    builder.paragraph(test.script || "No script text was stored.");
    return;
  }

  const rawPreamble = test.script
    .split(/\n\s*(?:preconditions?\s*:|test\s+steps?\s*:|steps?\s*:)/i)[0]
    .trim();
  if (rawPreamble) {
    builder.labelParagraph("Script introduction", rawPreamble);
  }
  builder.subheading("Preconditions");
  builder.paragraph(parsed.preconditions || "No preconditions were stored.");
  builder.subheading("Test steps");
  if (!parsed.steps.length) {
    builder.paragraph("No numbered test steps could be parsed. The stored script is shown below.");
    builder.paragraph(parsed.raw);
    return;
  }
  for (const step of parsed.steps) {
    builder.labelParagraph(`Step ${step.number}`, step.action || "No action text was stored.");
    builder.labelParagraph("Expected result", step.expected || "Not recorded", {
      meta: `Step ${step.number}`,
    });
  }
}

export function renderTestScriptsSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.tests, { newPage: true, landscape: false });
  builder.paragraph(
    "Test scripts are reproduced from the stored script text. Execution results are not stored by RAVEN.",
    { color: [82, 82, 82], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement) => {
    requirementSummary(builder, requirement);
    if (!requirement.tests.length) {
      builder.paragraph(
        "No test script is stored for the current requirement version. This is an absence of a record; no test result is inferred.",
      );
      return;
    }
    const sorted = [...requirement.tests].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "", "en"),
    );
    sorted.forEach((test) => {
      builder.divider();
      builder.beginCard();
      renderTestRecord(builder, requirement, test, refs);
      builder.endCard();
    });
  });
}

const TRACE_RISK_COLUMNS: PdfTableColumn[] = [
  { header: "Requirement", key: "requirement_id", width: 19 },
  { header: "Version", key: "requirement_version", width: 9 },
  { header: "Risk reference", key: "risk_id", width: 27 },
  { header: "Severity", key: "severity", width: 8, align: "center" },
  { header: "Probability", key: "probability", width: 9, align: "center" },
  { header: "Detectability", key: "detectability", width: 9, align: "center" },
  { header: "RPN points", key: "rpn_points", width: 11, align: "center" },
  { header: "Normalized RPN", key: "rpn", width: 13, align: "center" },
  { header: "Risk band", key: "band", width: 12 },
  { header: "Stale", key: "stale", width: 8, align: "center" },
];

const TRACE_COVERAGE_COLUMNS: PdfTableColumn[] = [
  { header: "Requirement", key: "requirement_id", width: 19 },
  { header: "Version", key: "requirement_version", width: 12 },
  { header: "Assurance level", key: "assurance_level", width: 13 },
  { header: "Assurance label", key: "assurance_label", width: 23 },
  { header: "Reason code", key: "reason_code", width: 20 },
  { header: "Test reference", key: "test_id", width: 24 },
  { header: "Test title", key: "test_title", width: 26 },
  { header: "Test origin", key: "test_origin", width: 12 },
  { header: "Coverage status", key: "coverage_status", width: 20 },
  { header: "Orphan flags", key: "orphan_flags", width: 14 },
];

function traceabilityDisplayRows(data: ExportDataset): Array<Record<string, unknown>> {
  return data.traceability.rows.map((row) => ({
    ...row,
    requirement_id: row.requirement_id || "Unlinked",
    requirement_version: row.requirement_version || "—",
    risk_id: row.risk_id || "—",
    rpn_points: row.rpn_points ?? "—",
    rpn: row.rpn ?? "—",
    band: riskBandLabel(row.band),
    assurance_level: assuranceLevelLabel(row.assurance_level),
    assurance_label: row.assurance_label || "—",
    reason_code: row.reason_code || "—",
    test_title: row.test_title || "—",
    test_id: row.test_id || "—",
    test_origin: row.test_origin || "—",
    coverage_status: coverageLabel(row.coverage_status),
    stale: row.stale ? "Yes" : "No",
    orphan_flags: String(row.orphan_flags || "").replace(/;/g, ", ") || "—",
  }));
}

const TRACE_GRAPH_NODE_TYPES = ["requirement", "risk", "assurance", "test"] as const;
const TRACE_GRAPH_WIDTH = 1240;
const TRACE_GRAPH_HEIGHT = 500;

function wrapGraphLabel(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hasTraceEdgeVisual(
  type: string,
): type is keyof typeof TRACE_GRAPH_EDGE_VISUALS {
  return Object.prototype.hasOwnProperty.call(TRACE_GRAPH_EDGE_VISUALS, type);
}

function traceabilityGraphSvg(data: ExportDataset): string | null {
  const graph = data.traceability.graph;
  if (!graph || !graph.edges.length) return null;

  const nodes = graph.nodes.filter((node) =>
    TRACE_GRAPH_NODE_TYPES.includes(
      node.type as (typeof TRACE_GRAPH_NODE_TYPES)[number],
    ),
  );
  const nodePositions = new Map<
    string,
    {
      x: number;
      y: number;
      height: number;
      labelLines: string[];
      type: (typeof TRACE_GRAPH_NODE_TYPES)[number];
      orphaned: boolean;
    }
  >();
  const columnCounts = new Map<string, number>();
  const presentTypes = TRACE_GRAPH_NODE_TYPES.filter((type) =>
    nodes.some((node) => node.type === type),
  );

  for (const node of nodes) {
    const type = node.type as (typeof TRACE_GRAPH_NODE_TYPES)[number];
    const column = presentTypes.indexOf(type);
    const row = columnCounts.get(type) ?? 0;
    columnCounts.set(type, row + 1);
    const labelLines = wrapGraphLabel(node.label, 26);
    nodePositions.set(node.id, {
      x: column * TRACE_GRAPH_COLUMN_GAP,
      y: row * TRACE_GRAPH_ROW_GAP,
      height: 24 + (labelLines.length + 1) * 18,
      labelLines,
      type,
      orphaned: node.orphaned === true,
    });
  }

  const maxX = Math.max(
    TRACE_GRAPH_NODE_WIDTH,
    ...[...nodePositions.values()].map(
      (position) => position.x + TRACE_GRAPH_NODE_WIDTH,
    ),
  );
  const maxY = Math.max(
    66,
    ...[...nodePositions.values()].map(
      (position) => position.y + position.height,
    ),
  );
  const graphArea = { x: 24, y: 20, width: TRACE_GRAPH_WIDTH - 48, height: 390 };
  const scale = Math.min(
    2,
    graphArea.width / maxX,
    graphArea.height / maxY,
  );
  const transformX = graphArea.x + (graphArea.width - maxX * scale) / 2;
  const transformY = graphArea.y + (graphArea.height - maxY * scale) / 2;

  const edgesSvg = graph.edges.flatMap((edge) => {
    const source = nodePositions.get(edge.source);
    const target = nodePositions.get(edge.target);
    if (!source || !target || !hasTraceEdgeVisual(edge.type)) return [];
    const color =
      source.orphaned || target.orphaned
        ? TRACE_GRAPH_ORPHAN_EDGE_COLOR
        : TRACE_GRAPH_EDGE_VISUALS[edge.type].color;
    const x1 = transformX + (source.x + TRACE_GRAPH_NODE_WIDTH / 2) * scale;
    const y1 = transformY + (source.y + source.height) * scale;
    const x2 = transformX + (target.x + TRACE_GRAPH_NODE_WIDTH / 2) * scale;
    const y2 = transformY + target.y * scale;
    const curve = Math.max(28, Math.abs(y2 - y1) / 2);
    const dashed = source.orphaned || target.orphaned;
    return [
      `<path d="M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="1.8"${dashed ? ' stroke-dasharray="6 4"' : ""} marker-end="url(#arrow-${color.slice(1)})"/>`,
    ];
  });

  const nodesSvg = nodes.map((node) => {
    const position = nodePositions.get(node.id);
    if (!position) return "";
    const style = position.orphaned
      ? TRACE_GRAPH_ORPHAN_STYLE[position.type]
      : TRACE_GRAPH_CURRENT_STYLE[position.type];
    const border = style.border.match(/(\d+)px (solid|dashed) (#[0-9a-f]+)/i);
    const strokeWidth = Number(border?.[1] ?? 2);
    const dash = border?.[2] === "dashed" ? ' stroke-dasharray="6 4"' : "";
    const x = transformX + position.x * scale;
    const y = transformY + position.y * scale;
    const width = TRACE_GRAPH_NODE_WIDTH * scale;
    const height = position.height * scale;
    const title = TRACE_GRAPH_TYPE_LABEL[position.type];
    const lines = position.labelLines;
    const textY =
      y +
      height / 2 -
      ((lines.length + 1) * 18 * scale) / 2 +
      13 * scale;
    return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${TRACE_GRAPH_NODE_RADIUS * scale}" fill="${style.background}" stroke="${border?.[3] ?? style.color}" stroke-width="${strokeWidth * scale}"${dash}/><text x="${x + width / 2}" y="${textY}" text-anchor="middle" fill="${style.color}" font-family="Arial, Helvetica, sans-serif" font-size="${12 * scale}" font-weight="600"><tspan x="${x + width / 2}" dy="0">${escapeSvgText(title)}</tspan>${lines
      .map(
        (line) =>
          `<tspan x="${x + width / 2}" dy="${18 * scale}">${escapeSvgText(line)}</tspan>`,
      )
      .join("")}</text></g>`;
  });

  const edgeTypes = [
    ...new Set(
      graph.edges
        .map((edge) => edge.type)
        .filter(hasTraceEdgeVisual),
    ),
  ];
  let legendX = 20;
  let legendY = 464;
  const legendSvg = edgeTypes
    .map((type) => {
      const visual = TRACE_GRAPH_EDGE_VISUALS[type];
      const label = escapeSvgText(visual.label);
      const entryWidth = 27 + visual.label.length * 7 + 20;
      if (legendX + entryWidth > TRACE_GRAPH_WIDTH - 20) {
        legendX = 20;
        legendY += 20;
      }
      const entry = `<g><line x1="${legendX}" y1="${legendY}" x2="${legendX + 20}" y2="${legendY}" stroke="${visual.color}" stroke-width="2"/><text x="${legendX + 27}" y="${legendY + 4}" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="11">${label}</text></g>`;
      legendX += entryWidth;
      return entry;
    })
    .join("");
  const hasOrphans = nodes.some((node) => node.orphaned);
  const orphanLegend = hasOrphans
    ? `<g><rect x="20" y="482" width="12" height="12" rx="2" fill="#FFFBEB" stroke="#D97706" stroke-width="2" stroke-dasharray="4 3"/><text x="39" y="492" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="11">Orphaned artifact — superseded version or retired requirement</text></g>`
    : "";
  const markerTypes = [
    ...new Set(edgeTypes.map((type) => TRACE_GRAPH_EDGE_VISUALS[type].color)),
  ]
    .map(
      (color) =>
        `<marker id="arrow-${color.slice(1)}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12 z" fill="${color}"/></marker>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TRACE_GRAPH_WIDTH}" height="${TRACE_GRAPH_HEIGHT}" viewBox="0 0 ${TRACE_GRAPH_WIDTH} ${TRACE_GRAPH_HEIGHT}"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#FFECE5"/></pattern>${markerTypes}</defs><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="430" fill="url(#dots)"/>${edgesSvg.join("")}${nodesSvg.join("")}${legendSvg}${orphanLegend}</svg>`;
}

async function renderTraceabilityGraph(builder: PdfBuilder, data: ExportDataset): Promise<void> {
  const svg = traceabilityGraphSvg(data);
  if (!svg) {
    builder.paragraph(
      "No graph edges are available for the selected requirement versions. The matrix below preserves the available row-level traceability data.",
      { color: [82, 82, 82], fontSize: 9 },
    );
    return;
  }

  builder.newPage(builder.sectionTitle, true);
  builder.subheading("Relationship graph");
  builder.paragraph(
    "This image uses the same relationship graph design shown in the RAVEN traceability workspace.",
    { color: [82, 82, 82], fontSize: 9 },
  );
  const imageWidth = builder.contentWidth;
  const imageHeight = (imageWidth * TRACE_GRAPH_HEIGHT) / TRACE_GRAPH_WIDTH;
  builder.ensureSpace(imageHeight + 2);
  const snapshotRoot = document.createElement("div");
  snapshotRoot.style.position = "fixed";
  snapshotRoot.style.left = "0";
  snapshotRoot.style.top = "0";
  snapshotRoot.style.zIndex = "-1";
  snapshotRoot.style.pointerEvents = "none";
  snapshotRoot.style.width = `${TRACE_GRAPH_WIDTH}px`;
  snapshotRoot.style.height = `${TRACE_GRAPH_HEIGHT}px`;
  snapshotRoot.innerHTML = svg;
  document.body.appendChild(snapshotRoot);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(snapshotRoot, {
      background: "#ffffff",
      height: TRACE_GRAPH_HEIGHT,
      logging: false,
      width: TRACE_GRAPH_WIDTH,
    });
  } finally {
    snapshotRoot.remove();
  }
  builder.doc.addImage(
    canvas,
    "PNG",
    builder.margin,
    builder.y,
    imageWidth,
    imageHeight,
    "raven-traceability-graph",
  );
  builder.y += imageHeight + 2;
  builder.newPage(builder.sectionTitle, false);
  const graph = data.traceability.graph;
  if (!graph) return;
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodeLabel = (id: string): string => {
    const node = nodeById.get(id);
    if (!node) return "Unresolved node";
    const type = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    return `${type}: ${node.label}${node.orphaned ? " (orphaned)" : ""}`;
  };
  builder.subheading("Directed relationships");
  builder.table(
    [
      { header: "From node", key: "from", width: 72 },
      { header: "Relationship", key: "relationship", width: 30 },
      { header: "To node", key: "to", width: 72 },
      { header: "State", key: "state", width: 24 },
    ],
    graph.edges.map((edge) => ({
      from: nodeLabel(edge.source),
      relationship: edge.type.replace(/_/g, " "),
      to: nodeLabel(edge.target),
      state:
        edge.stale ||
        nodeById.get(edge.source)?.orphaned ||
        nodeById.get(edge.target)?.orphaned
          ? "Stale / orphaned"
          : "Current",
    })),
    { fontSize: 8.6 },
  );
}

export async function renderTraceabilitySection(
  builder: PdfBuilder,
  data: ExportDataset,
  _refs: ReportReferences,
): Promise<void> {
  void _refs;
  builder.startSection(SECTION_TITLES.traceability, {
    newPage: true,
    landscape: false,
  });
  const summary = traceabilitySummary(data);
  builder.callout(
    "Coverage and orphan semantics are supplied by the backend traceability service. O2 orphan tests have no linked requirement and are shown as Unlinked.",
  );
  builder.subheading("Coverage summary");
  builder.table(
    [
      { header: "Coverage category", key: "category", width: 38 },
      { header: "Count", key: "count", width: 14, align: "center" },
      { header: "Definition", key: "definition", width: 98 },
    ],
    [
      { category: "Requirements", count: summary.requirements, definition: "Selected requirement versions" },
      { category: "Covered by tests", count: summary.covered_by_tests, definition: "At least one active test covers the requirement" },
      { category: "Covered by assurance", count: summary.covered_by_assurance, definition: "An assurance decision covers the requirement" },
      { category: "Uncovered", count: summary.uncovered, definition: "No test or assurance coverage is recorded" },
      { category: "Stale", count: summary.stale, definition: "Coverage is present but marked stale" },
    ],
    { fontSize: 8.8 },
  );
  builder.y += 3;
  builder.table(
    [
      { header: "Traceability measure", key: "measure", width: 52 },
      { header: "Count", key: "count", width: 14, align: "center" },
      { header: "Orphan finding", key: "orphan", width: 84 },
    ],
    [
      { measure: "Traceability rows", count: summary.rows, orphan: "O1 — requirement coverage issue" },
      { measure: "Stale rows", count: summary.stale_rows, orphan: "O2 — test has no linked requirement" },
      { measure: "Orphan findings", count: summary.orphans.total, orphan: "O3 — risk or assurance linkage issue" },
      { measure: "O1 / O2 / O3 breakdown", count: `${summary.orphans.O1} / ${summary.orphans.O2} / ${summary.orphans.O3}`, orphan: "Counts are shown in O1 / O2 / O3 order" },
    ],
    { fontSize: 8.8 },
  );
  builder.y += 2;

  await renderTraceabilityGraph(builder, data);
  builder.y += 3;

  if (!data.traceability.rows.length) {
    builder.paragraph(
      "No traceability rows are available for the selected requirement versions. No coverage is inferred.",
    );
    return;
  }

  const rows = traceabilityDisplayRows(data);
  builder.newPage(builder.sectionTitle, true);
  builder.subheading("Risk and scoring trace");
  builder.table(TRACE_RISK_COLUMNS, rows, { fontSize: 8.8, headerFontSize: 8.5 });
  builder.y += 4;
  builder.subheading("Assurance and coverage trace");
  builder.table(TRACE_COVERAGE_COLUMNS, rows, {
    fontSize: 8.5,
    headerFontSize: 8.5,
  });
  builder.callout(
    "The matrix is a point-in-time export. A row with no test is not evidence that the requirement is untestable; it means no test script was recorded against the selected current version.",
  );
}

export function renderGapReportSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.gaps, { newPage: true, landscape: false });
  const findings = deriveGapFindings(data, refs);
  builder.callout(
    "Findings are deterministic export-time calculations from the selected records. They are not persisted approvals, CAPA records, or compliance verdicts. Persisted compliance results are labelled separately.",
    "warning",
  );
  builder.metadataGroup("Finding summary", [
    ["Total findings", String(findings.length)],
    [
      "Derived findings",
      String(findings.filter((finding) => finding.status === "Derived finding").length),
    ],
    [
      "Persisted compliance results",
      String(
        findings.filter((finding) => finding.status === "Persisted compliance result").length,
      ),
    ],
    [
      "By category",
      [...new Set(findings.map((finding) => finding.category))].join(" · ") || "None",
    ],
  ]);
  if (!findings.length) {
    builder.paragraph(
      "No gap findings were derived for the selected records. This is not a statement that the records are compliant or complete; it means the deterministic checks found no gap in the loaded data.",
    );
    return;
  }
  findings.forEach((finding) => {
    builder.beginCard();
    builder.subheading(`${finding.id} — ${finding.category}`);
    builder.metaRow("Requirement", finding.requirementRef);
    builder.metaRow("Requirement version", finding.requirementVersion);
    builder.metaRow("Related references", finding.related.length ? finding.related.join(" · ") : "None");
    builder.metaRow("Source", finding.source);
    builder.metaRow("Status", finding.status);
    builder.labelParagraph("Finding", finding.finding);
    builder.labelParagraph("Recommendation", finding.recommendation);
    builder.labelParagraph("Closure evidence", finding.closureEvidence);
    builder.endCard();
  });
}

function renderEvidenceIndexRecord(
  builder: PdfBuilder,
  requirement: PackRequirement,
  evidence: EvidenceRecord,
  refs: ReportReferences,
): void {
  const relatedRiskRefs = requirement.risks
    .filter((risk) => risk.evidence_id === evidence.id)
    .map((risk) => riskReference(refs, risk.id));
  builder.subheading(`${evidenceReference(refs, evidence.id)} — Evidence record`);
  builder.metaRow("Requirement", requirement.display_key || requirement.req_key || "Requirement");
  builder.metaRow(
    "Requirement version",
    requirement.version ? `Version ${requirement.version}` : "Not recorded",
  );
  builder.metaRow("Recorded", formatDateTime(evidence.created_at));
  builder.metaRow(
    "Related risk assessment",
    relatedRiskRefs.length ? relatedRiskRefs.join(", ") : "No risk assessment is linked",
  );
  let rendered = false;
  for (const group of EVIDENCE_GROUPS) {
    rendered = renderEvidenceGroup(builder, evidence, group) || rendered;
  }
  if (!rendered) {
    builder.paragraph(
      "No readable evidence fields were stored for this evidence record. No sentence is substituted.",
    );
  }
  const gxpField = getEvidenceField(evidence, "gxp_impact");
  const gampField = getEvidenceField(evidence, "gamp_category");
  if (gxpField) {
    builder.labelParagraph(
      `GxP impact derivation — ${formatValue(gxpField.value)}`,
      gxpField.evidence || "No derivation sentence was stored.",
      { meta: `Confidence: ${formatConfidence(gxpField.confidence)}` },
    );
  }
  if (gampField) {
    builder.labelParagraph(
      `GAMP category derivation — ${formatValue(gampField.value)}`,
      gampField.evidence || "No derivation sentence was stored.",
      { meta: `Confidence: ${formatConfidence(gampField.confidence)}` },
    );
  }
}

export function renderEvidenceIndexSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.evidence, { newPage: true, landscape: false });
  builder.paragraph(
    "Evidence references are scoped to this export pack. Supporting sentences are reproduced in full; confidence values are shown as percentages.",
    { color: [82, 82, 82], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement) => {
    requirementSummary(builder, requirement);
    if (!requirement.evidence.length) {
      builder.paragraph(
        "No evidence record is stored for the current requirement version. This is an absence of a record.",
      );
      return;
    }
    const sorted = [...requirement.evidence].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "", "en"),
    );
    sorted.forEach((evidence) => {
      builder.divider();
      renderEvidenceIndexRecord(builder, requirement, evidence, refs);
    });
    const riskRefs = requirement.risks.map((risk) => riskReference(refs, risk.id));
    if (riskRefs.length) {
      builder.metaRow("Risk assessments for this requirement", riskRefs.join(", "));
    }
  });
}

export function renderLimitationsSection(builder: PdfBuilder): void {
  builder.startSection(SECTION_TITLES.appendices, { newPage: true, landscape: false });
  builder.callout(
    "This pack is a faithful presentation of the selected records. It is not a substitute for an approved validation dossier, and it does not create approval, execution, or compliance evidence.",
  );
  builder.bullets([
    "Report references such as RA-001, ASR-001, TS-001, and EV-001 are scoped to this pack. They are not persistent database identifiers.",
    "The pack reflects the current requirement version selected at generation time. Historical versions are not substituted.",
    "Freshness is preserved as fresh, stale, or superseded. Stale and superseded records remain visible with their freshness.",
    "Where no ComplianceResult exists, the pack records an absence of the record. It does not present that absence as compliance.",
    "Findings labelled Derived finding are deterministic export-time calculations. They are not persisted CAPA records.",
    "No owners, mitigations, residual-risk values, approvals, signatures, or acceptance decisions are invented.",
    "A machine-readable identifier crosswalk is included in the ZIP metadata. Database identifiers are intentionally not displayed in the reader-facing PDFs.",
  ]);
}

export async function renderConsolidatedPack(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): Promise<Blob> {
  const requirementCount = data.requirements.length;
  builder.cover({
    subtitle: "Validation evidence, assurance decisions, test scripts, and traceability",
    scope: "Selected requirements",
    versionPolicy: "Current version per requirement",
    requirementCount,
    generatedAt: formatDateTime(data.generated_at),
    packReference: refs.packReference,
    contents: [
      SECTION_TITLES.risk,
      SECTION_TITLES.assurance,
      SECTION_TITLES.tests,
      SECTION_TITLES.traceability,
      SECTION_TITLES.gaps,
    ],
  });

  const summary = traceabilitySummary(data);

  const toc = builder.addToc([
    "Executive Summary",
    SECTION_TITLES.risk,
    SECTION_TITLES.assurance,
    SECTION_TITLES.tests,
    SECTION_TITLES.traceability,
    SECTION_TITLES.gaps,
    SECTION_TITLES.appendices,
  ]);
  builder.startSection("Executive Summary", { newPage: true });
  builder.callout(
    `${requirementCount} selected requirement version(s) are included. The pack contains ${summary.requirements} requirement record(s), ${data.requirements.reduce((count, item) => count + item.risks.length, 0)} risk assessment(s), ${data.requirements.reduce((count, item) => count + item.assurance.length, 0)} assurance decision(s), and ${data.requirements.reduce((count, item) => count + item.tests.length, 0)} test script(s).`,
  );
  builder.bullets([
    `Traceability: ${summary.covered_by_tests} covered by tests, ${summary.covered_by_assurance} covered by assurance, ${summary.uncovered} uncovered, and ${summary.stale} stale.`,
    `Orphan findings: O1 ${summary.orphans.O1}, O2 ${summary.orphans.O2}, O3 ${summary.orphans.O3}.`,
    data.compliance_evaluated
      ? "Persisted compliance results are included where available; their stored status is reproduced."
      : "Compliance was not evaluated: no persisted ComplianceResult is available for the selected requirements.",
    "Test execution was not recorded. The test scripts section reproduces script content only.",
  ]);

  renderRiskAssessmentSection(builder, data, refs);
  renderAssuranceSection(builder, data, refs);
  renderTestScriptsSection(builder, data, refs);
  await renderTraceabilitySection(builder, data, refs);
  renderGapReportSection(builder, data, refs);
  renderLimitationsSection(builder);
  builder.fillToc(toc);
  return builder.finalize();
}
