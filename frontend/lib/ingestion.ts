export type IngestionRowStatus = "ready" | "duplicate" | "invalid";

export interface IngestionRow {
  rowNumber: number;
  text: string;
  status: IngestionRowStatus;
  message?: string;
}

function parseCsv(source: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("The CSV contains a quoted field that was not closed.");
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

function rowsFromCsv(source: string): Array<{ rowNumber: number; text: string }> {
  const records = parseCsv(source.replace(/^\uFEFF/, ""));
  const headers = records[0]?.map((header) => header.trim().toLowerCase()) ?? [];
  const textColumn = headers.indexOf("text");
  if (textColumn < 0) {
    throw new Error('CSV files must include a column named "text".');
  }

  return records.slice(1).map((record, index) => ({
    rowNumber: index + 2,
    text: (record[textColumn] ?? "").trim(),
  }));
}

function rowsFromJson(
  source: string,
): Array<{ rowNumber: number; text: string }> {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new Error("The JSON file could not be parsed. Check its syntax.");
  }
  if (!Array.isArray(data)) {
    throw new Error("JSON files must contain an array of strings or objects.");
  }

  return data.map((item: unknown, index: number) => {
    let text = "";
    if (typeof item === "string") {
      text = item.trim();
    } else if (
      typeof item === "object" &&
      item !== null &&
      "text" in item &&
      typeof item.text === "string"
    ) {
      text = item.text.trim();
    }
    return { rowNumber: index + 1, text };
  });
}

export function parseRequirementsFile(
  fileName: string,
  source: string,
): IngestionRow[] {
  const extension = fileName.split(".").pop()?.toLowerCase();
  let rows: Array<{ rowNumber: number; text: string }>;
  if (extension === "csv") {
    rows = rowsFromCsv(source);
  } else if (extension === "json") {
    rows = rowsFromJson(source);
  } else {
    throw new Error("Choose a CSV or JSON file.");
  }

  const firstRowForText = new Map<string, number>();
  return rows.map(({ rowNumber, text }) => {
    if (!text) {
      return {
        rowNumber,
        text,
        status: "invalid",
        message: "Requirement text is empty or missing.",
      };
    }
    const duplicateOf = firstRowForText.get(text);
    if (duplicateOf !== undefined) {
      return {
        rowNumber,
        text,
        status: "duplicate",
        message: `Duplicate of row ${duplicateOf}; this copy will be skipped.`,
      };
    }
    firstRowForText.set(text, rowNumber);
    return { rowNumber, text, status: "ready" };
  });
}
