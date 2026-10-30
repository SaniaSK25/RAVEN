import { jsPDF } from "jspdf";

export interface PdfTableColumn {
  header: string;
  key: string;
  width: number;
  align?: "left" | "right" | "center";
}

export interface TocEntry {
  title: string;
  page: number;
  tocPage: number;
  y: number;
  pageX: number;
  pageColumnWidth: number;
}

export interface PdfBuilderOptions {
  packReference: string;
  generatedAt: string;
  title?: string;
}

const MARGIN = 15;
const HEADER_HEIGHT = 15;
const FOOTER_HEIGHT = 12;
const BODY_FONT = 10.5;
const BODY_LINE = 5.1;
const ORANGE: [number, number, number] = [241, 108, 48];
const PEACH: [number, number, number] = [255, 236, 229];
const BORDER: [number, number, number] = [205, 205, 205];
const TEXT: [number, number, number] = [17, 17, 17];
const WHITE: [number, number, number] = [255, 255, 255];
const MUTED: [number, number, number] = [82, 82, 82];
const ROW_ALT: [number, number, number] = PEACH;
const CARD_HORIZONTAL_PADDING = 2.5;
const CARD_VERTICAL_PADDING = 5;
const CHAPTERS: Record<string, number> = {
  "Executive Summary": 1,
  "Risk Assessment": 2,
  "Assurance Rationale": 3,
  "Test Scripts": 4,
  "Traceability Matrix": 5,
  "Gap Report": 6,
  "Appendices": 7,
  "Evidence Index": 7,
  "Limitations and Methodology": 8,
};
type CalloutTone = "info" | "success" | "warning" | "critical";
const CALLOUT_COLORS: Record<
  CalloutTone,
  { fill: [number, number, number]; border: [number, number, number] }
> = {
  info: { fill: PEACH, border: ORANGE },
  success: { fill: PEACH, border: ORANGE },
  warning: { fill: PEACH, border: ORANGE },
  critical: { fill: PEACH, border: [194, 66, 21] },
};

interface CardSegment {
  page: number;
  top: number;
  bottom: number;
  x: number;
  width: number;
}

interface ActiveCard {
  page: number;
  top: number;
  x: number;
  width: number;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pageFormat(): "a4" {
  return "a4";
}

/**
 * Small layout layer over jsPDF.
 *
 * It owns page geometry, headers/footers, wrapped paragraphs, labels, bullets,
 * repeated table headers, mixed portrait/landscape pages, and a TOC that is
 * filled with real page numbers after all sections have been rendered.
 */
export class PdfBuilder {
  readonly doc: jsPDF;
  readonly packReference: string;
  readonly generatedAt: string;
  readonly title: string;
  readonly margin = MARGIN;

  y = 0;
  landscape = false;
  sectionTitle = "";
  private sectionPages = new Map<string, number>();
  private sectionNumber = 0;
  private subsectionNumber = 0;
  private cardSegments: CardSegment[] = [];
  private activeCard: ActiveCard | null = null;
  private finalized = false;
  private hasCover = false;

  constructor(options: PdfBuilderOptions) {
    this.doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });
    this.packReference = options.packReference;
    this.generatedAt = options.generatedAt;
    this.title = options.title || "RAVEN — Validation Pack";
    this.doc.setProperties({
      title: this.title,
      subject: "Selected-requirement validation pack",
      creator: "RAVEN",
      author: "RAVEN",
    });
    this.drawPageHeader();
    this.y = HEADER_HEIGHT + 10;
  }

  get pageWidth(): number {
    return this.doc.internal.pageSize.getWidth();
  }

  get pageHeight(): number {
    return this.doc.internal.pageSize.getHeight();
  }

  get contentWidth(): number {
    return this.pageWidth - this.margin * 2;
  }

  get currentPage(): number {
    return this.doc.getNumberOfPages();
  }

  private bottomLimit(): number {
    return this.pageHeight - FOOTER_HEIGHT;
  }

  private drawPageHeader(): void {
    const width = this.pageWidth;
    this.doc.setDrawColor(...BORDER);
    this.doc.setLineWidth(0.35);
    this.doc.line(this.margin, HEADER_HEIGHT, width - this.margin, HEADER_HEIGHT);
    this.doc.setTextColor(...ORANGE);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9.5);
    this.doc.text("RAVEN", this.margin, 10.5);
    this.doc.text("Validation Pack", width / 2, 10.5, { align: "center" });
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text("LIMS", width - this.margin, 10.5, { align: "right" });
    this.doc.setTextColor(...TEXT);
  }

  newPage(section = this.sectionTitle, landscape = this.landscape): void {
    if (this.activeCard && this.activeCard.page === this.currentPage) {
      this.cardSegments.push({
        page: this.currentPage,
        top: this.activeCard.top,
        bottom: Math.min(
          this.pageHeight - FOOTER_HEIGHT - 3,
          this.y + CARD_VERTICAL_PADDING,
        ),
        x: this.activeCard.x,
        width: this.activeCard.width,
      });
    }
    this.doc.addPage(pageFormat(), landscape ? "landscape" : "portrait");
    this.landscape = landscape;
    this.sectionTitle = section;
    this.drawPageHeader();
    this.y = HEADER_HEIGHT + 10;
    if (this.activeCard) {
      this.activeCard = {
        page: this.currentPage,
        top: this.y - CARD_VERTICAL_PADDING,
        x: this.margin - CARD_HORIZONTAL_PADDING,
        width: this.contentWidth + CARD_HORIZONTAL_PADDING * 2,
      };
    }
  }

  ensureSpace(height: number): void {
    if (this.y + height > this.bottomLimit()) {
      this.newPage(this.sectionTitle, this.landscape);
    }
  }

  startSection(
    title: string,
    options: { newPage?: boolean; landscape?: boolean; recordPage?: boolean } = {},
  ): void {
    const newPage = options.newPage ?? true;
    const landscape = options.landscape ?? this.landscape;
    if (newPage) {
      this.sectionTitle = title;
      this.landscape = landscape;
      this.newPage(title, landscape);
    } else if (landscape !== this.landscape) {
      this.landscape = landscape;
      this.newPage(title, landscape);
    } else {
      this.sectionTitle = title;
    }
    this.sectionNumber = CHAPTERS[title] || 0;
    this.subsectionNumber = 0;
    if (options.recordPage !== false) {
      this.sectionPages.set(title, this.currentPage);
    }
    this.sectionHeading(title);
  }

  sectionHeading(title: string): void {
    this.ensureSpace(26);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(17);
    const lines = this.doc.splitTextToSize(title, this.contentWidth);
    this.doc.setTextColor(...ORANGE);
    const number = CHAPTERS[title];
    let headingX = this.margin;
    if (number) {
      const badgeSize = 10.5;
      this.doc.setFillColor(...ORANGE);
      this.doc.roundedRect(
        this.margin,
        this.y - 7,
        badgeSize,
        badgeSize,
        0.8,
        0.8,
        "F",
      );
      this.doc.setFontSize(10.5);
      this.doc.setTextColor(...WHITE);
      this.doc.text(String(number), this.margin + badgeSize / 2, this.y, {
        align: "center",
      });
      this.doc.setFontSize(17);
      this.doc.setTextColor(...ORANGE);
      headingX += badgeSize + 3;
    }
    for (const line of lines) {
      this.doc.text(line, headingX, this.y);
      this.y += 7;
    }
    this.y += 4;
  }

  subheading(title: string, options: { color?: [number, number, number] } = {}): void {
    this.ensureSpace(30);
    this.y += 2;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...(options.color || ORANGE));
    const numberedTitle = this.sectionNumber
      ? `${this.sectionNumber}.${++this.subsectionNumber}  ${title}`
      : title;
    const lines = this.doc.splitTextToSize(numberedTitle, this.contentWidth);
    for (const line of lines) {
      if (this.y + 6 > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
      this.doc.text(line, this.margin, this.y);
      this.y += 6;
    }
    this.doc.setDrawColor(...PEACH);
    this.doc.setLineWidth(0.55);
    this.doc.line(this.margin, this.y - 2, this.pageWidth - this.margin, this.y - 2);
    this.doc.setLineWidth(0.2);
    this.y += 3;
    this.doc.setTextColor(...TEXT);
  }

  paragraph(
    value: unknown,
    options: {
      fontSize?: number;
      lineHeight?: number;
      color?: [number, number, number];
      x?: number;
      width?: number;
      gapAfter?: number;
    } = {},
  ): void {
    const raw = asText(value);
    if (!raw.trim()) return;
    const fontSize = Math.max(options.fontSize ?? BODY_FONT, 9.5);
    const lineHeight = options.lineHeight ?? BODY_LINE;
    const x = options.x ?? this.margin;
    const width = options.width ?? this.contentWidth;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...(options.color || TEXT));

    const paragraphs = raw.replace(/\r\n/g, "\n").split("\n");
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        this.y += lineHeight * 0.55;
        continue;
      }
      const lines = this.doc.splitTextToSize(paragraph, width);
      for (const line of lines) {
        if (this.y + lineHeight > this.bottomLimit()) {
          this.newPage(this.sectionTitle, this.landscape);
          this.doc.setFont("helvetica", "normal");
          this.doc.setFontSize(fontSize);
          this.doc.setTextColor(...(options.color || TEXT));
        }
        this.doc.text(line, x, this.y);
        this.y += lineHeight;
      }
    }
    this.doc.setTextColor(...TEXT);
    this.y += options.gapAfter ?? 2.5;
  }

  labelParagraph(
    label: string,
    body: unknown,
    options: { meta?: string; gapAfter?: number } = {},
  ): void {
    const rawBody = asText(body);
    const labelFontSize = 10;
    const metaFontSize = 9;
    const labelLineHeight = 4.8;
    const metaLineHeight = 4.3;
    const bodyLineHeight = 5;

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(labelFontSize);
    const labelLines = this.doc.splitTextToSize(label, this.contentWidth) as string[];
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(metaFontSize);
    const metaLines = options.meta
      ? (this.doc.splitTextToSize(options.meta, this.contentWidth) as string[])
      : [];
    this.doc.setFontSize(BODY_FONT);
    const bodyLines = rawBody
      .replace(/\r\n/g, "\n")
      .split("\n")
      .reduce<string[]>((lines, line) => {
        if (!line.trim()) {
          lines.push("");
          return lines;
        }
        return lines.concat(this.doc.splitTextToSize(line, this.contentWidth) as string[]);
      }, []);
    const gapAfter = options.gapAfter ?? 3;
    const blockHeight =
      labelLines.length * labelLineHeight +
      (metaLines.length ? 1 + metaLines.length * metaLineHeight : 0) +
      1.5 +
      bodyLines.length * bodyLineHeight +
      gapAfter;
    const fullPageHeight = this.bottomLimit() - (HEADER_HEIGHT + 10);
    this.ensureSpace(blockHeight <= fullPageHeight ? blockHeight : 24);

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(labelFontSize);
    this.doc.setTextColor(...ORANGE);
    for (const line of labelLines) {
      if (this.y + labelLineHeight > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
      this.doc.text(line, this.margin, this.y);
      this.y += labelLineHeight;
    }
    if (metaLines.length) {
      this.y += 1;
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(metaFontSize);
      this.doc.setTextColor(...MUTED);
      for (const line of metaLines) {
        if (this.y + metaLineHeight > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
        this.doc.text(line, this.margin, this.y);
        this.y += metaLineHeight;
      }
    }
    this.doc.setTextColor(...TEXT);
    this.y += 1.5;
    this.paragraph(rawBody, {
      fontSize: BODY_FONT,
      lineHeight: bodyLineHeight,
      gapAfter,
    });
  }

  metaRow(
    label: string,
    value: unknown,
    options: { valueColor?: [number, number, number] } = {},
  ): void {
    const labelWidth = 48;
    const valueWidth = this.contentWidth - labelWidth;
    const valueText = asText(value) || "Not recorded";
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    const lines = this.doc.splitTextToSize(valueText, valueWidth);
    const rowLineHeight = 4.7;
    const height = Math.max(6.2, lines.length * rowLineHeight + 1.8);
    this.ensureSpace(height);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text(label, this.margin, this.y);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...(options.valueColor || TEXT));
    for (let index = 0; index < lines.length; index += 1) {
      this.doc.text(lines[index], this.margin + labelWidth, this.y + index * rowLineHeight);
    }
    this.y += height;
  }

  metadataGroup(
    title: string,
    rows: Array<[string, unknown]>,
    options: { valueColors?: Record<string, [number, number, number] | undefined> } = {},
  ): void {
    this.subheading(title);
    for (const [label, value] of rows) {
      this.metaRow(label, value, { valueColor: options.valueColors?.[label] });
    }
    this.y += 2;
  }

  bullets(items: string[], options: { fontSize?: number } = {}): void {
    const fontSize = Math.max(options.fontSize ?? BODY_FONT, 9.5);
    const lineHeight = fontSize * 0.5;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...TEXT);
    for (const item of items) {
      const lines = this.doc.splitTextToSize(asText(item), this.contentWidth - 5);
      this.ensureSpace(Math.max(5, lines.length * lineHeight));
      this.doc.text("-", this.margin, this.y);
      for (const line of lines) {
        if (this.y + lineHeight > this.bottomLimit()) {
          this.newPage(this.sectionTitle, this.landscape);
          this.doc.setFont("helvetica", "normal");
          this.doc.setFontSize(fontSize);
          this.doc.setTextColor(...TEXT);
        }
        this.doc.text(line, this.margin + 5, this.y);
        this.y += lineHeight;
      }
      this.y += 2.2;
    }
    this.y += 1;
  }

  divider(): void {
    this.ensureSpace(5);
    this.doc.setDrawColor(...BORDER);
    this.doc.setLineWidth(0.35);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.doc.setLineWidth(0.2);
    this.y += 7;
  }

  callout(value: unknown, tone: CalloutTone = "info"): void {
    const raw = asText(value);
    if (!raw.trim()) return;
    const inset = 4;
    const verticalPadding = 3;
    const fontSize = BODY_FONT;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(raw, this.contentWidth - inset * 2);
    const textHeight = (fontSize * 25.4) / 72;
    const boxTop = this.y - textHeight - verticalPadding;
    const height =
      textHeight + (lines.length - 1) * BODY_LINE + verticalPadding * 2;
    this.ensureSpace((lines.length - 1) * BODY_LINE + verticalPadding + 2);
    const colors = CALLOUT_COLORS[tone];
    this.doc.setFillColor(...colors.fill);
    this.doc.setDrawColor(...colors.border);
    this.doc.setLineWidth(0.35);
    this.doc.roundedRect(
      this.margin,
      boxTop,
      this.contentWidth,
      height,
      1.5,
      1.5,
      "FD",
    );
    const accent = tone === "info" ? ORANGE : colors.border;
    this.doc.setFillColor(...accent);
    this.doc.rect(this.margin, boxTop, 1.2, height, "F");
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...TEXT);
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + inset, this.y + index * BODY_LINE);
    });
    this.y = boxTop + height + 3;
  }

  beginCard(): void {
    if (this.activeCard) this.endCard();
    this.ensureSpace(36);
    this.activeCard = {
      page: this.currentPage,
      top: this.y - CARD_VERTICAL_PADDING,
      x: this.margin - CARD_HORIZONTAL_PADDING,
      width: this.contentWidth + CARD_HORIZONTAL_PADDING * 2,
    };
  }

  endCard(): void {
    if (!this.activeCard) return;
    this.cardSegments.push({
      page: this.activeCard.page,
      top: this.activeCard.top,
      bottom: Math.min(
        this.pageHeight - FOOTER_HEIGHT - 3,
        this.y + CARD_VERTICAL_PADDING,
      ),
      x: this.activeCard.x,
      width: this.activeCard.width,
    });
    this.activeCard = null;
    this.y += 4;
  }

  table(
    columns: PdfTableColumn[],
    rows: Array<Record<string, unknown>>,
    options: {
      fontSize?: number;
      headerFontSize?: number;
      headerFill?: [number, number, number];
    } = {},
  ): void {
    if (!columns.length) return;
    const naturalWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const scale = this.contentWidth / naturalWidth;
    const widths = columns.map((column) => column.width * scale);
    const fontSize = Math.max(options.fontSize ?? 9.5, 9.5);
    const headerFontSize = options.headerFontSize ?? 10;
    const lineHeight = Math.max(4.5, fontSize * 0.48);
    const headerLineHeight = Math.max(4.6, headerFontSize * 0.46);
    const headerFill = options.headerFill || ORANGE;
    const cellInset = 1.8;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    const splitCells = (row: Record<string, unknown>): string[][] =>
      columns.map(
        (column, index) =>
          this.doc.splitTextToSize(
            asText(row[column.key]) || "",
            Math.max(4, widths[index] - cellInset * 2),
          ) as string[],
      );

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(headerFontSize);
    const headerLines: string[][] = columns.map(
      (column, index) =>
        this.doc.splitTextToSize(
          column.header,
          Math.max(4, widths[index] - cellInset * 2),
        ) as string[],
    );
    const headerHeight =
      Math.max(...headerLines.map((lines) => lines.length)) * headerLineHeight + 4;

    const drawHeader = () => {
      this.ensureSpace(headerHeight + 2);
      const y = this.y;
      this.doc.setFillColor(...headerFill);
      this.doc.rect(this.margin, y, this.contentWidth, headerHeight, "F");
      this.doc.setDrawColor(...BORDER);
      this.doc.setLineWidth(0.2);
      this.doc.rect(this.margin, y, this.contentWidth, headerHeight);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(headerFontSize);
      this.doc.setTextColor(...WHITE);
      let x = this.margin;
      headerLines.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          this.doc.text(line, x + cellInset, y + 3 + lineIndex * headerLineHeight);
        });
        x += widths[index];
      });
      this.doc.setTextColor(...TEXT);
      this.y = y + headerHeight;
    };

    drawHeader();
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const cells = splitCells(row);
      const rowHeight = Math.max(...cells.map((lines) => lines.length)) * lineHeight + 4.5;
      if (this.y + rowHeight > this.bottomLimit()) {
        this.newPage(this.sectionTitle, this.landscape);
        drawHeader();
      }
      const y = this.y;
      const rowFill: [number, number, number] =
        rowIndex % 2 === 0 ? WHITE : ROW_ALT;
      this.doc.setFillColor(...rowFill);
      this.doc.rect(this.margin, y, this.contentWidth, rowHeight, "F");
      this.doc.setDrawColor(...BORDER);
      this.doc.rect(this.margin, y, this.contentWidth, rowHeight);
      let x = this.margin;
      cells.forEach((lines, index) => {
        const column = columns[index];
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(...TEXT);
        this.doc.line(x, y, x, y + rowHeight);
        const align = column.align || "left";
        lines.forEach((line, lineIndex) => {
          const textX =
            align === "right"
              ? x + widths[index] - cellInset
              : align === "center"
                ? x + widths[index] / 2
                : x + cellInset;
          this.doc.text(line, textX, y + 3 + lineIndex * lineHeight, {
            align,
          });
        });
        x += widths[index];
      });
      this.y = y + rowHeight;
    }
    this.y += 3;
  }

  cover(options: {
    subtitle: string;
    scope: string;
    versionPolicy: string;
    requirementCount: number;
    generatedAt: string;
    packReference: string;
    contents?: string[];
  }): void {
    const width = this.pageWidth;
    this.hasCover = true;
    this.doc.setFillColor(...WHITE);
    this.doc.rect(0, 0, width, this.pageHeight, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...ORANGE);
    this.doc.text("RAVEN", width - this.margin, 9, { align: "right" });
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text("Regulatory Validation Workspace", width - this.margin, 14, {
      align: "right",
    });

    const panelWidth = width * 0.75;
    const panelTop = 25;
    const panelHeight = 151;
    this.doc.setFillColor(...ORANGE);
    this.doc.rect(0, panelTop, panelWidth, panelHeight, "F");
    this.doc.setFillColor(...PEACH);
    this.doc.triangle(
      panelWidth,
      panelTop + panelHeight,
      panelWidth - 24,
      panelTop + panelHeight,
      panelWidth,
      panelTop + panelHeight - 24,
      "F",
    );
    this.doc.setTextColor(...TEXT);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(24);
    const coverTitle = this.title
      .replace(/^RAVEN — /, "")
      .replace(/ Summary$/, "");
    this.doc.text(coverTitle, this.margin + 4, panelTop + 29);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(...TEXT);
    const subtitleLines = this.doc.splitTextToSize(
      options.subtitle,
      panelWidth - this.margin * 2 - 8,
    );
    subtitleLines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 4, panelTop + 42 + index * 5);
    });
    const dividerY = panelTop + 52 + Math.max(0, subtitleLines.length - 1) * 5;
    this.doc.setDrawColor(...ORANGE);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin + 4, dividerY, panelWidth - this.margin - 4, dividerY);
    this.doc.setFontSize(9);
    (options.contents || []).forEach((item, index) => {
      this.doc.text(item, this.margin + 5, dividerY + 13 + index * 10);
    });
    this.doc.setTextColor(...TEXT);
    const cardTop = panelTop + panelHeight + 10;
    const cardHeight = this.pageHeight - cardTop - FOOTER_HEIGHT - 5;
    this.doc.setFillColor(...PEACH);
    this.doc.setDrawColor(...BORDER);
    this.doc.setLineWidth(0.35);
    this.doc.roundedRect(
      this.margin,
      cardTop,
      this.contentWidth,
      cardHeight,
      1.8,
      1.8,
      "FD",
    );
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...ORANGE);
    this.doc.text("DOCUMENT CONTROL", this.margin + 7, cardTop + 10);
    const rows: Array<[string, string]> = [
      ["Project Name", "LIMS"],
      ["Requirements Included", String(options.requirementCount)],
      ["Version Selection", options.versionPolicy],
      ["Generated Date", options.generatedAt],
      ["Pack Reference", options.packReference],
      ["Scope", options.scope],
    ];
    this.doc.setFontSize(7.5);
    rows.forEach(([label, value], index) => {
      const rowY = cardTop + 21 + index * 8;
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...MUTED);
      this.doc.text(label, this.margin + 8, rowY);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...TEXT);
      this.doc.text(":", this.margin + 56, rowY);
      const valueLines = this.doc.splitTextToSize(value, this.contentWidth - 74);
      valueLines.forEach((line: string, lineIndex: number) => {
        this.doc.text(line, this.margin + 62, rowY + lineIndex * 3.7);
      });
    });
    this.y = this.pageHeight - FOOTER_HEIGHT;
  }

  addToc(entries: string[]): TocEntry[] {
    this.startSection("Table of Contents", { newPage: true, landscape: false });
    const result: TocEntry[] = [];
    const tableTop = this.y;
    const numberWidth = 18;
    const pageColumnWidth = 24;
    const sectionWidth = this.contentWidth - numberWidth - pageColumnWidth;
    const headerHeight = 10;
    const rowHeight = 9;
    this.doc.setFillColor(...ORANGE);
    this.doc.rect(this.margin, tableTop, this.contentWidth, headerHeight, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...WHITE);
    this.doc.text("No.", this.margin + 2, tableTop + 6.5);
    this.doc.text("Section", this.margin + numberWidth + 2, tableTop + 6.5);
    this.doc.text("Page", this.margin + numberWidth + sectionWidth + 2, tableTop + 6.5);
    this.y = tableTop + headerHeight;
    entries.forEach((title, index) => {
      const rowTop = this.y;
      this.doc.setFillColor(...(index % 2 === 0 ? WHITE : ROW_ALT));
      this.doc.rect(this.margin, rowTop, this.contentWidth, rowHeight, "F");
      this.doc.setDrawColor(...BORDER);
      this.doc.setLineWidth(0.2);
      this.doc.rect(this.margin, rowTop, this.contentWidth, rowHeight);
      this.doc.line(this.margin + numberWidth, rowTop, this.margin + numberWidth, rowTop + rowHeight);
      this.doc.line(
        this.margin + numberWidth + sectionWidth,
        rowTop,
        this.margin + numberWidth + sectionWidth,
        rowTop + rowHeight,
      );
      const page = this.sectionPages.get(title) || 0;
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...TEXT);
      this.doc.text(String(index + 1), this.margin + 2, rowTop + 5.8);
      this.doc.text(title, this.margin + numberWidth + 2, rowTop + 5.8);
      // Section pages are not known until the body has been rendered. Leave the
      // value blank here; fillToc writes the real page after all sections exist.
      result.push({
        title,
        page,
        tocPage: this.currentPage,
        y: rowTop,
        pageX: this.margin + numberWidth + sectionWidth,
        pageColumnWidth,
      });
      this.y = rowTop + rowHeight;
    });
    this.y += 3;
    return result;
  }

  fillToc(entries: TocEntry[]): void {
    for (const entry of entries) {
      const page = this.sectionPages.get(entry.title) || entry.page;
      if (!page) continue;
      this.doc.setPage(entry.tocPage);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...TEXT);
      this.doc.text(String(page), entry.pageX + entry.pageColumnWidth - 2, entry.y + 5.8, {
        align: "right",
      });
    }
  }

  finalize(): Blob {
    if (this.finalized) return this.doc.output("blob");
    this.finalized = true;
    if (this.activeCard) this.endCard();
    const total = this.doc.getNumberOfPages();
    for (const segment of this.cardSegments) {
      if (segment.bottom <= segment.top) continue;
      this.doc.setPage(segment.page);
      this.doc.setDrawColor(...BORDER);
      this.doc.setLineWidth(0.35);
      this.doc.roundedRect(
        segment.x,
        segment.top,
        segment.width,
        segment.bottom - segment.top,
        1.2,
        1.2,
        "S",
      );
    }
    for (let page = 1; page <= total; page += 1) {
      this.doc.setPage(page);
      const width = this.pageWidth;
      const height = this.pageHeight;
      this.doc.setDrawColor(...BORDER);
      this.doc.setLineWidth(0.35);
      if (!(page === 1 && this.hasCover)) {
        this.doc.line(this.margin, height - FOOTER_HEIGHT, width - this.margin, height - FOOTER_HEIGHT);
      }
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...MUTED);
      if (page === 1 && this.hasCover) {
        this.doc.text("LIMS  |  VALIDATION PACK", width - this.margin, height - 6.5, {
          align: "right",
        });
      } else {
        this.doc.text("RAVEN — Validation Pack", this.margin, height - 6.5);
        this.doc.text(
          `Generated ${this.generatedAt}`,
          width / 2,
          height - 6.5,
          { align: "center" },
        );
        this.doc.text(`Page ${page} of ${total}`, width - this.margin, height - 6.5, {
          align: "right",
        });
      }
    }
    return this.doc.output("blob");
  }
}
