"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import type { RequirementDetail } from "@/lib/requirement-detail-data";
import type { TraceMatrixRow } from "@/lib/traceability-data";
import type { RiskAssessment, AssuranceDecision, Test, Evidence, RequirementVersion, ChangeEvent, ComplianceCriterion } from "@/lib/domain";

export interface ValidationPackData {
  requirement: RequirementDetail;
  traceMatrixRow?: TraceMatrixRow;
}

// Professional color palette
const COLORS = {
  primary: { r: 26, g: 26, b: 46 },       // Dark navy
  secondary: { r: 74, g: 74, b: 106 },    // Medium slate
  accent: { r: 0, g: 122, b: 204 },       // Professional blue
  success: { r: 16, g: 185, b: 129 },     // Emerald
  warning: { r: 245, g: 158, b: 11 },     // Amber
  danger: { r: 239, g: 68, b: 68 },       // Red
  text: { r: 31, g: 41, b: 55 },          // Slate 800
  textLight: { r: 100, g: 116, b: 139 },  // Slate 500
  textMuted: { r: 148, g: 163, b: 184 },  // Slate 400
  white: { r: 255, g: 255, b: 255 },
  lightBg: { r: 248, g: 250, b: 252 },    // Slate 50
  headerBg: { r: 241, g: 245, b: 249 },   // Slate 100
  border: { r: 226, g: 232, b: 240 },     // Slate 200
  bandHigh: { r: 254, g: 226, b: 226 },   // Red 100
  bandHighText: { r: 185, g: 28, b: 28 }, // Red 700
  bandMed: { r: 254, g: 243, b: 199 },    // Amber 100
  bandMedText: { r: 180, g: 83, b: 9 },   // Amber 700
  bandLow: { r: 220, g: 252, b: 231 },    // Emerald 100
  bandLowText: { r: 21, g: 128, b: 61 },  // Emerald 700
};

const PAGE = {
  width: 210,
  height: 297,
  margin: 20,
  contentWidth: 170,
  headerHeight: 35,
  footerHeight: 15,
};

type FontWeight = "normal" | "bold";

const FONTS: Record<string, { size: number; weight: FontWeight }> = {
  title: { size: 20, weight: "bold" },
  heading1: { size: 14, weight: "bold" },
  heading2: { size: 12, weight: "bold" },
  heading3: { size: 11, weight: "bold" },
  body: { size: 9.5, weight: "normal" },
  bodyBold: { size: 9.5, weight: "bold" },
  small: { size: 8, weight: "normal" },
  smallBold: { size: 8, weight: "bold" },
  tiny: { size: 7, weight: "normal" },
};

interface DocContext {
  doc: jsPDF;
  y: number;
}

function setFont(doc: jsPDF, style: { size: number; weight: FontWeight }, color = COLORS.text) {
  doc.setFontSize(style.size);
  doc.setFont("helvetica", style.weight);
  doc.setTextColor(color.r, color.g, color.b);
}

function setDrawColor(doc: jsPDF, color = COLORS.border) {
  doc.setDrawColor(color.r, color.g, color.b);
}

function setFillColor(doc: jsPDF, color: typeof COLORS.lightBg) {
  doc.setFillColor(color.r, color.g, color.b);
}

function addPageNumber(doc: jsPDF, pageNum: number, totalPages: number) {
  setFont(doc, FONTS.tiny, COLORS.textMuted);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE.width - PAGE.margin - 30, PAGE.height - 8);
  doc.text(`RAVEN Validation Pack | ${new Date().toLocaleDateString()}`, PAGE.margin, PAGE.height - 8);
}

function checkPageBreak(ctx: DocContext, needed: number = 25): DocContext {
  if (ctx.y > PAGE.height - PAGE.footerHeight - needed) {
    ctx.doc.addPage();
    ctx.y = PAGE.margin + 5;
  }
  return ctx;
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  // Header background
  setFillColor(doc, COLORS.headerBg);
  doc.rect(0, 0, PAGE.width, PAGE.headerHeight, "F");
  
  // Accent line
  doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
  doc.setLineWidth(3);
  doc.line(0, PAGE.headerHeight, PAGE.width, PAGE.headerHeight);
  
  // Title
  setFont(doc, FONTS.title, COLORS.primary);
  doc.text(title, PAGE.margin, 18);
  
  // Subtitle
  setFont(doc, FONTS.body, COLORS.secondary);
  doc.text(subtitle, PAGE.margin, 26);
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  setDrawColor(doc);
  doc.setLineWidth(0.5);
  doc.line(PAGE.margin, PAGE.height - PAGE.footerHeight, PAGE.width - PAGE.margin, PAGE.height - PAGE.footerHeight);
  addPageNumber(doc, pageNum, totalPages);
}

function sectionTitle(ctx: DocContext, title: string, icon?: string): DocContext {
  ctx = checkPageBreak(ctx, 20);
  
  setFont(ctx.doc, FONTS.heading1, COLORS.primary);
  const label = icon ? `${icon} ${title}` : title;
  ctx.doc.text(label, PAGE.margin, ctx.y);
  
  // Underline
  setDrawColor(ctx.doc, COLORS.accent);
  ctx.doc.setLineWidth(0.8);
  ctx.doc.line(PAGE.margin, ctx.y + 1.5, PAGE.margin + ctx.doc.getTextWidth(label) + 2, ctx.y + 1.5);
  
  ctx.y += 10;
  return ctx;
}

function kvRow(ctx: DocContext, key: string, value: string, indent: number = 0): DocContext {
  ctx = checkPageBreak(ctx, 8);
  const x = PAGE.margin + indent;
  
  setFont(ctx.doc, FONTS.bodyBold, COLORS.secondary);
  ctx.doc.text(key, x, ctx.y);
  
  const keyWidth = ctx.doc.getTextWidth(key) + 2;
  setFont(ctx.doc, FONTS.body, COLORS.text);
  ctx.doc.text(value, x + keyWidth, ctx.y);
  
  ctx.y += 6;
  return ctx;
}

function multiLine(ctx: DocContext, text: string, indent: number = 0, maxWidth?: number): DocContext {
  const x = PAGE.margin + indent;
  const width = maxWidth || PAGE.contentWidth - indent;
  
  setFont(ctx.doc, FONTS.body, COLORS.text);
  const lines = ctx.doc.splitTextToSize(text, width);
  
  ctx = checkPageBreak(ctx, lines.length * 5 + 4);
  ctx.doc.text(lines, x, ctx.y);
  ctx.y += lines.length * 5 + 3;
  return ctx;
}

function bulletList(ctx: DocContext, items: string[], indent: number = 10): DocContext {
  for (const item of items) {
    ctx = checkPageBreak(ctx, 8);
    const x = PAGE.margin + indent;
    
    setFont(ctx.doc, FONTS.body, COLORS.text);
    ctx.doc.text("•", x - 4, ctx.y);
    const lines = ctx.doc.splitTextToSize(item, PAGE.contentWidth - indent);
    ctx.doc.text(lines, x, ctx.y);
    ctx.y += lines.length * 5 + 2;
  }
  ctx.y += 2;
  return ctx;
}

function badge(ctx: DocContext, text: string, type: "high" | "medium" | "low" | "info" | "success" | "warning" | "default" = "default", x?: number): DocContext {
  ctx = checkPageBreak(ctx, 10);
  
  const configs = {
    high: { bg: COLORS.bandHigh, text: COLORS.bandHighText },
    medium: { bg: COLORS.bandMed, text: COLORS.bandMedText },
    low: { bg: COLORS.bandLow, text: COLORS.bandLowText },
    info: { bg: { r: 219, g: 234, b: 254 }, text: { r: 30, g: 64, b: 175 } }, // Blue
    success: { bg: { r: 220, g: 252, b: 231 }, text: { r: 21, g: 128, b: 61 } },
    warning: { bg: { r: 254, g: 243, b: 199 }, text: { r: 180, g: 83, b: 9 } },
    default: { bg: COLORS.headerBg, text: COLORS.secondary },
  };
  
  const cfg = configs[type];
  const paddingX = 6, paddingY = 2;
  const textWidth = ctx.doc.getTextWidth(text);
  const w = textWidth + paddingX * 2;
  const h = 7;
  const startX = x || PAGE.margin;
  
  setFillColor(ctx.doc, cfg.bg);
  ctx.doc.roundedRect(startX, ctx.y - 4, w, h, 1.5, 1.5, "F");
  
  setFont(ctx.doc, FONTS.smallBold, cfg.text);
  ctx.doc.text(text, startX + paddingX, ctx.y + 0.5);
  
  ctx.y += 4;
  return ctx;
}

function drawTable(
  ctx: DocContext,
  headers: string[],
  rows: string[][],
  colWidths?: number[]
): DocContext {
  if (rows.length === 0) return ctx;
  
  const numCols = headers.length;
  const widths = colWidths || Array(numCols).fill(PAGE.contentWidth / numCols);
  const rowHeight = 7;
  const headerHeight = 9;
  
  ctx = checkPageBreak(ctx, headerHeight + rows.length * rowHeight + 5);
  
  // Header row
  setFillColor(ctx.doc, COLORS.primary);
  ctx.doc.rect(PAGE.margin, ctx.y, PAGE.contentWidth, headerHeight, "F");
  
  setFont(ctx.doc, FONTS.bodyBold, COLORS.white);
  let colX = PAGE.margin;
  headers.forEach((header, i) => {
    ctx.doc.text(header, colX + 2, ctx.y + 5.5);
    colX += widths[i];
  });
  ctx.y += headerHeight;
  
  // Data rows
  setFont(ctx.doc, FONTS.body, COLORS.text);
  rows.forEach((row, rowIndex) => {
    ctx = checkPageBreak(ctx, rowHeight + 2);
    
    // Alternating row background
    if (rowIndex % 2 === 0) {
      setFillColor(ctx.doc, COLORS.lightBg);
      ctx.doc.rect(PAGE.margin, ctx.y, PAGE.contentWidth, rowHeight, "F");
    }
    
    setDrawColor(ctx.doc);
    ctx.doc.setLineWidth(0.3);
    ctx.doc.line(PAGE.margin, ctx.y, PAGE.width - PAGE.margin, ctx.y);
    
    colX = PAGE.margin;
    row.forEach((cell, i) => {
      // Truncate if too long
      const maxW = widths[i] - 4;
      let displayCell = cell;
      while (ctx.doc.getTextWidth(displayCell) > maxW && displayCell.length > 3) {
        displayCell = displayCell.slice(0, -1);
      }
      if (displayCell !== cell) displayCell += "…";
      
      ctx.doc.text(displayCell, colX + 2, ctx.y + 4.5);
      colX += widths[i];
    });
    
    ctx.y += rowHeight;
  });
  
  // Bottom border
  setDrawColor(ctx.doc);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(PAGE.margin, ctx.y, PAGE.width - PAGE.margin, ctx.y);
  ctx.y += 6;
  
  return ctx;
}

function drawRiskBandBadge(ctx: DocContext, band: string, rpn: number): DocContext {
  const type = band === "HIGH" ? "high" : band === "MEDIUM" ? "medium" : "low";
  return badge(ctx, `${band} (RPN ${rpn})`, type);
}

function drawAssuranceBadge(ctx: DocContext, outcome: string): DocContext {
  const types: Record<string, "info" | "success" | "warning" | "default"> = {
    scripted: "info",
    exploratory: "warning",
    "unscripted-supplier": "success",
    "unscripted-adhoc": "default",
    unscripted: "default",
  };
  return badge(ctx, outcome.toUpperCase(), types[outcome] || "default");
}

function drawStatusBadge(ctx: DocContext, status: string): DocContext {
  const types: Record<string, "high" | "medium" | "low" | "info" | "success" | "warning" | "default"> = {
    current: "success",
    "needs-review": "warning",
    stale: "high",
    warning: "warning",
    processing: "info",
    superseded: "default",
    approved: "success",
  };
  return badge(ctx, status.toUpperCase().replace("-", " "), types[status] || "default");
}

/**
 * Generate Risk Assessment PDF
 */
export function generateRiskAssessmentPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalPages = 1; // Will update at end
  
  let ctx: DocContext = { doc, y: PAGE.headerHeight + 15 };
  drawHeader(doc, "Risk Assessment", `Requirement: ${requirement.id} — ${requirement.title}`);
  
  // Requirement Info Card
  ctx = sectionTitle(ctx, "Requirement Information", "📋");
  
  const infoItems = [
    ["Requirement ID:", requirement.id],
    ["Title:", requirement.title],
    ["Version:", `v${requirement.version}`],
    ["GAMP Category:", requirement.gampCategory],
    ["GxP Impact:", requirement.gxpImpact ? "Yes" : "No"],
    ["Status:", requirement.status.toUpperCase()],
  ];
  
  // Two-column layout
  for (let i = 0; i < infoItems.length; i += 2) {
    ctx = checkPageBreak(ctx, 8);
    const col1X = PAGE.margin;
    const col2X = PAGE.margin + PAGE.contentWidth / 2 + 5;
    
    setFont(doc, FONTS.bodyBold, COLORS.secondary);
    doc.text(infoItems[i][0], col1X, ctx.y);
    setFont(doc, FONTS.body, COLORS.text);
    doc.text(infoItems[i][1], col1X + doc.getTextWidth(infoItems[i][0]) + 2, ctx.y);
    
    if (i + 1 < infoItems.length) {
      setFont(doc, FONTS.bodyBold, COLORS.secondary);
      doc.text(infoItems[i + 1][0], col2X, ctx.y);
      setFont(doc, FONTS.body, COLORS.text);
      doc.text(infoItems[i + 1][1], col2X + doc.getTextWidth(infoItems[i + 1][0]) + 2, ctx.y);
    }
    ctx.y += 6;
  }
  ctx.y += 4;
  
  // Risk Assessment
  if (requirement.riskDetail) {
    ctx = sectionTitle(ctx, "Risk Assessment", "⚠️");
    
    const risk = requirement.riskDetail;
    ctx = drawRiskBandBadge(ctx, risk.band, risk.rpn);
    ctx.y += 4;
    
    // Risk factors table
    const factorHeaders = ["Factor", "Score", "Weight", "Contribution"];
    const factorRows = [
      ["Severity", risk.severity.toString(), "1–5", (risk.severity * risk.probability * risk.detectability / risk.rpn * 100).toFixed(0) + "%"],
      ["Probability", risk.probability.toString(), "1–5", ""],
      ["Detectability", risk.detectability.toString(), "1–5", ""],
      ["RPN", risk.rpn.toString(), "1–125", ""],
    ];
    ctx = drawTable(ctx, factorHeaders, factorRows, [50, 30, 30, 50]);
    
    // Rule info
    ctx = kvRow(ctx, "Rule ID: ", risk.ruleId);
    ctx = kvRow(ctx, "Assessment Date: ", new Date(risk.createdAt).toLocaleDateString());
    ctx.y += 2;
    
    // Decision Path
    ctx = sectionTitle(ctx, "Decision Path", "🔍");
    ctx = bulletList(ctx, risk.decisionPath);
    
    // Reasoning
    ctx = sectionTitle(ctx, "Reasoning", "📝");
    ctx = multiLine(ctx, risk.reasoning);
  } else {
    ctx = sectionTitle(ctx, "Risk Assessment", "⚠️");
    ctx = multiLine(ctx, "No risk assessment available for this requirement.");
  }
  
  // Evidence
  if (requirement.evidence && requirement.evidence.length > 0) {
    ctx = sectionTitle(ctx, "Supporting Evidence", "📎");
    
    const headers = ["#", "Label", "Value", "Confidence", "Source"];
    const rows = requirement.evidence.map((ev, i) => [
      (i + 1).toString(),
      ev.label,
      ev.value,
      ev.confidence.charAt(0).toUpperCase() + ev.confidence.slice(1),
      ev.source,
    ]);
    ctx = drawTable(ctx, headers, rows, [12, 35, 35, 25, 53]);
  }
  
  // Version History
  if (requirement.versions && requirement.versions.length > 0) {
    ctx = sectionTitle(ctx, "Version History", "📜");
    
    const headers = ["Version", "Title", "Status", "Created", "Superseded"];
    const rows = requirement.versions.map((v) => [
      `v${v.version}`,
      v.title,
      v.status.toUpperCase(),
      new Date(v.createdAt).toLocaleDateString(),
      v.supersededAt ? new Date(v.supersededAt).toLocaleDateString() : "Current",
    ]);
    ctx = drawTable(ctx, headers, rows, [22, 45, 25, 35, 33]);
  }
  
  // Add page numbers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount);
    if (i === 1) drawHeader(doc, "Risk Assessment", `Requirement: ${requirement.id} — ${requirement.title}`);
  }
  
  return doc.output("blob");
}

/**
 * Generate Assurance Rationale PDF
 */
export function generateAssuranceRationalePDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  let ctx: DocContext = { doc, y: PAGE.headerHeight + 15 };
  drawHeader(doc, "Assurance Rationale", `Requirement: ${requirement.id} — ${requirement.title}`);
  
  // Requirement Summary
  ctx = sectionTitle(ctx, "Requirement Summary", "📋");
  
  const summaryItems = [
    ["Requirement ID:", requirement.id],
    ["Title:", requirement.title],
    ["Version:", `v${requirement.version}`],
    ["Risk Band:", requirement.riskDetail?.band ?? "N/A"],
    ["RPN:", requirement.riskDetail?.rpn.toString() ?? "N/A"],
  ];
  
  for (let i = 0; i < summaryItems.length; i += 2) {
    ctx = checkPageBreak(ctx, 8);
    const col1X = PAGE.margin;
    const col2X = PAGE.margin + PAGE.contentWidth / 2 + 5;
    
    setFont(doc, FONTS.bodyBold, COLORS.secondary);
    doc.text(summaryItems[i][0], col1X, ctx.y);
    setFont(doc, FONTS.body, COLORS.text);
    doc.text(summaryItems[i][1], col1X + doc.getTextWidth(summaryItems[i][0]) + 2, ctx.y);
    
    if (i + 1 < summaryItems.length) {
      setFont(doc, FONTS.bodyBold, COLORS.secondary);
      doc.text(summaryItems[i + 1][0], col2X, ctx.y);
      setFont(doc, FONTS.body, COLORS.text);
      doc.text(summaryItems[i + 1][1], col2X + doc.getTextWidth(summaryItems[i + 1][0]) + 2, ctx.y);
    }
    ctx.y += 6;
  }
  ctx.y += 4;
  
  // Assurance Decision
  if (requirement.assuranceDetail) {
    ctx = sectionTitle(ctx, "Assurance Decision", "✅");
    
    const assurance = requirement.assuranceDetail;
    ctx = drawAssuranceBadge(ctx, assurance.outcome);
    ctx.y += 2;
    
    ctx = kvRow(ctx, "Decision ID: ", assurance.id);
    ctx = kvRow(ctx, "Rule ID: ", assurance.ruleId);
    ctx = kvRow(ctx, "Generate Test Script: ", assurance.generateTest ? "Yes" : "No");
    ctx = kvRow(ctx, "Decision Date: ", new Date(assurance.createdAt).toLocaleDateString());
    if (assurance.freshness) {
      ctx = kvRow(ctx, "Freshness: ", assurance.freshness);
    }
    ctx.y += 2;
    
    // Decision Path
    ctx = sectionTitle(ctx, "Decision Path", "🔍");
    ctx = bulletList(ctx, assurance.decisionPath);
    
    // Rationale
    ctx = sectionTitle(ctx, "Rationale", "📝");
    ctx = multiLine(ctx, assurance.rationale);
  } else {
    ctx = sectionTitle(ctx, "Assurance Decision", "✅");
    ctx = multiLine(ctx, "No assurance decision available for this requirement.");
  }
  
  // Evidence
  if (requirement.evidence && requirement.evidence.length > 0) {
    ctx = sectionTitle(ctx, "Supporting Evidence", "📎");
    
    const headers = ["#", "Label", "Value", "Confidence", "Source"];
    const rows = requirement.evidence.map((ev, i) => [
      (i + 1).toString(),
      ev.label,
      ev.value,
      ev.confidence.charAt(0).toUpperCase() + ev.confidence.slice(1),
      ev.source,
    ]);
    ctx = drawTable(ctx, headers, rows, [12, 35, 35, 25, 53]);
  }
  
  // Compliance Criteria
  if (requirement.compliance && requirement.compliance.length > 0) {
    ctx = sectionTitle(ctx, "Compliance Criteria", "📜");
    
    const headers = ["Code", "Title", "Status", "Gaps"];
    const rows = requirement.compliance.map((c) => [
      c.code,
      c.title,
      c.status.charAt(0).toUpperCase() + c.status.slice(1),
      c.gaps.length > 0 ? c.gaps.join("; ") : "None",
    ]);
    ctx = drawTable(ctx, headers, rows, [25, 50, 25, 60]);
  }
  
  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount);
    if (i === 1) drawHeader(doc, "Assurance Rationale", `Requirement: ${requirement.id} — ${requirement.title}`);
  }
  
  return doc.output("blob");
}

/**
 * Generate Test Scripts PDF
 */
export function generateTestScriptsPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  let ctx: DocContext = { doc, y: PAGE.headerHeight + 15 };
  drawHeader(doc, "Test Scripts", `Requirement: ${requirement.id} — ${requirement.title}`);
  
  // Requirement Info
  ctx = sectionTitle(ctx, "Requirement Information", "📋");
  ctx = kvRow(ctx, "Requirement ID: ", requirement.id);
  ctx = kvRow(ctx, "Title: ", requirement.title);
  ctx = kvRow(ctx, "Version: ", `v${requirement.version}`);
  ctx = kvRow(ctx, "Assurance Level: ", requirement.assuranceDetail?.outcome.toUpperCase() ?? "N/A");
  ctx.y += 2;
  
  // Test Scripts
  if (requirement.tests && requirement.tests.length > 0) {
    requirement.tests.forEach((test, testIndex) => {
      ctx = sectionTitle(ctx, `Test Script ${testIndex + 1}: ${test.id}`, "🧪");
      
      ctx = kvRow(ctx, "Test ID: ", test.id);
      ctx = kvRow(ctx, "Status: ", test.status.toUpperCase());
      ctx = kvRow(ctx, "Purpose: ", (test as any).purpose || "Not specified");
      ctx.y += 2;
      
      // Preconditions
      ctx = checkPageBreak(ctx, 15);
      setFont(doc, FONTS.heading3, COLORS.primary);
      doc.text("Preconditions:", PAGE.margin, ctx.y);
      ctx.y += 6;
      ctx = multiLine(ctx, test.preconditions, 5);
      ctx.y += 2;
      
      // Test Steps Table
      ctx = checkPageBreak(ctx, 15);
      setFont(doc, FONTS.heading3, COLORS.primary);
      doc.text("Test Steps:", PAGE.margin, ctx.y);
      ctx.y += 6;
      
      const stepHeaders = ["Step", "Action", "Expected Result"];
      const stepRows = test.steps.map((step) => [
        step.stepNumber.toString(),
        step.action,
        step.expectedResult,
      ]);
      ctx = drawTable(ctx, stepHeaders, stepRows, [15, 75, 70]);
      ctx.y += 4;
    });
  } else {
    ctx = sectionTitle(ctx, "Test Scripts", "🧪");
    const assurance = requirement.assuranceDetail?.outcome;
    if (assurance && assurance !== "scripted") {
      ctx = multiLine(ctx, `This requirement has an assurance level of "${assurance}" which does not require formal scripted test generation.`);
      const rationale = requirement.assuranceDetail?.rationale;
      if (rationale) {
        ctx.y += 2;
        ctx = kvRow(ctx, "Assurance Rationale:", "");
        ctx = multiLine(ctx, rationale, 5);
      }
    } else {
      ctx = multiLine(ctx, "No test scripts available for this requirement.");
    }
  }
  
  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount);
    if (i === 1) drawHeader(doc, "Test Scripts", `Requirement: ${requirement.id} — ${requirement.title}`);
  }
  
  return doc.output("blob");
}

/**
 * Generate Gap Report PDF
 */
export function generateGapReportPDF(data: ValidationPackData): Blob {
  const { requirement } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  let ctx: DocContext = { doc, y: PAGE.headerHeight + 15 };
  drawHeader(doc, "Gap Report", `Requirement: ${requirement.id} — ${requirement.title}`);
  
  // Requirement Info
  ctx = sectionTitle(ctx, "Requirement Information", "📋");
  
  const infoItems = [
    ["Requirement ID:", requirement.id],
    ["Title:", requirement.title],
    ["Version:", `v${requirement.version}`],
    ["Status:", requirement.status.toUpperCase()],
  ];
  
  for (let i = 0; i < infoItems.length; i += 2) {
    ctx = checkPageBreak(ctx, 8);
    const col1X = PAGE.margin;
    const col2X = PAGE.margin + PAGE.contentWidth / 2 + 5;
    
    setFont(doc, FONTS.bodyBold, COLORS.secondary);
    doc.text(infoItems[i][0], col1X, ctx.y);
    setFont(doc, FONTS.body, COLORS.text);
    doc.text(infoItems[i][1], col1X + doc.getTextWidth(infoItems[i][0]) + 2, ctx.y);
    
    if (i + 1 < infoItems.length) {
      setFont(doc, FONTS.bodyBold, COLORS.secondary);
      doc.text(infoItems[i + 1][0], col2X, ctx.y);
      setFont(doc, FONTS.body, COLORS.text);
      doc.text(infoItems[i + 1][1], col2X + doc.getTextWidth(infoItems[i + 1][0]) + 2, ctx.y);
    }
    ctx.y += 6;
  }
  ctx.y += 4;
  
  // Gap Analysis
  ctx = sectionTitle(ctx, "Gap Analysis Summary", "🔍");
  
  const gaps: { text: string; severity: "high" | "medium" | "low" }[] = [];
  
  // Risk assessment gaps
  if (!requirement.riskDetail) {
    gaps.push({ text: "Risk Assessment: No risk assessment recorded for this requirement.", severity: "high" });
  } else if (requirement.riskDetail.freshness && requirement.riskDetail.freshness !== "current") {
    gaps.push({ text: `Risk Assessment: Risk assessment is ${requirement.riskDetail.freshness} (requires re-assessment).`, severity: "medium" });
  }
  
  // Assurance gaps
  if (!requirement.assuranceDetail) {
    gaps.push({ text: "Assurance Decision: No assurance decision recorded for this requirement.", severity: "high" });
  } else if (requirement.assuranceDetail.freshness && requirement.assuranceDetail.freshness !== "current") {
    gaps.push({ text: `Assurance Decision: Assurance decision is ${requirement.assuranceDetail.freshness} (requires review).`, severity: "medium" });
  }
  
  // Test script gaps
  if (requirement.assuranceDetail?.outcome === "scripted") {
    if (!requirement.tests || requirement.tests.length === 0) {
      gaps.push({ text: "Test Scripts: No test scripts generated for this scripted requirement.", severity: "high" });
    } else {
      const unapprovedTests = requirement.tests.filter(t => t.status !== "approved");
      if (unapprovedTests.length > 0) {
        gaps.push({ text: `Test Scripts: ${unapprovedTests.length} test script(s) not yet approved.`, severity: "medium" });
      }
    }
  }
  
  // Requirement status gaps
  if (requirement.status === "stale" || requirement.status === "warning") {
    gaps.push({ text: `Requirement Status: Requirement is ${requirement.status} — re-assessment required.`, severity: "medium" });
  }
  
  // Evidence confidence gaps
  const lowConfidenceEvidence = requirement.evidence?.filter(e => e.confidence === "low") || [];
  if (lowConfidenceEvidence.length > 0) {
    gaps.push({ text: `Evidence: ${lowConfidenceEvidence.length} evidence item(s) have low confidence and need review.`, severity: "low" });
  }
  
  // Compliance gaps
  if (requirement.compliance) {
    const partialCompliance = requirement.compliance.filter(c => c.status === "partial");
    const absentCompliance = requirement.compliance.filter(c => c.status === "absent");
    if (partialCompliance.length > 0) {
      gaps.push({ text: `Compliance: ${partialCompliance.length} criteria partially covered.`, severity: "medium" });
    }
    if (absentCompliance.length > 0) {
      gaps.push({ text: `Compliance: ${absentCompliance.length} criteria absent (no coverage).`, severity: "high" });
    }
  }
  
  if (gaps.length === 0) {
    // Success state
    setFillColor(doc, COLORS.bandLow);
    doc.roundedRect(PAGE.margin, ctx.y - 3, PAGE.contentWidth, 12, 2, 2, "F");
    setFont(doc, FONTS.bodyBold, COLORS.bandLowText);
    doc.text("✓ No significant gaps identified. All assessments, decisions, and tests are current and complete.", PAGE.margin + 4, ctx.y + 4);
    ctx.y += 16;
  } else {
    // Group by severity
    const severityOrder = ["high", "medium", "low"];
    severityOrder.forEach(sev => {
      const sevGaps = gaps.filter(g => g.severity === sev);
      if (sevGaps.length === 0) return;
      
      ctx = checkPageBreak(ctx, 10);
      setFont(doc, FONTS.heading3, sev === "high" ? COLORS.danger : sev === "medium" ? COLORS.warning : COLORS.success);
      doc.text(`${sev.charAt(0).toUpperCase() + sev.slice(1)} Priority Gaps (${sevGaps.length})`, PAGE.margin, ctx.y);
      ctx.y += 6;
      
      sevGaps.forEach((gap, idx) => {
        ctx = checkPageBreak(ctx, 10);
        const x = PAGE.margin + 5;
        setFont(doc, FONTS.body, COLORS.text);
        doc.text("•", x - 4, ctx.y);
        const lines = doc.splitTextToSize(gap.text, PAGE.contentWidth - 10);
        doc.text(lines, x, ctx.y);
        ctx.y += lines.length * 5 + 2;
      });
      ctx.y += 2;
    });
  }
  
  // Detailed Compliance Gaps
  if (requirement.compliance && requirement.compliance.some(c => c.status !== "covered")) {
    ctx = sectionTitle(ctx, "Detailed Compliance Gaps", "📜");
    
    const headers = ["Code", "Title", "Status", "Gaps"];
    const rows = requirement.compliance
      .filter(c => c.status !== "covered")
      .map((c) => [
        c.code,
        c.title,
        c.status.charAt(0).toUpperCase() + c.status.slice(1),
        c.gaps.join("; ") || "None",
      ]);
    
    if (rows.length > 0) {
      ctx = drawTable(ctx, headers, rows, [25, 50, 25, 60]);
    }
  }
  
  // Changes Impact
  if (requirement.changes && requirement.changes.length > 0) {
    ctx = sectionTitle(ctx, "Recent Changes Impact", "🔄");
    
    const headers = ["Change ID", "From → To", "Summary", "Status"];
    const rows = requirement.changes.map((c) => [
      c.id,
      `v${c.fromVersion} → v${c.toVersion}`,
      c.summary,
      c.status.replace("-", " ").toUpperCase(),
    ]);
    
    ctx = drawTable(ctx, headers, rows, [30, 30, 70, 30]);
  }
  
  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount);
    if (i === 1) drawHeader(doc, "Gap Report", `Requirement: ${requirement.id} — ${requirement.title}`);
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