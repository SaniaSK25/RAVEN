"use client";

import JSZip from "jszip";
import { backendFetch } from "@/lib/backend-api";
import { PdfBuilder } from "@/lib/pdf-layout";
import {
  renderAssuranceSection,
  renderConsolidatedPack,
  renderGapReportSection,
  renderRiskAssessmentSection,
  renderTestScriptsSection,
  renderTraceabilitySection,
  SECTION_TITLES,
} from "@/lib/pdf-sections";
import {
  buildReportReferences,
  formatDateTime,
  type ExportDataset,
  type ReportReferences,
} from "@/lib/validation-pack";

export type { ExportDataset } from "@/lib/validation-pack";

type SectionKey = "risk" | "assurance" | "tests" | "traceability" | "gaps";

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
): Promise<Blob> {
  assertDataset(data);
  const generatedAt = formatDateTime(data.generated_at);
  const builder = new PdfBuilder({
    packReference: refs.packReference,
    generatedAt,
    title: `RAVEN — ${SECTION_TITLES[section]}`,
  });
  builder.cover({
    subtitle: "Validation evidence and traceability",
    scope: "Selected requirements",
    versionPolicy: "Current version per requirement",
    requirementCount: data.requirements.length,
    generatedAt,
    packReference: refs.packReference,
    contents: [SECTION_TITLES[section]],
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
      return renderTraceabilitySection(builder, data, refs).then(() =>
        builder.finalize(),
      );
    case "gaps":
      renderGapReportSection(builder, data, refs);
      break;
  }
  return Promise.resolve(builder.finalize());
}

export function generateRiskAssessmentPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  return sectionPdf(data, "risk", refs);
}

export function generateAssuranceRationalePDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  return sectionPdf(data, "assurance", refs);
}

export function generateTestScriptsPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  return sectionPdf(data, "tests", refs);
}

export function generateTraceabilityPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  return sectionPdf(data, "traceability", refs);
}

export function generateGapReportPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  return sectionPdf(data, "gaps", refs);
}

export function generateValidationPackPDF(
  data: ExportDataset,
  refs: ReportReferences = buildReportReferences(data),
): Promise<Blob> {
  assertDataset(data);
  const builder = new PdfBuilder({
    packReference: refs.packReference,
    generatedAt: formatDateTime(data.generated_at),
    title: "RAVEN — Validation Pack Summary",
  });
  return renderConsolidatedPack(builder, data, refs);
}

export async function generateValidationPackZip(data: ExportDataset): Promise<Blob> {
  assertDataset(data);
  const refs = buildReportReferences(data);
  const zip = new JSZip();
  const sectionFiles = await Promise.all([
    generateRiskAssessmentPDF(data, refs).then(
      (blob) => ["01_Risk_Assessment.pdf", blob] as const,
    ),
    generateAssuranceRationalePDF(data, refs).then(
      (blob) => ["02_Assurance_Rationale.pdf", blob] as const,
    ),
    generateTestScriptsPDF(data, refs).then(
      (blob) => ["03_Test_Scripts.pdf", blob] as const,
    ),
    generateTraceabilityPDF(data, refs).then(
      (blob) => ["04_Traceability_Matrix.pdf", blob] as const,
    ),
    generateGapReportPDF(data, refs).then(
      (blob) => ["05_Gap_Report.pdf", blob] as const,
    ),
  ]);
  for (const [filename, blob] of sectionFiles) zip.file(filename, blob);
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
