import { describe, expect, it, jest } from "@jest/globals";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import {
  generateRiskAssessmentPDF,
  generateTestScriptsPDF,
  generateValidationPackPDF,
  generateValidationPackZip,
} from "@/lib/export-utils";
import { PdfBuilder } from "@/lib/pdf-layout";
import { fixtureDataset } from "@/lib/__tests__/fixtures";

Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
  configurable: true,
  value: () =>
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==",
});

function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The generated PDF could not be read as text."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("The generated PDF could not be read."));
    reader.readAsText(blob);
  });
}

describe("validation pack ZIP", () => {
  it("contains only one PDF for each of the five report sections", async () => {
    const data = {
      ...fixtureDataset,
      traceability: {
        ...fixtureDataset.traceability,
        graph: {
          nodes: [
            { id: "req", type: "requirement", label: "REQ-0001" },
            { id: "risk", type: "risk", label: "Risk assessment · REQ-0001" },
            { id: "assurance", type: "assurance", label: "Scripted assurance · REQ-0001" },
            { id: "test", type: "test", label: "TC-REQ-0001-01" },
          ],
          edges: [
            { id: "req-risk", source: "req", target: "risk", type: "has_risk" },
            { id: "risk-assurance", source: "risk", target: "assurance", type: "assessed_as" },
            { id: "assurance-test", source: "assurance", target: "test", type: "verifies" },
          ],
        },
      },
    };
    const blob = await generateValidationPackZip(data);
    const zipBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) resolve(reader.result);
        else reject(new Error("The generated ZIP could not be read as an ArrayBuffer."));
      };
      reader.onerror = () => reject(reader.error ?? new Error("The generated ZIP could not be read."));
      reader.readAsArrayBuffer(blob);
    });
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).filter(
      (filename) => !zip.files[filename].dir,
    );

    expect(filenames).toEqual([
      "01_Risk_Assessment.pdf",
      "02_Assurance_Rationale.pdf",
      "03_Test_Scripts.pdf",
      "04_Traceability_Matrix.pdf",
      "05_Gap_Report.pdf",
    ]);
    expect(filenames.every((filename) => filename.endsWith(".pdf"))).toBe(true);
    const signatures = await Promise.all(
      filenames.map((filename) => zip.files[filename].async("string")),
    );
    expect(signatures.every((content) => content.startsWith("%PDF-"))).toBe(true);
    const graphElement = jest.mocked(html2canvas).mock.calls[0]?.[0];
    const graphSvg = graphElement?.querySelector("svg")?.outerHTML || "";
    expect(graphElement).toBeInstanceOf(HTMLElement);
    expect(graphSvg).toContain("#FAFAFA");
    expect(graphSvg).toContain("#FFECE5");
    expect(graphSvg).toContain("Requirement");
  });

  it("generates one consolidated PDF containing the full validation pack", async () => {
    const pdf = await blobText(await generateValidationPackPDF(fixtureDataset));

    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect([...pdf.matchAll(/\/Type\s*\/Page\b/g)].length).toBeGreaterThanOrEqual(9);
  });

  it("flows compact requirement summaries together instead of starting a page per requirement", async () => {
    const first = {
      ...fixtureDataset.requirements[0],
      risks: [],
      assurance: [],
      tests: [],
    };
    const data = {
      ...fixtureDataset,
      requirements: [
        { ...first, id: "requirement-one", req_key: "REQ-0001", display_key: "REQ-0001" },
        { ...first, id: "requirement-two", req_key: "REQ-0002", display_key: "REQ-0002" },
      ],
    };
    const pdf = await blobText(await generateRiskAssessmentPDF(data));

    expect([...pdf.matchAll(/\/Type\s*\/Page\b/g)]).toHaveLength(2);
  });

  it("renders test scripts as numbered actions without introductions or expected results", async () => {
    const requirement = fixtureDataset.requirements[0];
    const test = requirement.tests[0];
    const data = {
      ...fixtureDataset,
      requirements: [
        {
          ...requirement,
          tests: [
            {
              ...test,
              script:
                "Script introduction text.\nPreconditions:\n- User is logged in.\n- Valid sample data exists.\n\nTest Steps:\n1. Submit invalid data. Expected: Validation error appears.\n2. Submit valid data. Expected result: Record is saved.",
            },
          ],
        },
      ],
    };
    const numberedListSpy = jest.spyOn(PdfBuilder.prototype, "numberedList");
    const bulletsSpy = jest.spyOn(PdfBuilder.prototype, "bullets");
    const labelParagraphSpy = jest.spyOn(PdfBuilder.prototype, "labelParagraph");

    try {
      await generateTestScriptsPDF(data);
      expect(bulletsSpy).toHaveBeenCalledWith([
        "User is logged in.",
        "Valid sample data exists.",
      ]);
      expect(numberedListSpy).toHaveBeenCalledWith([
        "Submit invalid data.",
        "Submit valid data.",
      ]);
      expect(
        labelParagraphSpy.mock.calls.some(([label]) =>
          ["Script introduction", "Expected result"].includes(label),
        ),
      ).toBe(false);
    } finally {
      numberedListSpy.mockRestore();
      bulletsSpy.mockRestore();
      labelParagraphSpy.mockRestore();
    }
  });
});
