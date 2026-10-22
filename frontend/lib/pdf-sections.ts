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
  builder.metaRow("Lifecycle status", requirement.status || "Not recorded");
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
        fontSize: 8.2,
        color: [96, 109, 128],
      });
      builder.bullets(lines, { fontSize: 8.4 });
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
  builder.metaRow("Assessment lifecycle", risk.status || "Not recorded");
  builder.metaRow("Freshness", risk.freshness || "Not recorded");
  builder.metaRow("Current assessment", risk.is_current ? "Yes" : "No");
  builder.metaRow("Created", formatDateTime(risk.created_at));
  builder.metaRow("Last updated", formatDateTime(risk.updated_at));
  builder.metaRow("GxP impact", formatValue(risk.gxp_impact));
  builder.metaRow("GAMP category", formatValue(risk.gamp_category));

  builder.subheading("Risk score");
  builder.metaRow("Severity", risk.severity ?? "Not recorded");
  builder.metaRow("Probability", risk.probability ?? "Not recorded");
  builder.metaRow("Detectability", risk.detectability ?? "Not recorded");
  builder.metaRow("RPN points", risk.rpn_points ?? "Not recorded");
  builder.metaRow("Normalized RPN", risk.rpn ?? "Not recorded");
  builder.metaRow("Risk band", riskBandLabel(risk.band));
  builder.metaRow("Configuration version", risk.configuration_version ?? "Not recorded");

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
        `Lifecycle status: ${test.status || "Not recorded"} · Freshness: ${
          test.freshness || "Not recorded"
        }`,
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
  builder.metaRow("Lifecycle status", test.status || "Not recorded");
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
    "Execution status: not recorded. RAVEN stores the script lifecycle status shown above; it does not store an execution result, and no pass or fail result is implied.",
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
    "Test scripts are reproduced from the stored script text. Lifecycle status is shown separately from execution; no execution result is stored by RAVEN.",
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

const TRACE_COLUMNS: PdfTableColumn[] = [
  { header: "Requirement", key: "requirement_id", width: 19 },
  { header: "Version", key: "requirement_version", width: 9 },
  { header: "Risk", key: "risk_id", width: 25 },
  { header: "Severity", key: "severity", width: 8, align: "center" },
  { header: "Probability", key: "probability", width: 9, align: "center" },
  { header: "Detectability", key: "detectability", width: 9, align: "center" },
  { header: "RPN points", key: "rpn", width: 9, align: "center" },
  { header: "Risk band", key: "band", width: 10 },
  { header: "Assurance level", key: "assurance_level", width: 13 },
  { header: "Assurance label", key: "assurance_label", width: 23 },
  { header: "Reason code", key: "reason_code", width: 20 },
  { header: "Test", key: "test_id", width: 30 },
  { header: "Test title", key: "test_title", width: 27 },
  { header: "Test origin", key: "test_origin", width: 12 },
  { header: "Coverage", key: "coverage_status", width: 20 },
  { header: "Stale", key: "stale", width: 8, align: "center" },
  { header: "Orphan flags", key: "orphan_flags", width: 14 },
];

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
    { color: [96, 109, 128], fontSize: 8.4 },
  );
  builder.subheading("Coverage summary");
  builder.metaRow(
    "Requirements · covered by tests · covered by assurance · uncovered · stale",
    `${summary.requirements} · ${summary.covered_by_tests} · ${summary.covered_by_assurance} · ${summary.uncovered} · ${summary.stale}`,
  );
  builder.metaRow(
    "Traceability rows · stale rows",
    `${summary.rows} · ${summary.stale_rows}`,
  );
  builder.metaRow(
    "O1 · O2 · O3 · total orphan findings",
    `${summary.orphans.O1} · ${summary.orphans.O2} · ${summary.orphans.O3} · ${summary.orphans.total}`,
  );
  builder.y += 2;

  if (!data.traceability.rows.length) {
    builder.paragraph(
      "No traceability rows are available for the selected requirement versions. No coverage is inferred.",
    );
    return;
  }

  const rows = data.traceability.rows.map((row) => ({
    ...row,
    requirement_id: row.requirement_id || "Unlinked",
    requirement_version: row.requirement_version || "—",
    risk_id: row.risk_id || "—",
    band: riskBandLabel(row.band),
    test_title: row.test_title || "—",
    test_id: row.test_id || "—",
    coverage_status: coverageLabel(row.coverage_status),
    stale: row.stale ? "Yes" : "No",
    orphan_flags: String(row.orphan_flags || "").replace(/;/g, ", ") || "—",
  }));
  builder.table(TRACE_COLUMNS, rows, { fontSize: 6.7 });
  builder.paragraph(
    "The matrix is a point-in-time export. A row with no test is not evidence that the requirement is untestable; it means no test script was recorded against the selected current version.",
    { color: [96, 109, 128], fontSize: 8.2 },
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
    "Freshness is preserved as fresh, stale, or superseded. Stale and superseded records remain visible with their status.",
    "Test execution results are not stored in the current data model. A lifecycle status of DRAFT, IN_REVIEW, APPROVED, or SUPERSEDED is not an execution outcome.",
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

  builder.startSection("Document Control", { newPage: true });
  builder.metadataGroup("Export scope", [
    ["Scope", "Selected requirements"],
    ["Version selection", "Current version per requirement"],
    ["Requirements included", String(requirementCount)],
    ["Pack reference", refs.packReference],
    ["Generation date and time", formatDateTime(data.generated_at)],
  ]);
  const summary = traceabilitySummary(data);
  builder.metadataGroup("Record summary", [
    ["Risk assessments", String(data.requirements.reduce((count, item) => count + item.risks.length, 0))],
    ["Assurance decisions", String(data.requirements.reduce((count, item) => count + item.assurance.length, 0))],
    ["Test scripts", String(data.requirements.reduce((count, item) => count + item.tests.length, 0))],
    [
      "Traceability coverage",
      `${summary.covered_by_tests} by tests · ${summary.covered_by_assurance} by assurance · ${summary.uncovered} uncovered · ${summary.stale} stale`,
    ],
    ["Orphan findings", `O1 ${summary.orphans.O1} · O2 ${summary.orphans.O2} · O3 ${summary.orphans.O3}`],
  ]);
  builder.metadataGroup("Data availability", [
    [
      "Compliance evaluation",
      data.compliance_evaluated
        ? `${data.compliance_record_count ?? 0} persisted result(s) available`
        : "Not evaluated / no persisted result available",
    ],
    ["Test execution", "Not stored in the current data model"],
    ["Approvals and signatures", "Not stored in the export dataset"],
  ]);
  builder.paragraph(
    "A reader-facing PDF does not display long database identifiers. The ZIP includes a separate machine-readable crosswalk for troubleshooting and provenance.",
    { color: [96, 109, 128], fontSize: 8.4 },
  );

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
    "Test execution was not recorded. The test scripts section reports lifecycle status only.",
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
