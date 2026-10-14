"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  FileUp,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  parseRequirementsFile,
  type IngestionRow,
} from "@/lib/ingestion";

interface ImportResult {
  rowNumber: number;
  status: "imported" | "failed";
  message: string;
  reqKey?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function detailFromResponse(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }
  return "The backend could not save this requirement.";
}

export default function IngestionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<IngestionRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);

  const readyRows = useMemo(
    () => rows.filter((row) => row.status === "ready"),
    [rows],
  );
  const invalidCount = rows.filter((row) => row.status === "invalid").length;
  const duplicateCount = rows.filter((row) => row.status === "duplicate").length;
  const importedCount = results.filter((result) => result.status === "imported").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const retryRows = readyRows.filter(
    (row) =>
      !results.some(
        (result) =>
          result.rowNumber === row.rowNumber && result.status === "imported",
      ),
  );

  async function loadFile(file: File) {
    setParseError("");
    setResults([]);
    setProgress(0);
    if (file.size > MAX_FILE_SIZE) {
      setRows([]);
      setFileName("");
      setParseError("Files must be 10 MB or smaller.");
      return;
    }

    try {
      const parsed = parseRequirementsFile(file.name, await file.text());
      setFileName(file.name);
      setRows(parsed);
    } catch (error) {
      setRows([]);
      setFileName("");
      setParseError(
        error instanceof Error ? error.message : "The selected file could not be read.",
      );
    }
  }

  async function importRequirements() {
    setIsImporting(true);
    setProgress(0);
    const completed = results.filter((result) => result.status === "imported");

    for (const [index, row] of retryRows.entries()) {
      setProgress(index + 1);
      try {
        const response = await fetch("/api/ingestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: row.text,
            text: row.text,
            created_by: "ingestion-ui",
          }),
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          completed.push({
            rowNumber: row.rowNumber,
            status: "failed",
            message: detailFromResponse(body),
          });
        } else {
          const reqKey =
            typeof body === "object" &&
            body !== null &&
            "req_key" in body &&
            typeof body.req_key === "string"
              ? body.req_key
              : undefined;
          completed.push({
            rowNumber: row.rowNumber,
            status: "imported",
            message: reqKey ? `${reqKey} created` : "Requirement created",
            reqKey,
          });
        }
      } catch {
        completed.push({
          rowNumber: row.rowNumber,
          status: "failed",
          message: "Could not reach the ingestion service.",
        });
      }
      setResults([...completed]);
    }
    setIsImporting(false);
  }

  function clearSelection() {
    if (isImporting) return;
    setFileName("");
    setRows([]);
    setParseError("");
    setResults([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <DashboardLayout>
      <div className="page-header-shell flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Requirement workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Ingest requirements
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Add a CSV or JSON file, review the records, then import them into
            your RAVEN workspace.
          </p>
        </div>
        {fileName ? (
          <button
            type="button"
            onClick={clearSelection}
            disabled={isImporting}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear file
          </button>
        ) : null}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <section
            aria-labelledby="upload-heading"
            className="page-panel sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-accent dark:bg-orange-950/40">
                <FileUp aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <h2
                  id="upload-heading"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  1. Choose a source file
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  CSV or JSON · up to 10 MB · requirement text is required
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              aria-label="Choose a CSV or JSON requirements file"
              className="sr-only"
              disabled={isImporting}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void loadFile(file);
              }}
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) void loadFile(file);
              }}
              className={`mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed px-5 py-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isDragging
                  ? "border-accent bg-orange-50/70 dark:bg-orange-950/20"
                  : "border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                <Upload aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {fileName || "Drop your file here, or browse"}
              </span>
              <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                CSV and JSON files only
              </span>
            </button>
            {parseError ? (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {parseError}
              </p>
            ) : null}
          </section>

          {rows.length > 0 ? (
            <>
              <section
                aria-labelledby="review-heading"
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                  <div>
                    <h2
                      id="review-heading"
                      className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      2. Review before importing
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {fileName} · {rows.length} source rows
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      {readyRows.length} ready
                    </span>
                    {duplicateCount > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {duplicateCount} duplicate
                      </span>
                    ) : null}
                    {invalidCount > 0 ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-800 dark:bg-red-950 dark:text-red-200">
                        {invalidCount} invalid
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="max-h-80 overflow-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th scope="col" className="px-5 py-3">Source row</th>
                        <th scope="col" className="px-5 py-3">Requirement text</th>
                        <th scope="col" className="px-5 py-3">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {rows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="whitespace-nowrap px-5 py-3 align-top text-xs tabular-nums text-zinc-500">
                            {row.rowNumber}
                          </td>
                          <td className="max-w-xl px-5 py-3 leading-5 break-words text-zinc-800 dark:text-zinc-200">
                            {row.text || <span className="text-zinc-400 italic">No text provided</span>}
                          </td>
                          <td className="px-5 py-3 align-top">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                row.status === "ready"
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : row.status === "duplicate"
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-red-700 dark:text-red-300"
                              }`}
                            >
                              {row.status === "ready" ? (
                                <Check aria-hidden="true" className="h-3.5 w-3.5" />
                              ) : (
                                <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
                              )}
                              {row.message ?? "Ready to import"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                aria-labelledby="import-heading"
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <h2
                    id="import-heading"
                    className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    3. Import validated rows
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isImporting
                      ? `Saving row ${progress} of ${retryRows.length}…`
                      : failedCount > 0
                        ? `${failedCount} failed row${failedCount === 1 ? "" : "s"} can be retried.`
                        : `${retryRows.length} requirement${retryRows.length === 1 ? "" : "s"} will be created.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void importRequirements()}
                  disabled={retryRows.length === 0 || isImporting}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                >
                  {isImporting ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isImporting
                    ? "Importing…"
                    : failedCount > 0
                      ? "Retry failed rows"
                      : importedCount > 0
                        ? "Import remaining rows"
                        : "Import requirements"}
                </button>
                {results.length > 0 ? (
                  <div aria-live="polite" className="basis-full text-sm">
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">
                      {importedCount} imported · {failedCount} failed
                    </p>
                    {failedCount > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
                        {results
                          .filter((result) => result.status === "failed")
                          .map((result) => (
                            <li key={result.rowNumber}>
                              Row {result.rowNumber}: {result.message}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                        All validated rows were saved. Imported rows cannot be rolled back as a batch.
                      </p>
                    )}
                    {importedCount > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                        {results
                          .filter((result) => result.status === "imported")
                          .map((result) => (
                            <li key={result.rowNumber}>
                              Row {result.rowNumber}: {result.message}
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Accepted formats
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <FileSpreadsheet aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">CSV</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Include a header named <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">text</code>. Extra columns are ignored.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <FileJson aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">JSON</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Use an array of strings or objects with a string <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">text</code> property.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {results.length > 0 && failedCount === 0 ? (
            <section
              aria-live="polite"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Import complete
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-200">
                {importedCount} records have been added to the workspace.
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </DashboardLayout>
  );
}
