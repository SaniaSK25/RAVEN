"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import type { RequirementDetail } from "@/lib/requirement-detail-data";
import type { TraceMatrixRow } from "@/lib/traceability-data";
import type { RiskAssessment, AssuranceDecision, Test, Evidence, RequirementVersion, ChangeEvent, ComplianceCriterion } from "@/lib/domain";

/**
 * Configuration for PDF generation
 */
const PDF_CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 20,
  fontSize: {
    title: 18,
    heading: 14,
    subheading: 12,
    body: 10,
    small: 8,
  },
  colors: {
    primary: [0x1A, 0x1A, 0x2E] as const, // Dark blue
    secondary: [0x4A, 0x4A, 0x6A] as const,
    accent: [0x00, 0x7A, 0xCC] as const,
    text: [0x33, 0x33, 0x33] as const,
    lightText: [0x66, 0x66, 0x66] as const,
    border: [0xDD, 0xDD, 0xDD] as const,
    headerBg: [0xF0, 0xF0, 0xF5] as const,
  },
};

export interface ValidationPackData {
  requirement: RequirementDetail;
  traceMatrixRow?: TraceMatrixRow;
}

/**
 * Generate a professional PDF document with consistent styling
 */
function createBasePDF(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add header
  const headerBg = PDF_CONFIG.colors.headerBg;
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(0, 0, PDF_CONFIG.pageWidth, 35, "F");
  
  const primary = PDF_CONFIG.colors.primary;
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFontSize(PDF_CONFIG.fontSize.title);
  doc.setFont("helvetica", "bold");
  doc.text(title, PDF_CONFIG.margin, 20);
  
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont("helvetica", "normal");
  const secondary = PDF_CONFIG.colors.secondary;
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text(subtitle, PDF_CONFIG.margin, 28);

  // Add footer line
  const border = PDF_CONFIG.colors.border;
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(PDF_CONFIG.margin, PDF_CONFIG.pageHeight - 15, PDF_CONFIG.pageWidth - PDF_CONFIG.margin, PDF_CONFIG.pageHeight - 15);
  
  doc.setFontSize(PDF_CONFIG.fontSize.small);
  const lightText = PDF_CONFIG.colors.lightText;
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.text(`RAVEN Validation Pack Export | Generated: ${new Date().toLocaleDateString()}`, PDF_CONFIG.margin, PDF_CONFIG.pageHeight - 10);
  doc.text(`Page`, PDF_CONFIG.pageWidth - PDF_CONFIG.margin - 20, PDF_CONFIG.pageHeight - 10);

  return doc;
}

function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(PDF_CONFIG.fontSize.heading);
  doc.setFont("helvetica", "bold");
  const primary = PDF_CONFIG.colors.primary;
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(title, PDF_CONFIG.margin, y);
  
  const accent = PDF_CONFIG.colors.accent;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margin, y + 1, PDF_CONFIG.margin + 50, y + 1);
  
  return y + 8;
}

function addKeyValue(doc: jsPDF, key: string, value: string, y: number, indent: number = 0): number {
  const x = PDF_CONFIG.margin + indent;
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont("helvetica", "bold");
  const secondary = PDF_CONFIG.colors.secondary;
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text(key, x, y);
  
  doc.setFont("helvetica", "normal");
  const textColor = PDF_CONFIG.colors.text;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const keyWidth = doc.getTextWidth(key) + 2;
  doc.text(value, x + keyWidth, y);
  
  return y + 6;
}

function addMultiLineText(doc: jsPDF, text: string, y: number, indent: number = 0, maxWidth?: number): number {
  const x = PDF_CONFIG.margin + indent;
  const width = maxWidth || PDF_CONFIG.pageWidth - 2 * PDF_CONFIG.margin - indent;
  
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont("helvetica", "normal");
  const textColor = PDF_CONFIG.colors.text;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  
  return y + lines.length * 5 + 2;
}

function addTable(doc: jsPDF, headers: string[], rows: string[][], y: number): number {
  const colWidth = (PDF_CONFIG.pageWidth - 2 * PDF_CONFIG.margin) / headers.length;
  let currentY = y;
  
  // Header row
  const headerBg = PDF_CONFIG.colors.headerBg;
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(PDF_CONFIG.margin, currentY, PDF_CONFIG.pageWidth - 2 * PDF_CONFIG.margin, 8, "F");
  
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setFont("helvetica", "bold");
  const primary = PDF_CONFIG.colors.primary;
  doc.setTextColor(primary[0], primary[1], primary[2]);
  
  headers.forEach((header, i) => {
    doc.text(header, PDF_CONFIG.margin + i * colWidth + 2, currentY + 5.5);
  });
  
  currentY += 8;
  
  // Data rows
  doc.setFont("helvetica", "normal");
  const textColor = PDF_CONFIG.colors.text;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  rows.forEach((row, rowIndex) => {
    if (currentY > PDF_CONFIG.pageHeight - 30) {
      doc.addPage();
      currentY = 25;
    }
    
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(PDF_CONFIG.margin, currentY, PDF_CONFIG.pageWidth - 2 * PDF_CONFIG.margin, 7, "F");
    }
    
    row.forEach((cell, i) => {
      doc.text(cell, PDF_CONFIG.margin + i * colWidth + 2, currentY + 5);
    });
    
    currentY += 7;
  });
  
  return currentY + 4;
}

function checkPageBreak(doc: jsPDF, y: number, neededSpace: number = 20): number {
  if (y > PDF_CONFIG.pageHeight - neededSpace) {
    doc.addPage();
    return 25;
  }
  return y;
}

/**
 * Generate Risk Assessment PDF
 */
export function generateRiskAssessmentPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = createBasePDF("Risk Assessment", `Requirement: ${requirement.id} - ${requirement.title}`);
  
  let y = 45;
  
  // Requirement Info
  y = addSectionHeader(doc, "Requirement Information", y);
  y = addKeyValue(doc, "Requirement ID: ", requirement.id, y);
  y = addKeyValue(doc, "Title: ", requirement.title, y);
  y = addKeyValue(doc, "Version: ", requirement.version.toString(), y);
  y = addKeyValue(doc, "GAMP Category: ", requirement.gampCategory, y);
  y = addKeyValue(doc, "GxP Impact: ", requirement.gxpImpact ? "Yes" : "No", y);
  y = addKeyValue(doc, "Status: ", requirement.status.toUpperCase(), y);
  y += 4;
  
  // Risk Assessment
  if (requirement.riskDetail) {
    const risk = requirement.riskDetail;
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, "Risk Assessment", y);
    
    y = addKeyValue(doc, "Risk ID: ", risk.id, y);
    y = addKeyValue(doc, "Risk Band: ", risk.band, y);
    y = addKeyValue(doc, "RPN: ", risk.rpn.toString(), y);
    y = addKeyValue(doc, "Severity: ", risk.severity.toString(), y);
    y = addKeyValue(doc, "Probability: ", risk.probability.toString(), y);
    y = addKeyValue(doc, "Detectability: ", risk.detectability.toString(), y);
    y = addKeyValue(doc, "Rule ID: ", risk.ruleId, y);
    y += 2;
    
    y = addKeyValue(doc, "Decision Path:", "", y);
    y = checkPageBreak(doc, y);
    risk.decisionPath.forEach((step) => {
      y = addMultiLineText(doc, `• ${step}`, y, 10);
    });
    y += 2;
    
    y = addKeyValue(doc, "Reasoning:", "", y);
    y = checkPageBreak(doc, y);
    y = addMultiLineText(doc, risk.reasoning, y, 10);
  } else {
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, "Risk Assessment", y);
    y = addMultiLineText(doc, "No risk assessment available for this requirement.", y);
  }
  
  // Evidence
  if (requirement.evidence && requirement.evidence.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Supporting Evidence", y);
    
    const headers = ["Label", "Value", "Confidence", "Source", "Summary"];
    const rows = requirement.evidence.map((ev) => [
      ev.label,
      ev.value,
      ev.confidence.toUpperCase(),
      ev.source,
      ev.summary.substring(0, 60) + (ev.summary.length > 60 ? "..." : ""),
    ]);
    
    y = addTable(doc, headers, rows, y);
  }
  
  // Version History
  if (requirement.versions && requirement.versions.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Version History", y);
    
    const headers = ["Version", "Title", "Status", "Created", "Superseded"];
    const rows = requirement.versions.map((v) => [
      `v${v.version}`,
      v.title,
      v.status.toUpperCase(),
      new Date(v.createdAt).toLocaleDateString(),
      v.supersededAt ? new Date(v.supersededAt).toLocaleDateString() : "Current",
    ]);
    
    y = addTable(doc, headers, rows, y);
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    const lightText = PDF_CONFIG.colors.lightText;
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Page ${i} of ${pageCount}`, PDF_CONFIG.pageWidth - PDF_CONFIG.margin - 20, PDF_CONFIG.pageHeight - 10);
  }
  
  return doc.output("blob");
}

/**
 * Generate Assurance Rationale PDF
 */
export function generateAssuranceRationalePDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = createBasePDF("Assurance Rationale", `Requirement: ${requirement.id} - ${requirement.title}`);
  
  let y = 45;
  
  // Requirement Info
  y = addSectionHeader(doc, "Requirement Information", y);
  y = addKeyValue(doc, "Requirement ID: ", requirement.id, y);
  y = addKeyValue(doc, "Title: ", requirement.title, y);
  y = addKeyValue(doc, "Version: ", requirement.version.toString(), y);
  y = addKeyValue(doc, "Risk Band: ", requirement.riskDetail?.band ?? "N/A", y);
  y = addKeyValue(doc, "RPN: ", requirement.riskDetail?.rpn.toString() ?? "N/A", y);
  y += 4;
  
  // Assurance Decision
  if (requirement.assuranceDetail) {
    const assurance = requirement.assuranceDetail;
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, "Assurance Decision", y);
    
    y = addKeyValue(doc, "Decision ID: ", assurance.id, y);
    y = addKeyValue(doc, "Outcome: ", assurance.outcome.toUpperCase(), y);
    y = addKeyValue(doc, "Rule ID: ", assurance.ruleId, y);
    y = addKeyValue(doc, "Generate Test: ", assurance.generateTest ? "Yes" : "No", y);
    y += 2;
    
    y = addKeyValue(doc, "Decision Path:", "", y);
    y = checkPageBreak(doc, y);
    assurance.decisionPath.forEach((step) => {
      y = addMultiLineText(doc, `• ${step}`, y, 10);
    });
    y += 2;
    
    y = addKeyValue(doc, "Rationale:", "", y);
    y = checkPageBreak(doc, y);
    y = addMultiLineText(doc, assurance.rationale, y, 10);
  } else {
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, "Assurance Decision", y);
    y = addMultiLineText(doc, "No assurance decision available for this requirement.", y);
  }
  
  // Evidence
  if (requirement.evidence && requirement.evidence.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Supporting Evidence", y);
    
    const headers = ["Label", "Value", "Confidence", "Source", "Summary"];
    const rows = requirement.evidence.map((ev) => [
      ev.label,
      ev.value,
      ev.confidence.toUpperCase(),
      ev.source,
      ev.summary.substring(0, 60) + (ev.summary.length > 60 ? "..." : ""),
    ]);
    
    y = addTable(doc, headers, rows, y);
  }
  
  // Compliance Criteria
  if (requirement.compliance && requirement.compliance.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Compliance Criteria", y);
    
    const headers = ["Code", "Title", "Status", "Gaps"];
    const rows = requirement.compliance.map((c) => [
      c.code,
      c.title,
      c.status.toUpperCase(),
      c.gaps.length > 0 ? c.gaps.join("; ").substring(0, 80) + "..." : "None",
    ]);
    
    y = addTable(doc, headers, rows, y);
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    const lightText = PDF_CONFIG.colors.lightText;
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Page ${i} of ${pageCount}`, PDF_CONFIG.pageWidth - PDF_CONFIG.margin - 20, PDF_CONFIG.pageHeight - 10);
  }
  
  return doc.output("blob");
}

/**
 * Generate Test Scripts PDF
 */
export function generateTestScriptsPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = createBasePDF("Test Scripts", `Requirement: ${requirement.id} - ${requirement.title}`);
  
  let y = 45;
  
  // Requirement Info
  y = addSectionHeader(doc, "Requirement Information", y);
  y = addKeyValue(doc, "Requirement ID: ", requirement.id, y);
  y = addKeyValue(doc, "Title: ", requirement.title, y);
  y = addKeyValue(doc, "Version: ", requirement.version.toString(), y);
  y = addKeyValue(doc, "Assurance Level: ", requirement.assuranceDetail?.outcome.toUpperCase() ?? "N/A", y);
  y += 4;
  
  // Test Scripts
  if (requirement.tests && requirement.tests.length > 0) {
    requirement.tests.forEach((test, testIndex) => {
      y = checkPageBreak(doc, y, 60);
      y = addSectionHeader(doc, `Test Script ${testIndex + 1}: ${test.id}`, y);
      
      y = addKeyValue(doc, "Test ID: ", test.id, y);
      y = addKeyValue(doc, "Purpose: ", (test as any).purpose || "N/A", y);
      y = addKeyValue(doc, "Status: ", test.status.toUpperCase(), y);
      y += 2;
      
      y = addKeyValue(doc, "Preconditions:", "", y);
      y = checkPageBreak(doc, y);
      y = addMultiLineText(doc, test.preconditions, y, 10);
      y += 2;
      
      y = addKeyValue(doc, "Test Steps:", "", y);
      y = checkPageBreak(doc, y);
      
      const stepHeaders = ["Step", "Action", "Expected Result"];
      const stepRows = test.steps.map((step) => [
        step.stepNumber.toString(),
        step.action.substring(0, 50) + (step.action.length > 50 ? "..." : ""),
        step.expectedResult.substring(0, 50) + (step.expectedResult.length > 50 ? "..." : ""),
      ]);
      
      y = addTable(doc, stepHeaders, stepRows, y);
      y += 4;
    });
  } else {
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, "Test Scripts", y);
    
    const assurance = requirement.assuranceDetail?.outcome;
    if (assurance && assurance !== "scripted") {
      y = addMultiLineText(doc, `This requirement has an assurance level of "${assurance}" which does not require formal scripted test generation.`, y);
      const rationale = requirement.assuranceDetail?.rationale;
      if (rationale) {
        y += 4;
        y = addKeyValue(doc, "Assurance Rationale:", "", y);
        y = addMultiLineText(doc, rationale, y, 10);
      }
    } else {
      y = addMultiLineText(doc, "No test scripts available for this requirement.", y);
    }
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    const lightText = PDF_CONFIG.colors.lightText;
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Page ${i} of ${pageCount}`, PDF_CONFIG.pageWidth - PDF_CONFIG.margin - 20, PDF_CONFIG.pageHeight - 10);
  }
  
  return doc.output("blob");
}

/**
 * Generate Gap Report PDF
 */
export function generateGapReportPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = createBasePDF("Gap Report", `Requirement: ${requirement.id} - ${requirement.title}`);
  
  let y = 45;
  
  // Requirement Info
  y = addSectionHeader(doc, "Requirement Information", y);
  y = addKeyValue(doc, "Requirement ID: ", requirement.id, y);
  y = addKeyValue(doc, "Title: ", requirement.title, y);
  y = addKeyValue(doc, "Version: ", requirement.version.toString(), y);
  y = addKeyValue(doc, "Status: ", requirement.status.toUpperCase(), y);
  y += 4;
  
  // Gaps Summary
  y = checkPageBreak(doc, y);
  y = addSectionHeader(doc, "Gap Analysis Summary", y);
  
  const gaps: string[] = [];
  
  // Check for missing risk assessment
  if (!requirement.riskDetail) {
    gaps.push("Risk Assessment: No risk assessment recorded for this requirement.");
  } else if (requirement.riskDetail.freshness && requirement.riskDetail.freshness !== "current") {
    gaps.push(`Risk Assessment: Risk assessment is ${requirement.riskDetail.freshness} (requires re-assessment).`);
  }
  
  // Check for missing assurance
  if (!requirement.assuranceDetail) {
    gaps.push("Assurance Decision: No assurance decision recorded for this requirement.");
  } else if (requirement.assuranceDetail.freshness && requirement.assuranceDetail.freshness !== "current") {
    gaps.push(`Assurance Decision: Assurance decision is ${requirement.assuranceDetail.freshness} (requires review).`);
  }
  
  // Check for missing tests (for scripted requirements)
  if (requirement.assuranceDetail?.outcome === "scripted") {
    if (!requirement.tests || requirement.tests.length === 0) {
      gaps.push("Test Scripts: No test scripts generated for this scripted requirement.");
    } else {
      const unapprovedTests = requirement.tests.filter(t => t.status !== "approved");
      if (unapprovedTests.length > 0) {
        gaps.push(`Test Scripts: ${unapprovedTests.length} test script(s) not yet approved.`);
      }
    }
  }
  
  // Check for stale requirement
  if (requirement.status === "stale" || requirement.status === "warning") {
    gaps.push(`Requirement Status: Requirement is ${requirement.status} - re-assessment required.`);
  }
  
  // Check for low confidence evidence
  const lowConfidenceEvidence = requirement.evidence?.filter(e => e.confidence === "low") || [];
  if (lowConfidenceEvidence.length > 0) {
    gaps.push(`Evidence: ${lowConfidenceEvidence.length} evidence item(s) have low confidence and need review.`);
  }
  
  // Compliance gaps
  if (requirement.compliance) {
    const partialCompliance = requirement.compliance.filter(c => c.status === "partial");
    const absentCompliance = requirement.compliance.filter(c => c.status === "absent");
    if (partialCompliance.length > 0) {
      gaps.push(`Compliance: ${partialCompliance.length} criteria partially covered.`);
    }
    if (absentCompliance.length > 0) {
      gaps.push(`Compliance: ${absentCompliance.length} criteria absent (no coverage).`);
    }
  }
  
  if (gaps.length === 0) {
    y = addMultiLineText(doc, "No significant gaps identified. All assessments, decisions, and tests are current and complete.", y);
  } else {
    gaps.forEach((gap, index) => {
      y = checkPageBreak(doc, y, 15);
      y = addMultiLineText(doc, `${index + 1}. ${gap}`, y, 5);
      y += 2;
    });
  }
  
  // Detailed Compliance Gaps
  if (requirement.compliance && requirement.compliance.some(c => c.status !== "covered")) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Detailed Compliance Gaps", y);
    
    const headers = ["Code", "Title", "Status", "Gaps"];
    const rows = requirement.compliance
      .filter(c => c.status !== "covered")
      .map((c) => [
        c.code,
        c.title,
        c.status.toUpperCase(),
        c.gaps.join("; ").substring(0, 80) + (c.gaps.join("; ").length > 80 ? "..." : ""),
      ]);
    
    if (rows.length > 0) {
      y = addTable(doc, headers, rows, y);
    }
  }
  
  // Changes Impact
  if (requirement.changes && requirement.changes.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionHeader(doc, "Recent Changes Impact", y);
    
    const headers = ["Change ID", "From Version", "To Version", "Summary", "Status"];
    const rows = requirement.changes.map((c) => [
      c.id,
      `v${c.fromVersion}`,
      `v${c.toVersion}`,
      c.summary.substring(0, 60) + (c.summary.length > 60 ? "..." : ""),
      c.status.toUpperCase(),
    ]);
    
    y = addTable(doc, headers, rows, y);
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    const lightText = PDF_CONFIG.colors.lightText;
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Page ${i} of ${pageCount}`, PDF_CONFIG.pageWidth - PDF_CONFIG.margin - 20, PDF_CONFIG.pageHeight - 10);
  }
  
  return doc.output("blob");
}

/**
 * Capture traceability matrix as image
 */
export async function captureTraceMatrixAsImage(
  requirementId: string,
  traceMatrixElement: HTMLElement
): Promise<Blob | null> {
  try {
    const canvas = await html2canvas(traceMatrixElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    } as any);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("Failed to capture trace matrix as image:", error);
    return null;
  }
}

/**
 * Generate complete validation pack as ZIP
 */
export async function generateValidationPackZip(
  requirements: ValidationPackData[],
  traceMatrixElements: Map<string, HTMLElement>
): Promise<Blob> {
  const zip = new JSZip();
  
  for (const data of requirements) {
    const reqId = data.requirement.id.replace(/[^a-zA-Z0-9]/g, "_");
    const folder = zip.folder(reqId);
    
    if (!folder) continue;
    
    // Generate PDFs
    const riskPdf = generateRiskAssessmentPDF(data);
    const assurancePdf = generateAssuranceRationalePDF(data);
    const testPdf = generateTestScriptsPDF(data);
    const gapPdf = generateGapReportPDF(data);
    
    folder.file(`${reqId}_Risk_Assessment.pdf`, riskPdf);
    folder.file(`${reqId}_Assurance_Rationale.pdf`, assurancePdf);
    folder.file(`${reqId}_Test_Scripts.pdf`, testPdf);
    folder.file(`${reqId}_Gap_Report.pdf`, gapPdf);
    
    // Capture trace matrix as image
    if (data.traceMatrixRow) {
      const element = traceMatrixElements.get(data.traceMatrixRow.requirementId);
      if (element) {
        const imageBlob = await captureTraceMatrixAsImage(data.traceMatrixRow.requirementId, element);
        if (imageBlob) {
          folder.file(`${reqId}_Traceability_Matrix.png`, imageBlob);
        }
      }
    }
  }
  
  // Add a summary README
  const readmeContent = `RAVEN Validation Pack Export
Generated: ${new Date().toISOString()}
Requirements Included: ${requirements.map(r => r.requirement.id).join(", ")}

This validation pack contains the following documents for each requirement:
- Risk_Assessment.pdf: Risk assessment with severity, probability, detectability, RPN, and evidence
- Assurance_Rationale.pdf: Assurance decision with rationale, decision path, and compliance criteria
- Test_Scripts.pdf: Generated test scripts with preconditions, steps, and expected results
- Gap_Report.pdf: Gap analysis identifying missing or stale assessments, tests, and compliance items
- Traceability_Matrix.png: Visual traceability matrix for the requirement (requirement → risk → assurance → tests)

All documents are generated from the current RAVEN backend data.`;
  
  zip.file("README.txt", readmeContent);
  
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}