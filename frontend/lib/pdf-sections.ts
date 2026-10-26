import { PdfBuilder, type PdfTableColumn } from "@/lib/pdf-layout";
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
  builder.labelParagraph(
    `${label} — ${score ?? "Not recorded"}`,
    trace?.reasoning || "No scoring rationale was stored for this factor.",
    {
      meta: `Rule ${trace?.rule_id || "Not recorded"} · Rule version ${
        trace?.rule_version || "Not recorded"
      }`,
    },
  );
  if (trace?.decision_path) {
    const lines = humanizeDecisionPath(trace.decision_path);
    if (lines.length && lines[0] !== "Not recorded") {
      builder.paragraph("Decision inputs", {
        fontSize: 8.8,
        color: [96, 109, 128],
      });
      builder.bullets(lines, { fontSize: 8.8 });
    }
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
      { header: "Factor", key: "factor", width: 24 },
      { header: "Score", key: "score", width: 12, align: "center" },
      { header: "Rule", key: "rule", width: 28 },
      { header: "Rule version", key: "rule_version", width: 18 },
      { header: "Rationale", key: "rationale", width: 62 },
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
      rationale:
        (trace as RiskRecord["severity_result"])?.reasoning || "Not recorded",
    })),
    { fontSize: 8.6 },
  );
  builder.metadataGroup("Derived classification", [
    ["RPN points", risk.rpn_points ?? "Not recorded"],
    ["Normalized RPN", risk.rpn ?? "Not recorded"],
    ["Risk band", riskBandLabel(risk.band)],
    ["Configuration version", risk.configuration_version ?? "Not recorded"],
  ]);

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
  builder.paragraph(
    "Each assessment below is scoped to the selected current requirement version. Scores, classifications, and rationales are reproduced from the stored record.",
    { color: [96, 109, 128], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement, index) => {
    if (index > 0) builder.newPage(SECTION_TITLES.risk, false);
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
      renderRiskRecord(builder, requirement, risk, refs);
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
    builder.metaRow("Risk band", riskBandLabel(risk.band));
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
  builder.paragraph(
    "The assurance level and rule below are stored decisions. The explanation is derived from the current deterministic assurance implementation; it does not replace the stored rationale.",
    { color: [96, 109, 128], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement, index) => {
    if (index > 0) builder.newPage(SECTION_TITLES.assurance, false);
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
      builder.divider();
      renderAssuranceRecord(builder, requirement, assurance, refs);
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
  builder.paragraph(
    "Execution results are not recorded in the export dataset; no pass or fail result is implied.",
    { color: [120, 75, 20], fontSize: 8.5 },
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
    { color: [96, 109, 128], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement, index) => {
    if (index > 0) builder.newPage(SECTION_TITLES.tests, false);
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
      renderTestRecord(builder, requirement, test, refs);
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
  { header: "Version", key: "requirement_version", width: 9 },
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

function renderTraceabilityGraph(builder: PdfBuilder, data: ExportDataset): void {
  const graph = data.traceability.graph;
  if (!graph || !graph.edges.length) {
    builder.paragraph(
      "No graph edges are available for the selected requirement versions. The matrix below preserves the available row-level traceability data.",
      { color: [96, 109, 128], fontSize: 9 },
    );
    return;
  }
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodeLabel = (id: string): string => {
    const node = nodes.get(id);
    if (!node) return "Unresolved node";
    const type = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    return `${type}: ${node.label}${node.orphan || node.orphaned ? " (orphaned)" : ""}`;
  };
  builder.subheading("Traceability graph");
  builder.paragraph(
    "The diagram below shows the directed traceability chain. The relationship table beneath it preserves every backend edge in a searchable, printable form.",
    { color: [96, 109, 128], fontSize: 9 },
  );
  builder.ensureSpace(96);
  const doc = builder.doc;
  const graphTop = builder.y;
  const graphHeight = 84;
  const nodeWidth = 54;
  const nodeHeight = 18;
  const columnGap = (builder.contentWidth - nodeWidth * 4) / 3;
  const types = ["requirement", "risk", "assurance", "test"];
  const colors: Record<string, { fill: [number, number, number]; stroke: [number, number, number]; text: [number, number, number] }> = {
    requirement: { fill: [245, 245, 245], stroke: [82, 82, 91], text: [24, 24, 27] },
    risk: { fill: [254, 242, 242], stroke: [185, 28, 28], text: [127, 29, 29] },
    assurance: { fill: [244, 244, 245], stroke: [113, 113, 122], text: [63, 63, 70] },
    test: { fill: [239, 246, 255], stroke: [29, 78, 216], text: [30, 58, 138] },
  };
  const positions = new Map<string, { x: number; y: number; type: string }>();
  types.forEach((type, column) => {
    const columnNodes = graph.nodes.filter((node) => node.type === type);
    const visibleNodes = columnNodes.slice(0, 4);
    const x = builder.margin + column * (nodeWidth + columnGap);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(96, 109, 128);
    doc.text(type.toUpperCase(), x, graphTop - 2);
    visibleNodes.forEach((node, index) => {
      const y = graphTop + 5 + index * 20;
      positions.set(node.id, { x, y, type });
      const style = colors[type];
      doc.setFillColor(...style.fill);
      doc.setDrawColor(...style.stroke);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, nodeWidth, nodeHeight, 2.5, 2.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(...style.text);
      const label = `${node.label}${node.orphan || node.orphaned ? " · orphaned" : ""}`;
      const lines = doc.splitTextToSize(label, nodeWidth - 4).slice(0, 3);
      const lineHeight = 2.8;
      const startY = y + nodeHeight / 2 - ((lines.length - 1) * lineHeight) / 2 + 1.8;
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, x + nodeWidth / 2, startY + lineIndex * lineHeight, { align: "center" });
      });
    });
    if (columnNodes.length > visibleNodes.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(96, 109, 128);
      doc.text(`+ ${columnNodes.length - visibleNodes.length} more`, x, graphTop + 83);
    }
  });
  graph.edges.forEach((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) return;
    const x1 = source.x + nodeWidth;
    const y1 = source.y + nodeHeight / 2;
    const x2 = target.x;
    const y2 = target.y + nodeHeight / 2;
    const orphaned = edge.stale || nodes.get(edge.source)?.orphaned || nodes.get(edge.target)?.orphaned;
    const edgeColor: [number, number, number] = orphaned ? [217, 119, 6] : [100, 116, 139];
    doc.setDrawColor(...edgeColor);
    doc.setLineWidth(0.45);
    if (orphaned) doc.setLineDashPattern([1.5, 1.2], 0);
    doc.line(x1, y1, x2 - 2, y2);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(...edgeColor);
    doc.triangle(x2 - 2, y2, x2 - 5, y2 - 1.5, x2 - 5, y2 + 1.5, "F");
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(96, 109, 128);
  doc.text("Solid line = current relationship", builder.margin, graphTop + graphHeight);
  doc.text("Dashed amber line = stale or orphaned relationship", builder.margin + 52, graphTop + graphHeight);
  builder.y = graphTop + graphHeight + 5;
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
      state: edge.stale || nodes.get(edge.source)?.orphaned || nodes.get(edge.target)?.orphaned
        ? "Stale / orphaned"
        : "Current",
    })),
    { fontSize: 8.6 },
  );
}

export function renderTraceabilitySection(
  builder: PdfBuilder,
  data: ExportDataset,
  _refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.traceability, {
    newPage: true,
    landscape: true,
  });
  const summary = traceabilitySummary(data);
  builder.paragraph(
    "Coverage and orphan semantics are supplied by the backend traceability service. O2 orphan tests have no linked requirement and are shown as Unlinked.",
    { color: [96, 109, 128], fontSize: 9 },
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

  renderTraceabilityGraph(builder, data);
  builder.y += 3;

  if (!data.traceability.rows.length) {
    builder.paragraph(
      "No traceability rows are available for the selected requirement versions. No coverage is inferred.",
    );
    return;
  }

  const rows = traceabilityDisplayRows(data);
  builder.subheading("Risk and scoring trace");
  builder.table(TRACE_RISK_COLUMNS, rows, { fontSize: 8.8 });
  builder.y += 4;
  builder.subheading("Assurance and coverage trace");
  builder.table(TRACE_COVERAGE_COLUMNS, rows, { fontSize: 8.5 });
  builder.paragraph(
    "The matrix is a point-in-time export. A row with no test is not evidence that the requirement is untestable; it means no test script was recorded against the selected current version.",
    { color: [96, 109, 128], fontSize: 9 },
  );
}

export function renderGapReportSection(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): void {
  builder.startSection(SECTION_TITLES.gaps, { newPage: true, landscape: false });
  const findings = deriveGapFindings(data, refs);
  builder.paragraph(
    "Findings are deterministic export-time calculations from the selected records. They are not persisted approvals, CAPA records, or compliance verdicts. Persisted compliance results are labelled separately.",
    { color: [96, 109, 128], fontSize: 8.6 },
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
    builder.subheading(`${finding.id} — ${finding.category}`);
    builder.metaRow("Requirement", finding.requirementRef);
    builder.metaRow("Requirement version", finding.requirementVersion);
    builder.metaRow("Related references", finding.related.length ? finding.related.join(" · ") : "None");
    builder.metaRow("Source", finding.source);
    builder.metaRow("Status", finding.status);
    builder.labelParagraph("Finding", finding.finding);
    builder.labelParagraph("Recommendation", finding.recommendation);
    builder.labelParagraph("Closure evidence", finding.closureEvidence);
    builder.divider();
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
    { color: [96, 109, 128], fontSize: 8.6 },
  );
  orderedRequirements(data).forEach((requirement, index) => {
    if (index > 0) builder.newPage(SECTION_TITLES.evidence, false);
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
  builder.startSection(SECTION_TITLES.limitations, { newPage: true, landscape: false });
  builder.paragraph(
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

export function renderConsolidatedPack(
  builder: PdfBuilder,
  data: ExportDataset,
  refs: ReportReferences,
): Blob {
  const requirementCount = data.requirements.length;
  builder.cover({
    subtitle: "Validation evidence, assurance decisions, test scripts, and traceability",
    scope: "Selected requirements",
    versionPolicy: "Current version per requirement",
    requirementCount,
    generatedAt: formatDateTime(data.generated_at),
    packReference: refs.packReference,
  });

  const summary = traceabilitySummary(data);

  builder.startSection("Executive Summary", { newPage: true });
  builder.paragraph(
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

  const toc = builder.addToc([
    SECTION_TITLES.risk,
    SECTION_TITLES.assurance,
    SECTION_TITLES.tests,
    SECTION_TITLES.traceability,
    SECTION_TITLES.gaps,
    SECTION_TITLES.evidence,
    SECTION_TITLES.limitations,
  ]);
  renderRiskAssessmentSection(builder, data, refs);
  renderAssuranceSection(builder, data, refs);
  renderTestScriptsSection(builder, data, refs);
  renderTraceabilitySection(builder, data, refs);
  renderGapReportSection(builder, data, refs);
  renderEvidenceIndexSection(builder, data, refs);
  renderLimitationsSection(builder);
  builder.fillToc(toc);
  return builder.finalize();
}
