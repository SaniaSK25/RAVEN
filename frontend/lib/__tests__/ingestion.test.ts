import { describe, expect, it } from "@jest/globals";
import { parseRequirementsFile } from "@/lib/ingestion";

describe("parseRequirementsFile", () => {
  it("parses CSV requirements", () => {
    expect(
      parseRequirementsFile("requirements.csv", "text\nAccount lockout\n"),
    ).toEqual([
      {
        rowNumber: 2,
        text: "Account lockout",
        status: "ready",
      },
    ]);
  });

  it("parses JSON requirements", () => {
    expect(
      parseRequirementsFile(
        "requirements.json",
        JSON.stringify([{ text: "Account lockout" }]),
      ),
    ).toEqual([
      {
        rowNumber: 1,
        text: "Account lockout",
        status: "ready",
      },
    ]);
  });

  it("rejects Excel files", () => {
    expect(() => parseRequirementsFile("requirements.xlsx", "")).toThrow(
      "Choose a CSV or JSON file.",
    );
  });
});
