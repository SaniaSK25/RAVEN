"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  FileJson,
  FileUp,
  LoaderCircle,
  Microscope,
  Upload,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { backendFetch, RAVEN_BASE_PATH } from "@/lib/backend-api";
import { parseRequirementsFile, type IngestionRow } from "@/lib/ingestion";

interface ImportResult {
  rowNumber: number;
  status: "imported" | "failed";
  message: string;
  reqKey?: string;
}

interface BatchAssessmentItem {
  requirement_id: string;
  requirement_key: string | null;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "ALREADY_ANALYZED";
  error?: string;
  risk_assessment?: {
    rpn: number;
    band: string;
  };
  assurance_decision?: {
    assurance_level: string;
    generate_test: boolean;
    reason: string;
  } | null;
}

interface IngestionBatchResponse {
  batch_id: string;
  status: "IMPORTED" | "PROCESSING" | "PARTIAL" | "COMPLETED";
  requested_count: number;
  items: IngestionBatchItem[];
  analysis_results: BatchAssessmentItem[];
  error: string | null;
}

interface IngestionBatchItem {
  requirement_id: string;
  requirement_key: string | null;
  source_row: number | null;
  reused_existing: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const INGESTION_BATCH_ID_KEY = "raven_ingestion_batch_id";
const INGESTION_ANALYSIS_REQUESTED_KEY = "raven_ingestion_analysis_requested";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseIngestionBatchResponse(value: unknown): IngestionBatchResponse | null {
  if (!isRecord(value) || !Array.isArray(value.items) || !Array.isArray(value.analysis_results)) {
    return null;
  }
  if (
    typeof value.batch_id !== "string" ||
    (value.status !== "IMPORTED" &&
      value.status !== "PROCESSING" &&
      value.status !== "PARTIAL" &&
      value.status !== "COMPLETED") ||
    typeof value.requested_count !== "number"
  ) {
    return null;
  }

  const items: IngestionBatchItem[] = [];
  for (const rawItem of value.items) {
    if (
      !isRecord(rawItem) ||
      typeof rawItem.requirement_id !== "string" ||
      typeof rawItem.reused_existing !== "boolean"
    ) {
      return null;
    }
    items.push({
      requirement_id: rawItem.requirement_id,
      requirement_key:
        typeof rawItem.requirement_key === "string" ||
        rawItem.requirement_key === null
          ? rawItem.requirement_key
          : null,
      source_row: typeof rawItem.source_row === "number" ? rawItem.source_row : null,
      reused_existing: rawItem.reused_existing,
    });
  }

  const analysisResults: BatchAssessmentItem[] = [];
  for (const rawResult of value.analysis_results) {
    if (
      !isRecord(rawResult) ||
      typeof rawResult.requirement_id !== "string" ||
      (rawResult.status !== "PENDING" &&
        rawResult.status !== "SUCCEEDED" &&
        rawResult.status !== "FAILED" &&
        rawResult.status !== "ALREADY_ANALYZED")
    ) {
      return null;
    }
    const result: BatchAssessmentItem = {
      requirement_id: rawResult.requirement_id,
      requirement_key:
        typeof rawResult.requirement_key === "string" ||
        rawResult.requirement_key === null
          ? rawResult.requirement_key
          : null,
      status: rawResult.status,
    };
    if (typeof rawResult.error === "string") result.error = rawResult.error;
    if (
      isRecord(rawResult.risk_assessment) &&
      typeof rawResult.risk_assessment.rpn === "number" &&
      typeof rawResult.risk_assessment.band === "string"
    ) {
      result.risk_assessment = {
        rpn: rawResult.risk_assessment.rpn,
        band: rawResult.risk_assessment.band,
      };
    }
    if (
      isRecord(rawResult.assurance_decision) &&
      typeof rawResult.assurance_decision.assurance_level === "string" &&
      typeof rawResult.assurance_decision.generate_test === "boolean" &&
      typeof rawResult.assurance_decision.reason === "string"
    ) {
      result.assurance_decision = {
        assurance_level: rawResult.assurance_decision.assurance_level,
        generate_test: rawResult.assurance_decision.generate_test,
        reason: rawResult.assurance_decision.reason,
      };
    } else {
      result.assurance_decision = null;
    }
    analysisResults.push(result);
  }

  return {
    batch_id: value.batch_id,
    status: value.status,
    requested_count: value.requested_count,
    items,
    analysis_results: analysisResults,
    error: typeof value.error === "string" ? value.error : null,
  };
}

export default function IngestionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeAnalysisRequestedRef = useRef(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<IngestionRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<BatchAssessmentItem[]>([]);
  const [analysisError, setAnalysisError] = useState("");
  const [ingestionBatchId, setIngestionBatchId] = useState("");
  const [ingestionBatchStatus, setIngestionBatchStatus] = useState<
    IngestionBatchResponse["status"] | ""
  >("");
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [isFormatsExpanded, setIsFormatsExpanded] = useState(false);

  const restoreIngestionBatch = useCallback((batch: IngestionBatchResponse) => {
    setIngestionBatchId(batch.batch_id);
    setIngestionBatchStatus(batch.status);
    setResults(
      batch.items.map((item, index) => ({
        rowNumber: item.source_row ?? index + 1,
        status: "imported",
        message: item.reused_existing
          ? `${item.requirement_key ?? "Requirement"} already exists; existing record reused`
          : `${item.requirement_key ?? "Requirement"} created`,
        reqKey: item.requirement_key ?? undefined,
      })),
    );
    setAnalysisResults(batch.analysis_results);
    setAnalysisError(batch.error ?? "");
  }, []);

  useEffect(() => {
    const savedBatchId = window.localStorage.getItem(INGESTION_BATCH_ID_KEY);
    if (!savedBatchId) return;
    resumeAnalysisRequestedRef.current =
      window.localStorage.getItem(INGESTION_ANALYSIS_REQUESTED_KEY) === savedBatchId;
    backendFetch<IngestionBatchResponse>(`requirements/batch/${savedBatchId}`)
      .then(restoreIngestionBatch)
      .catch((error: unknown) => {
        setAnalysisError(
          error instanceof Error ? error.message : "Could not restore the previous import.",
        );
      });
  }, [restoreIngestionBatch]);

  useEffect(() => {
    if (
      !ingestionBatchId ||
      (!isAnalyzing && ingestionBatchStatus !== "PROCESSING")
    ) {
      return;
    }

    let active = true;
    let timer: number;
    const refreshProgress = async () => {
      try {
        const batch = await backendFetch<IngestionBatchResponse>(
          `requirements/batch/${ingestionBatchId}`,
        );
        if (active) restoreIngestionBatch(batch);
      } catch (error) {
        if (active) {
          setAnalysisError(
            error instanceof Error ? error.message : "Could not refresh analysis progress.",
          );
        }
      } finally {
        if (active) timer = window.setTimeout(refreshProgress, 2000);
      }
    };

    timer = window.setTimeout(refreshProgress, 2000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [ingestionBatchId, ingestionBatchStatus, isAnalyzing, restoreIngestionBatch]);

  const readyRows = useMemo(
    () => rows.filter((row) => row.status === "ready"),
    [rows],
  );
  const invalidCount = rows.filter((row) => row.status === "invalid").length;
  const duplicateCount = rows.filter((row) => row.status === "duplicate").length;
  const importedCount = results.filter((result) => result.status === "imported").length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const processedCount = importedCount + failedCount;
  const importProgressPercent = readyRows.length
    ? Math.round((processedCount / readyRows.length) * 100)
    : 0;
  const retryRows = readyRows.filter(
    (row) =>
      !results.some(
        (result) =>
          result.rowNumber === row.rowNumber && result.status === "imported",
      ),
  );
  const riskDistribution = useMemo(
    () =>
      analysisResults.reduce(
        (distribution, result) => {
          const band = result.risk_assessment?.band;
          if (result.status === "SUCCEEDED" && band) {
            distribution[band] = (distribution[band] ?? 0) + 1;
          }
          return distribution;
        },
        {} as Record<string, number>,
      ),
    [analysisResults],
  );
  const analysisProcessedCount = analysisResults.filter(
    (item) => item.status !== "PENDING",
  ).length;
  const analysisFailedCount = analysisResults.filter(
    (item) => item.status === "FAILED",
  ).length;
  const analysisProgressPercent = importedCount
    ? Math.round((analysisProcessedCount / importedCount) * 100)
    : 0;
  const analysisBusy = isAnalyzing || ingestionBatchStatus === "PROCESSING";

  async function loadFile(file: File) {
    setParseError("");
    setResults([]);
    setAnalysisResults([]);
    setAnalysisError("");
    setIngestionBatchId("");
    setIngestionBatchStatus("");
    window.localStorage.removeItem(INGESTION_BATCH_ID_KEY);
    window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
    resumeAnalysisRequestedRef.current = false;
    setIsReviewExpanded(false);
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
    setAnalysisError("");
    try {
      const response = await fetch(`${RAVEN_BASE_PATH}/api/ingestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: retryRows.map((row) => ({
            description: row.text,
            text: row.text,
            created_by: "ingestion-ui",
            source_row: row.rowNumber,
          })),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(detailFromResponse(body));
      const batch = parseIngestionBatchResponse(body);
      if (!batch || batch.items.length !== retryRows.length) {
        throw new Error("The ingestion service returned an invalid import result.");
      }
      window.localStorage.setItem(INGESTION_BATCH_ID_KEY, batch.batch_id);
      window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
      resumeAnalysisRequestedRef.current = false;
      restoreIngestionBatch(batch);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Could not import requirements.",
      );
      setResults([
        ...results.filter((result) => result.status === "imported"),
        ...retryRows.map((row) => ({
          rowNumber: row.rowNumber,
          status: "failed" as const,
          message: "The requirements could not be imported.",
        })),
      ]);
    } finally {
      setIsImporting(false);
    }
  }

  const analyzeImportedRequirements = useCallback(async () => {
    if (!ingestionBatchId || ingestionBatchStatus === "COMPLETED") return;
    window.localStorage.setItem(INGESTION_ANALYSIS_REQUESTED_KEY, ingestionBatchId);
    resumeAnalysisRequestedRef.current = true;
    setIsAnalyzing(true);
    setAnalysisError("");
    setIsReviewExpanded(false);
    setIsFormatsExpanded(false);
    try {
      let batch: IngestionBatchResponse;
      while (true) {
        batch = await backendFetch<IngestionBatchResponse>(
          `requirements/batch/${ingestionBatchId}/analyze`,
          { method: "POST" },
        );
        restoreIngestionBatch(batch);
        if (batch.status === "PARTIAL" || batch.status === "COMPLETED") break;
      }
      window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
      resumeAnalysisRequestedRef.current = false;
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed.",
      );
      try {
        const batch = await backendFetch<IngestionBatchResponse>(
          `requirements/batch/${ingestionBatchId}`,
        );
        restoreIngestionBatch(batch);
        if (batch.status !== "PROCESSING" && batch.status !== "IMPORTED") {
          window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
          resumeAnalysisRequestedRef.current = false;
        }
      } catch (restoreError) {
        resumeAnalysisRequestedRef.current = false;
        setAnalysisError(
          restoreError instanceof Error
            ? restoreError.message
            : "Could not restore analysis progress.",
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [ingestionBatchId, ingestionBatchStatus, restoreIngestionBatch]);

  useEffect(() => {
    if (!resumeAnalysisRequestedRef.current || isAnalyzing || !ingestionBatchId) return;
    if (
      ingestionBatchStatus === "IMPORTED" ||
      ingestionBatchStatus === "PARTIAL"
    ) {
      const timer = window.setTimeout(() => {
        void analyzeImportedRequirements();
      }, 0);
      return () => window.clearTimeout(timer);
    } else if (ingestionBatchStatus === "COMPLETED") {
      window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
      resumeAnalysisRequestedRef.current = false;
    }
  }, [
    analyzeImportedRequirements,
    ingestionBatchId,
    ingestionBatchStatus,
    isAnalyzing,
  ]);

  function clearSelection() {
    if (isImporting || analysisBusy) return;
    setFileName("");
    setRows([]);
    setParseError("");
    setResults([]);
    setAnalysisResults([]);
    setAnalysisError("");
    setIngestionBatchId("");
    setIngestionBatchStatus("");
    window.localStorage.removeItem(INGESTION_BATCH_ID_KEY);
    window.localStorage.removeItem(INGESTION_ANALYSIS_REQUESTED_KEY);
    resumeAnalysisRequestedRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <DashboardLayout>
      <div className="page-header-shell mx-auto flex w-full max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Requirement workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Ingest requirements
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Add a CSV or JSON file, review the records, then import them into your
            RAVEN workspace.
          </p>
        </div>
        {fileName ? (
          <button
            type="button"
            onClick={clearSelection}
            disabled={isImporting || analysisBusy}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear file
          </button>
        ) : null}
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-7xl min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-5">
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
              disabled={isImporting || analysisBusy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void loadFile(file);
              }}
            />
            <button
              type="button"
              disabled={isImporting || analysisBusy}
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

          {rows.length > 0 || importedCount > 0 ? (
            <>
              {rows.length > 0 ? (
                <>
              <section
                aria-labelledby="review-heading"
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsReviewExpanded((expanded) => !expanded)}
                    aria-expanded={isReviewExpanded}
                    aria-controls="requirements-review-table"
                    className="group min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    <span className="flex items-center gap-2">
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isReviewExpanded ? "rotate-180" : ""}`}
                      />
                      <span
                        id="review-heading"
                        className="text-base font-semibold text-zinc-900 group-hover:text-accent dark:text-zinc-50"
                      >
                        2. Review before importing
                      </span>
                    </span>
                    <span className="mt-1 block pl-6 text-xs text-zinc-500 dark:text-zinc-400">
                      {fileName} · {rows.length} source rows · {isReviewExpanded ? "Hide requirements" : "Show requirements"}
                    </span>
                  </button>
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
                {isReviewExpanded ? <div id="requirements-review-table" className="max-h-80 overflow-auto">
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
                </div> : null}
              </section>

              <section
                aria-labelledby="import-heading"
                className="grid min-w-0 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
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
                      ? `Saving ${retryRows.length} requirements to the database…`
                      : failedCount > 0
                        ? `${failedCount} failed row${failedCount === 1 ? "" : "s"} can be retried.`
                        : importedCount > 0
                          ? `${importedCount} requirement${importedCount === 1 ? "" : "s"} ingested successfully.`
                          : `${retryRows.length} requirement${retryRows.length === 1 ? "" : "s"} will be created.`}
                  </p>
                </div>
                {!isImporting && (importedCount > 0 || failedCount > 0) && readyRows.length > 0 ? (
                  <div className="mt-4 min-w-0 sm:col-span-2" aria-live="polite">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <span>{isImporting ? "Import progress" : "Import complete"}</span>
                      <span className="tabular-nums">{importProgressPercent}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                      role="progressbar"
                      aria-label="Requirement import progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={importProgressPercent}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-300"
                        style={{ width: `${importProgressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {processedCount} of {readyRows.length} requirements processed
                    </p>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void importRequirements()}
                  disabled={retryRows.length === 0 || isImporting || analysisBusy}
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
                        ? "Complete"
                        : "Import requirements"}
                </button>
                {results.length > 0 && failedCount > 0 ? (
                  <div aria-live="polite" className="min-w-0 text-sm sm:col-span-2">
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
                    ) : null}
                  </div>
                ) : null}
              </section>
                </>
              ) : null}
              {importedCount > 0 && ingestionBatchStatus !== "COMPLETED" ? (
                <section
                  aria-labelledby="analysis-heading"
                  className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2
                        id="analysis-heading"
                        className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                      >
                        4. Analyze imported requirements
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        All requirements are saved before analysis starts. Start
                        analysis when you’re ready; progress is saved and can
                        be resumed after a refresh. Analysis runs in batches
                        of up to 10.
                      </p>
                    </div>
                    {ingestionBatchId &&
                      ingestionBatchStatus !== "PROCESSING" && (
                      <button
                        type="button"
                        onClick={() => void analyzeImportedRequirements()}
                        disabled={isAnalyzing || isImporting}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        {isAnalyzing ? (
                          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Microscope aria-hidden="true" className="h-4 w-4" />
                        )}
                        {isAnalyzing
                          ? "Analyzing…"
                          : ingestionBatchStatus === "PARTIAL"
                            ? "Retry failed analysis"
                            : "Analyze requirements"}
                      </button>
                    )}
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/60" aria-live="polite">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {isAnalyzing || ingestionBatchStatus === "PROCESSING"
                          ? "Analyzing requirements in batches…"
                          : ingestionBatchStatus === "PARTIAL"
                            ? "Analysis needs attention"
                            : "Ready to analyze"}
                      </p>
                      <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                        {analysisProcessedCount} of {importedCount} processed
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                      role="progressbar"
                      aria-label="Requirement analysis progress"
                      aria-valuemin={0}
                      aria-valuemax={importedCount}
                      aria-valuenow={analysisProcessedCount}
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-300 ${
                          analysisFailedCount > 0
                            ? "bg-amber-500"
                            : "bg-accent"
                        }`}
                        style={{ width: `${analysisProgressPercent}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        {analysisResults.filter(
                          (item) =>
                            item.status === "SUCCEEDED" ||
                            item.status === "ALREADY_ANALYZED",
                        ).length}{" "}
                        complete
                      </span>
                      {analysisFailedCount > 0 ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          {analysisFailedCount} need retry
                        </span>
                      ) : null}
                      {ingestionBatchStatus === "IMPORTED" ? (
                        <span>Progress is saved and can be resumed after a refresh.</span>
                      ) : null}
                    </div>
                  </div>
                  {analysisError ? (
                    <p className="whitespace-pre-line text-sm text-red-700 dark:text-red-300" role="alert">
                      {analysisError}
                    </p>
                  ) : null}
                  {analysisFailedCount > 0 ? (
                    <ul
                      className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                      aria-label="Analysis errors"
                    >
                      {analysisResults
                        .filter((result) => result.status === "FAILED")
                        .map((result) => (
                          <li key={result.requirement_id}>
                            {result.error ?? "An analysis failed. Retry to try again."}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                  {analysisResults.length > 0 ? (
                    <div className="space-y-4" aria-live="polite">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                          {analysisResults.filter(
                            (result) => result.status === "SUCCEEDED",
                          ).length}{" "}
                          analyzed
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {analysisResults.filter(
                            (result) => result.status === "ALREADY_ANALYZED",
                          ).length}{" "}
                          already analyzed
                        </span>
                        {analysisFailedCount > 0 ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-800 dark:bg-red-950 dark:text-red-200">
                            {analysisFailedCount} failed
                          </span>
                        ) : null}
                        {Object.entries(riskDistribution).map(([band, count]) => (
                          <span
                            key={band}
                            className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            {band}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setIsFormatsExpanded((expanded) => !expanded)}
              aria-expanded={isFormatsExpanded}
              aria-controls="accepted-formats"
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Accepted formats
                </span>
                <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  {isFormatsExpanded ? "Hide file guidance" : "CSV · JSON"}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isFormatsExpanded ? "rotate-180" : ""}`}
              />
            </button>
            {isFormatsExpanded ? <div id="accepted-formats" className="mt-4 space-y-4">
              <div className="flex gap-3">
                <FileUp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
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
            </div> : null}
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
