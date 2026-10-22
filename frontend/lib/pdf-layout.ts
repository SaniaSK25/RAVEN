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
  pageWidth: number;
}

export interface PdfBuilderOptions {
  packReference: string;
  generatedAt: string;
  title?: string;
}

const MARGIN = 14;
const HEADER_HEIGHT = 12;
const FOOTER_HEIGHT = 14;
const BODY_FONT = 9.4;
const BODY_LINE = 4.55;

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pageFormat(landscape: boolean): "a4" {
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
  private finalized = false;

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
    this.y = HEADER_HEIGHT + 9;
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
    this.doc.setFillColor(21, 35, 58);
    this.doc.rect(0, 0, width, HEADER_HEIGHT, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.2);
    this.doc.text("RAVEN — Validation Pack", this.margin, 7.6);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7.2);
    this.doc.text(this.packReference, width - this.margin, 7.6, { align: "right" });
    this.doc.setTextColor(42, 52, 68);
  }

  newPage(section = this.sectionTitle, landscape = this.landscape): void {
    this.doc.addPage(pageFormat(landscape), landscape ? "landscape" : "portrait");
    this.landscape = landscape;
    this.sectionTitle = section;
    this.drawPageHeader();
    this.y = HEADER_HEIGHT + 9;
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
    if (options.recordPage !== false) {
      this.sectionPages.set(title, this.currentPage);
    }
    this.sectionHeading(title);
  }

  sectionHeading(title: string): void {
    this.ensureSpace(20);
    this.doc.setTextColor(21, 35, 58);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(15);
    const lines = this.doc.splitTextToSize(title, this.contentWidth);
    for (const line of lines) {
      this.doc.text(line, this.margin, this.y);
      this.y += 6.5;
    }
    this.doc.setDrawColor(0, 122, 180);
    this.doc.setLineWidth(0.6);
    this.doc.line(this.margin, this.y - 3.2, this.margin + 30, this.y - 3.2);
    this.doc.setLineWidth(0.2);
    this.y += 5;
  }

  subheading(title: string, options: { color?: [number, number, number] } = {}): void {
    this.ensureSpace(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10.6);
    this.doc.setTextColor(...(options.color || [21, 35, 58]));
    const lines = this.doc.splitTextToSize(title, this.contentWidth);
    for (const line of lines) {
      if (this.y + 5 > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
      this.doc.text(line, this.margin, this.y);
      this.y += 5;
    }
    this.y += 1.2;
    this.doc.setTextColor(42, 52, 68);
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
    const fontSize = options.fontSize || BODY_FONT;
    const lineHeight = options.lineHeight || BODY_LINE;
    const x = options.x ?? this.margin;
    const width = options.width ?? this.contentWidth;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...(options.color || [42, 52, 68]));

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
          this.doc.setTextColor(...(options.color || [42, 52, 68]));
        }
        this.doc.text(line, x, this.y);
        this.y += lineHeight;
      }
    }
    this.doc.setTextColor(42, 52, 68);
    this.y += options.gapAfter ?? 1.2;
  }

  labelParagraph(
    label: string,
    body: unknown,
    options: { meta?: string; gapAfter?: number } = {},
  ): void {
    this.ensureSpace(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9.6);
    this.doc.setTextColor(21, 35, 58);
    const labelLines = this.doc.splitTextToSize(label, this.contentWidth);
    for (const line of labelLines) {
      if (this.y + 4.8 > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
      this.doc.text(line, this.margin, this.y);
      this.y += 4.8;
    }
    if (options.meta) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7.6);
      this.doc.setTextColor(96, 109, 128);
      const metaLines = this.doc.splitTextToSize(options.meta, this.contentWidth);
      for (const line of metaLines) {
        if (this.y + 4 > this.bottomLimit()) this.newPage(this.sectionTitle, this.landscape);
        this.doc.text(line, this.margin, this.y);
        this.y += 4;
      }
    }
    this.doc.setTextColor(42, 52, 68);
    this.y += 1;
    this.paragraph(body, { gapAfter: options.gapAfter ?? 2.2 });
  }

  metaRow(label: string, value: unknown): void {
    const labelWidth = 42;
    const valueWidth = this.contentWidth - labelWidth;
    const valueText = asText(value) || "Not recorded";
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8.1);
    const lines = this.doc.splitTextToSize(valueText, valueWidth);
    const height = Math.max(5.2, lines.length * 3.8 + 1.4);
    this.ensureSpace(height);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.1);
    this.doc.setTextColor(96, 109, 128);
    this.doc.text(label, this.margin, this.y);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(42, 52, 68);
    for (let index = 0; index < lines.length; index += 1) {
      this.doc.text(lines[index], this.margin + labelWidth, this.y + index * 3.8);
    }
    this.y += height;
  }

  metadataGroup(title: string, rows: Array<[string, unknown]>): void {
    this.subheading(title);
    for (const [label, value] of rows) this.metaRow(label, value);
    this.y += 1;
  }

  bullets(items: string[], options: { fontSize?: number } = {}): void {
    const fontSize = options.fontSize || BODY_FONT;
    const lineHeight = fontSize * 0.48;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(42, 52, 68);
    for (const item of items) {
      const lines = this.doc.splitTextToSize(asText(item), this.contentWidth - 5);
      this.ensureSpace(Math.max(5, lines.length * lineHeight));
      this.doc.text("-", this.margin, this.y);
      for (const line of lines) {
        if (this.y + lineHeight > this.bottomLimit()) {
          this.newPage(this.sectionTitle, this.landscape);
          this.doc.setFont("helvetica", "normal");
          this.doc.setFontSize(fontSize);
          this.doc.setTextColor(42, 52, 68);
        }
        this.doc.text(line, this.margin + 5, this.y);
        this.y += lineHeight;
      }
      this.y += 1.1;
    }
    this.y += 1;
  }

  divider(): void {
    this.ensureSpace(5);
    this.doc.setDrawColor(218, 223, 230);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 4;
  }

  table(
    columns: PdfTableColumn[],
    rows: Array<Record<string, unknown>>,
    options: { fontSize?: number; headerFill?: [number, number, number] } = {},
  ): void {
    if (!columns.length) return;
    const naturalWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const scale = this.contentWidth / naturalWidth;
    const widths = columns.map((column) => column.width * scale);
    const fontSize = options.fontSize || 7;
    const lineHeight = Math.max(2.8, fontSize * 0.42);
    const headerFill = options.headerFill || [225, 232, 240];

    const splitCells = (row: Record<string, unknown>): string[][] =>
      columns.map(
        (column, index) =>
          this.doc.splitTextToSize(
            asText(row[column.key]) || "",
            Math.max(4, widths[index] - 2),
          ) as string[],
      );

    const headerLines: string[][] = columns.map(
      (column, index) =>
        this.doc.splitTextToSize(
          column.header,
          Math.max(4, widths[index] - 2),
        ) as string[],
    );
    const headerHeight = Math.max(...headerLines.map((lines) => lines.length)) * lineHeight + 2.8;

    const drawHeader = () => {
      this.ensureSpace(headerHeight + 2);
      const y = this.y;
      this.doc.setFillColor(...headerFill);
      this.doc.rect(this.margin, y, this.contentWidth, headerHeight, "F");
      this.doc.setDrawColor(188, 197, 209);
      this.doc.setLineWidth(0.2);
      this.doc.rect(this.margin, y, this.contentWidth, headerHeight);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(fontSize);
      this.doc.setTextColor(21, 35, 58);
      let x = this.margin;
      headerLines.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          this.doc.text(line, x + 1, y + 2.6 + lineIndex * lineHeight);
        });
        x += widths[index];
      });
      this.doc.setTextColor(42, 52, 68);
      this.y = y + headerHeight;
    };

    drawHeader();
    for (const row of rows) {
      const cells = splitCells(row);
      const rowHeight = Math.max(...cells.map((lines) => lines.length)) * lineHeight + 2.6;
      if (this.y + rowHeight > this.bottomLimit()) {
        this.newPage(this.sectionTitle, this.landscape);
        drawHeader();
      }
      const y = this.y;
      this.doc.setFillColor(250, 251, 252);
      this.doc.rect(this.margin, y, this.contentWidth, rowHeight, "F");
      this.doc.setDrawColor(218, 223, 230);
      this.doc.rect(this.margin, y, this.contentWidth, rowHeight);
      let x = this.margin;
      cells.forEach((lines, index) => {
        const column = columns[index];
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(fontSize);
        this.doc.setTextColor(42, 52, 68);
        this.doc.line(x, y, x, y + rowHeight);
        const align = column.align || "left";
        lines.forEach((line, lineIndex) => {
          const textX =
            align === "right"
              ? x + widths[index] - 1
              : align === "center"
                ? x + widths[index] / 2
                : x + 1;
          this.doc.text(line, textX, y + 2.1 + lineIndex * lineHeight, {
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
  }): void {
    const width = this.pageWidth;
    this.doc.setFillColor(15, 23, 42);
    this.doc.rect(0, HEADER_HEIGHT, width, 65, "F");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(24);
    this.doc.text("RAVEN", this.margin, HEADER_HEIGHT + 24);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(15);
    this.doc.text("Validation Pack", this.margin, HEADER_HEIGHT + 34);
    this.doc.setFontSize(9);
    this.doc.setTextColor(191, 211, 235);
    this.doc.text(options.subtitle, this.margin, HEADER_HEIGHT + 45);
    this.doc.setFontSize(8);
    this.doc.text(`Pack reference: ${options.packReference}`, this.margin, HEADER_HEIGHT + 55);
    this.doc.text(`Generated: ${options.generatedAt}`, this.margin, HEADER_HEIGHT + 61);
    this.doc.setTextColor(42, 52, 68);
    this.y = HEADER_HEIGHT + 78;

    this.subheading("Scope and document control");
    this.metaRow("Scope", options.scope);
    this.metaRow("Requirements included", String(options.requirementCount));
    this.metaRow("Version selection", options.versionPolicy);
    this.metaRow("Pack reference", options.packReference);
    this.metaRow("Generation date and time", options.generatedAt);
    this.y += 2;
  }

  addToc(entries: string[]): TocEntry[] {
    this.startSection("Contents", { newPage: true, landscape: false });
    const result: TocEntry[] = [];
    for (const title of entries) {
      this.ensureSpace(8);
      const y = this.y;
      const page = this.sectionPages.get(title) || 0;
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9.2);
      this.doc.setTextColor(42, 52, 68);
      this.doc.text(title, this.margin, y);
      const titleWidth = this.doc.getTextWidth(title);
      const dotsStart = this.margin + titleWidth + 2;
      const dotsEnd = this.pageWidth - this.margin - 12;
      if (dotsEnd > dotsStart) {
        this.doc.setDrawColor(180, 190, 200);
        this.doc.setLineDashPattern([0.6, 1.4], 0);
        this.doc.line(dotsStart, y - 0.7, dotsEnd, y - 0.7);
        this.doc.setLineDashPattern([], 0);
      }
      this.doc.text("00", this.pageWidth - this.margin, y, { align: "right" });
      result.push({ title, page, tocPage: this.currentPage, y, pageWidth: this.pageWidth });
      this.y += 7.2;
    }
    return result;
  }

  fillToc(entries: TocEntry[]): void {
    for (const entry of entries) {
      const page = this.sectionPages.get(entry.title) || entry.page;
      if (!page) continue;
      this.doc.setPage(entry.tocPage);
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(entry.pageWidth - this.margin - 12, entry.y - 4, 12, 5, "F");
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9.2);
      this.doc.setTextColor(42, 52, 68);
      this.doc.text(String(page), entry.pageWidth - this.margin, entry.y, { align: "right" });
    }
  }

  finalize(): Blob {
    if (this.finalized) return this.doc.output("blob");
    this.finalized = true;
    const total = this.doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      this.doc.setPage(page);
      const width = this.pageWidth;
      const height = this.pageHeight;
      this.doc.setDrawColor(205, 212, 220);
      this.doc.setLineWidth(0.25);
      this.doc.line(this.margin, height - 11.5, width - this.margin, height - 11.5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      this.doc.setTextColor(110, 120, 135);
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
    return this.doc.output("blob");
  }
}
