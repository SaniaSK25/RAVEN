"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, FileText, LoaderCircle, Play, Archive, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  backendFetch,
  type BackendRequirementDetail,
} from "@/lib/backend-api";
import { fetchValidationDataset, generateValidationPackZip, downloadBlob } from "@/lib/export-utils";

const PRECONDITIONS_HEADER = "Preconditions:";
const STEPS_HEADER = "Test Steps:";

function splitScript(script: string): { preconditions: string; steps: string } | null {
  const preIndex = script.indexOf(PRECONDITIONS_HEADER);
  const stepsIndex = script.indexOf(STEPS_HEADER);
  if (preIndex < 0 || stepsIndex < 0 || stepsIndex < preIndex) return null;
  return {
    preconditions: script.slice(preIndex + PRECONDITIONS_HEADER.length, stepsIndex).trim(),
    steps: script.slice(stepsIndex + STEPS_HEADER.length).trim(),
  };
}

function ScriptBlock({ script }: { script: string }) {
  const sections = splitScript(script);
  if (!sections) {
    return (
      <pre className="mt-3 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {script}
      </pre>
    );
  }
  return (
    <div className="mt-3 space-y-4">
      <div>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400">
          Preconditions
        </h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {sections.preconditions}
        </pre>
      </div>
      <div>
        <h3 className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400">
          Test Steps
        </h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {sections.steps}
        </pre>
      </div>
    </div>
  );
}

export default function RequirementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [requirement, setRequirement] =
    useState<BackendRequirementDetail | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedFor, setLoadedFor] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [scriptError, setScriptError] = useState("");
  const [scriptMessage, setScriptMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  useEffect(() => {
    let active = true;
    backendFetch<BackendRequirementDetail>(
      `requirements/${encodeURIComponent(id)}`,
    )
      .then((data) => {
        if (active) {
          setRequirement(data);
          setLoadedFor(id);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            {
              id,
              message:
                cause instanceof Error
                  ? cause.message
                  : "Could not load this requirement.",
            },
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (loadedFor !== id) return;

    const tab = new URLSearchParams(window.location.search).get("tab");
    const targetId = window.location.hash.slice(1) ||
      (tab === "risk" || tab === "assurance" || tab === "tests" ? tab : "");
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    }
  }, [id, loadedFor]);

  async function runAnalysis() {
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisMessage("");
    try {
      await backendFetch<unknown>(
        `assessments/${encodeURIComponent(id)}/run`,
        { method: "POST" },
      );
    } catch (cause) {
      setAnalysisError(
        cause instanceof Error ? cause.message : "The analysis could not be completed.",
      );
      setIsAnalyzing(false);
      return;
    }

    try {
      const updated = await backendFetch<BackendRequirementDetail>(
        `requirements/${encodeURIComponent(id)}`,
      );
      setRequirement(updated);
      setLoadedFor(id);
      setAnalysisMessage("Analysis finished. The persisted results are up to date.");
    } catch (cause) {
      setAnalysisError(
        `Analysis finished, but saved results could not be reloaded: ${
          cause instanceof Error ? cause.message : "unknown refresh error"
        }`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateScript() {
    setIsGeneratingScript(true);
    setScriptError("");
    setScriptMessage("");
    try {
      await backendFetch<unknown>(
        `assessments/${encodeURIComponent(id)}/generate-script`,
        { method: "POST" },
      );
      const updated = await backendFetch<BackendRequirementDetail>(
        `requirements/${encodeURIComponent(id)}`,
      );
      setRequirement(updated);
      setLoadedFor(id);
      setScriptMessage("Test script generated and saved for this requirement version.");
    } catch (cause) {
      setScriptError(
        cause instanceof Error ? cause.message : "The test script could not be generated.",
      );
    } finally {
      setIsGeneratingScript(false);
    }
  }

  async function exportValidationPack() {
    setIsExporting(true);
    setExportError("");
    setExportSuccess("");

    try {
      const dataset = await fetchValidationDataset([id]);
      const zipBlob = await generateValidationPackZip(dataset);

      // Download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const selected = dataset.requirements[0];
      const label =
        selected?.display_key ||
        selected?.req_key ||
        dataset.pack_reference ||
        "validation-pack";
      const filename = `RAVEN_Validation_Pack_${label}_${timestamp}.zip`;
      downloadBlob(zipBlob, filename);

      setExportSuccess(`Validation pack generated for ${label}.`);
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(
        err instanceof Error
          ? `Failed to generate validation pack: ${err.message}`
          : "Failed to generate validation pack. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  const hasGeneratedScript = requirement?.tests.some(
    (test) => test.origin === "generated" && test.freshness !== "superseded",
  ) ?? false;
  const canGenerateScript =
    requirement?.assurance?.level.toLowerCase() === "scripted" &&
    !hasGeneratedScript;

  return (
    <DashboardLayout>
      <Link
        href="/requirements"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-300 dark:hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Requirements
      </Link>

      {exportSuccess && (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {error?.id === id ? (
        <section role="alert" className="mt-6 rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Requirement could not be loaded
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{error.message}</p>
        </section>
      ) : loading || loadedFor !== id ? (
        <div role="status" className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          Loading requirement…
        </div>
      ) : requirement ? (
        <>
          <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-sm text-zinc-500">
                {requirement.req_key ?? requirement.id}
                {requirement.version ? ` · v${requirement.version}` : ""}
              </p>
              <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {requirement.description}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => void runAnalysis()}
              disabled={isAnalyzing || !requirement.current_version_id}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
            >
              {isAnalyzing ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Play aria-hidden="true" className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing…" : "Run risk & assurance analysis"}
            </button>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void exportValidationPack()}
              disabled={isExporting}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {isExporting ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              {isExporting ? "Exporting…" : "Export validation pack"}
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              ZIP with Risk Assessment, Assurance Rationale, Test Scripts, Gap Report, Traceability Matrix
            </span>
          </div>

          {isAnalyzing ? (
            <p role="status" className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Running evidence extraction and analysis for the current requirement version. This may take some time; keep this page open.
            </p>
          ) : null}
          {analysisMessage ? (
            <p role="status" className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">
              {analysisMessage}
            </p>
          ) : null}
          {analysisError ? (
            <section role="alert" className="mt-4 rounded-lg border border-red-200 bg-white p-4 dark:border-red-900 dark:bg-zinc-950">
              <p className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
                <AlertCircle aria-hidden="true" className="h-4 w-4" />
                Analysis could not be completed
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{analysisError}</p>
            </section>
          ) : null}

          <section className="page-panel mt-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Current requirement text
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {requirement.text || requirement.description}
            </p>
          </section>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <section id="risk" className="page-panel scroll-mt-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Risk</h2>
              {requirement.risk ? (
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-zinc-500">Band</dt><dd>{requirement.risk.band}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-zinc-500">RPN</dt><dd>{requirement.risk.rpn}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-zinc-500">Freshness</dt><dd>{requirement.risk.freshness}</dd></div>
                </dl>
              ) : <p className="mt-2 text-sm text-zinc-500">No persisted risk assessment.</p>}
            </section>
            <section id="assurance" className="page-panel scroll-mt-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Assurance</h2>
              {requirement.assurance ? (
                <>
                  <p className="mt-2 text-sm capitalize text-zinc-700 dark:text-zinc-200">{requirement.assurance.level}</p>
                  <p className="mt-1 text-xs text-zinc-500">{requirement.assurance.reason_code} · {requirement.assurance.freshness}</p>
                  <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">{requirement.assurance.label}</p>
                </>
              ) : <p className="mt-2 text-sm text-zinc-500">No persisted assurance decision.</p>}
            </section>
            <section id="tests" className="page-panel scroll-mt-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Current-version tests</h2>
              {requirement.tests.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {requirement.tests.map((test) => (
                    <li id={`test-${test.id}`} key={test.id} className="scroll-mt-6">
                      <span className="font-medium">{test.title ?? test.external_code ?? "Test script"}</span>
                      <span className="block text-xs text-zinc-500">{test.origin} · {test.freshness}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-zinc-500">No persisted tests for this version.</p>}
              {canGenerateScript ? (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Scripted assurance requires a test script. Generate one when you are ready.
                  </p>
                  <button
                    type="button"
                    onClick={() => void generateScript()}
                    disabled={isGeneratingScript || isAnalyzing}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                  >
                    {isGeneratingScript ? (
                      <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText aria-hidden="true" className="h-4 w-4" />
                    )}
                    {isGeneratingScript ? "Generating script…" : "Generate test script"}
                  </button>
                </div>
              ) : null}
              {isGeneratingScript ? (
                <p role="status" className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Generating and saving a script from the current requirement text.
                </p>
              ) : null}
              {scriptMessage ? (
                <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {scriptMessage}
                </p>
              ) : null}
              {scriptError ? (
                <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                  {scriptError}
                </p>
              ) : null}
            </section>
          </div>

          {requirement.tests.some(
            (test) =>
              test.origin === "generated" &&
              test.freshness !== "superseded" &&
              test.script,
          ) ? (
            <section className="page-panel mt-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Generated test script
              </h2>
              {requirement.tests
                .filter(
                  (test) =>
                    test.origin === "generated" &&
                    test.freshness !== "superseded" &&
                    test.script,
                )
                .map((test) => (
                  <ScriptBlock key={test.id} script={test.script ?? ""} />
                ))}
            </section>
          ) : null}

          <section className="page-panel mt-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              AI token usage for v{requirement.version}
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Total tokens</dt>
                <dd className="mt-1 font-medium">
                  {requirement.token_usage.total_tokens.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Input tokens</dt>
                <dd className="mt-1 font-medium">
                  {requirement.token_usage.input_tokens.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Output tokens</dt>
                <dd className="mt-1 font-medium">
                  {requirement.token_usage.output_tokens.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Analysis runs</dt>
                <dd className="mt-1 font-medium">
                  {requirement.token_usage.run_count.toLocaleString()}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Totals include recorded evidence-extraction and test-script-generation calls across successful and failed runs.
            </p>
          </section>

          <section className="page-panel mt-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Version history</h2>
            {requirement.versions.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {requirement.versions.map((version) => (
                  <li key={version.version} className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
                    <p className="text-sm font-medium">v{version.version}{version.is_current ? " · Current" : ""}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{version.text}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-zinc-500">No version history is available.</p>}
          </section>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Analysis uses the configured backend pipeline and saves results against the current requirement version.
          </p>
        </>
      ) : null}
    </DashboardLayout>
  );
}
