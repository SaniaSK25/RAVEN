import { describe, expect, it } from "@jest/globals";
import { fetchValidationDataset } from "@/lib/export-utils";

describe("fetchValidationDataset", () => {
  it("rejects empty selection without making a backend request", async () => {
    await expect(fetchValidationDataset(["", "  "])).rejects.toThrow(
      "Select at least one requirement before retrieving export data.",
    );
  });
});