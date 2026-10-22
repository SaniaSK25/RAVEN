"use client";

import JSZip from "jszip";
import { backendFetch } from "@/lib/backend-api";
import { PdfBuilder } from "@/lib/pdf-layout";
import {
  renderAssuranceSection,
  renderConsolidatedPack,
  renderEvidenceIndexSection,
  renderGapReportSection,
  renderLimitationsSection,
  renderRiskAssessmentSection,
  renderTestScriptsSection,
  renderTraceabilitySection,
  SECTION_TITLES,
} from "@/lib/pdf-sections";
import {
  buildMetadataCrosswalk,
  buildReportReferences,
  formatDateTime,
  matrixToCsv,
  type ExportDataset,
  type ReportReferences,
} from "@/lib/validation-pack";

export type { ExportDataset } from "@/lib/validation-pack";

type SectionKey = "risk" | "assurance" | "tests" | "traceability" | "gaps" | "evidence";

function assertDataset(data: ExportDataset): void {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.requirements) ||
    !data.requirements.length ||
    !data.traceability ||
    !Array.isArray(data.traceability.rows) ||
    !Array.isArray(data.orphans) ||
    !Array.isArray(data.changes)
  ) {
    throw new Error(
      "The backend returned an incomplete validation-pack dataset. No PDF or ZIP was created.",
    );
  }
}

export async function fetchValidationDataset(keys: string[]): Promise<ExportDataset> {
  const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
  if (!unique.length) {
    throw new Error("Select at least one requirement before retrieving export data.");
  }
  const data = await backendFetch<ExportDataset>(
    `validation-pack?requirement_keys=${encodeURIComponent(unique.join(","))}`,
  );
  assertDataset(data);
  return data;
}

function sectionPdf(
  data: ExportDataset,
  section: SectionKey,
  refs: ReportReferences,
): Blob {
  assertDataset(data);
  const generatedAt = formatDateTime(data.generated_at);
  const builder = new PdfBuilder({
    packReference: refs.packReference,
    generatedAt,
    title: "RAVEN — Validation Pack",
  });
  builder.cover({
    subtitle: "Validation evidence and traceability",
    scope: "Selected requirements",
    versionPolicy: "Current version per requirement",
    requirementCount: data.requirements.length,
    generatedAt,
    packReference: refs.packReference,
  });
  switch (section) {
    case "risk":
      renderRiskAssessmentSection(builder, data, refs);
      break;
    case "assurance":
      renderAssuranceSection(builder, data, refs);
      break;
    case "tests":
      renderTestScriptsSection(builder, data, refs);
      break;
    case "traceability":
      renderTraceabilitySection(builder, data, refs);
      break;
    case "gaps":
      renderGapReportSection(builder, data, refs);
      renderLimitationsSection(builder);
      break;
    case "evidence":
      renderEvidenceIndexSection(builder, data, refs);
      break;
  }
  return builder.finalize();
}

export function generateRiskAssessmentPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "risk", refs);
}

export function generateAssuranceRationalePDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "assurance", refs);
}

export function generateTestScriptsPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "tests", refs);
}

export function generateTraceabilityPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "traceability", refs);
}

export function generateGapReportPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "gaps", refs);
}

export function generateEvidenceIndexPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  return sectionPdf(data, "evidence", refs);
}

export function generateValidationPackPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Blob {
  assertDataset(data);
  const builder = new PdfBuilder({
    packReference: refs.packReference,
    generatedAt: formatDateTime(data.generated_at),
    title: "RAVEN — Validation Pack",
  });
  return renderConsolidatedPack(builder, data, refs);
}

function readmeForPack(data: ExportDataset, packReference: string): string {
  const summary = data.summary || {};
  const traceability = data.traceability.summary;
  return [
    "RAVEN — Validation Pack",
    "=======================",
    "",
    `Pack reference: ${packReference}`,
    `Generated: ${formatDateTime(data.generated_at)}`,
    "Scope: Selected requirements",
    "Version selection: Current version per requirement",
    "",
    "Contents",
    "--------",
    "RAVEN_Validation_Pack.pdf — consolidated validation pack with all sections",
    "01_Risk_Assessment.pdf",
    "02_Assurance_Rationale.pdf",
    "03_Test_Scripts.pdf",
    "04_Traceability_Matrix.pdf",
    "05_Gap_Report.pdf",
    "06_Evidence_Index.pdf",
    "Traceability_Matrix.csv — optional machine-readable traceability export",
    "export-metadata.json — report-reference and database-identifier crosswalk",
    "",
    "How to read this pack",
    "--------------------",
    "Report references such as RA-001, ASR-001, TS-001, and EV-001 are scoped to this pack.",
    "They are not persistent database identifiers.",
    "Long database identifiers are intentionally omitted from the reader-facing PDFs and kept in the",
    "machine-readable crosswalk for troubleshooting and provenance.",
    "",
    "Test scripts",
    "------------",
    "The Test Scripts section reports the stored lifecycle status and reproduces the stored script text.",
    "Execution results, pass/fail outcomes, and approvals are not stored in the current export dataset.",
    "A lifecycle status such as APPROVED is not evidence that a script was executed or passed.",
    "",
    "Compliance",
    "----------",
    data.compliance_evaluated
      ? "Persisted ComplianceResult records are available for the selected requirements. Their stored status is reproduced; this pack does not create a compliance verdict."
      : "No persisted ComplianceResult records are available for the selected requirements. Compliance is recorded as not evaluated and is not inferred.",
    "",
    "Gap report",
    "----------",
    "Findings labelled Derived finding are deterministic export-time calculations. They are not persisted",
    "CAPA records. Persisted compliance results, where present, are labelled separately.",
    "",
    "Dataset summary",
    "---------------",
    `Requirements: ${data.requirements.length}`,
    `Risk assessments: ${String(summary.risk_assessments ?? data.requirements.reduce((count, item) => count + item.risks.length, 0))}`,
    `Assurance decisions: ${data.requirements.reduce((count, item) => count + item.assurance.length, 0)}`,
    `Test scripts: ${String(summary.test_scripts ?? data.requirements.reduce((count, item) => count + item.tests.length, 0))}`,
    traceability
      ? `Traceability: ${traceability.covered_by_tests} covered by tests, ${traceability.covered_by_assurance} covered by assurance, ${traceability.uncovered} uncovered, ${traceability.stale} stale`
      : "Traceability: see Traceability_Matrix.csv",
    "",
    "This pack does not invent owners, mitigations, residual risk, approvals, execution results, or",
    "compliance verdicts.",
    "",
  ].join("\n");
}

export async function generateValidationPackZip(data: ExportDataset): Promise<Blob> {
  assertDataset(data);
  const refs = buildReportReferences(data);
  const zip = new JSZip();
  const sectionFiles: Array<[string, Blob]> = [
    ["01_Risk_Assessment.pdf", generateRiskAssessmentPDF(data, refs)],
    ["02_Assurance_Rationale.pdf", generateAssuranceRationalePDF(data, refs)],
    ["03_Test_Scripts.pdf", generateTestScriptsPDF(data, refs)],
    ["04_Traceability_Matrix.pdf", generateTraceabilityPDF(data, refs)],
    ["05_Gap_Report.pdf", generateGapReportPDF(data, refs)],
    ["06_Evidence_Index.pdf", generateEvidenceIndexPDF(data, refs)],
  ];
  zip.file("RAVEN_Validation_Pack.pdf", generateValidationPackPDF(data, refs));
  for (const [filename, blob] of sectionFiles) zip.file(filename, blob);
  zip.file("Traceability_Matrix.csv", matrixToCsv(data));
  zip.file(
    "export-metadata.json",
    JSON.stringify(buildMetadataCrosswalk(data, refs), null, 2),
  );
  zip.file("README.md", readmeForPack(data, refs.packReference));
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { SECTION_TITLES };
