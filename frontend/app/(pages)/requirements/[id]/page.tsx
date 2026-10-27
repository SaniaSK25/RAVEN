"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ChevronDown, FileText, LoaderCircle, Play, Archive, CheckCircle, ClipboardList } from "lucide-react";
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

function formatScriptLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n(?=\s*(?:[-•]|\d+[.)])\s+)/)
    .map((line) => line.trim().replace(/^(?:[-•]|\d+[.)])\s+/, ""))
    .filter(Boolean);
}

function ScriptBlock({ script }: { script: string }) {
  const sections = splitScript(script);
  const [showPreconditions, setShowPreconditions] = useState(false);
  const steps = formatScriptLines(sections?.steps ?? script);

  function StepList({ items }: { items: string[] }) {
    if (items.length === 0) {
      return <p className="text-sm text-zinc-500 dark:text-zinc-400">No test steps were recorded.</p>;
    }
    return (
      <ol className="space-y-3" aria-label="Test steps">
        {items.map((step, index) => (
          <li
            key={`${index}-${step}`}
            className="flex gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-accent dark:bg-orange-950/40 dark:text-orange-300">
              {index + 1}
            </span>
            <p className="min-w-0 pt-0.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              {step}
            </p>
          </li>
        ))}
      </ol>
    );
  }

  if (!sections) {
    return (
      <div className="mt-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
          <ClipboardList aria-hidden="true" className="h-4 w-4 text-accent" />
          Test steps
        </div>
        <StepList items={steps} />
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-5">
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowPreconditions((visible) => !visible)}
          aria-expanded={showPreconditions}
          className="flex w-full items-center justify-between gap-3 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span>
            <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Preconditions
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
              {showPreconditions ? "Hide setup requirements" : "Show setup requirements before running this test"}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${showPreconditions ? "rotate-180" : ""}`}
          />
        </button>
        {showPreconditions ? (
          <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <ul className="space-y-2.5 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              {formatScriptLines(sections.preconditions).map((condition, index) => (
                <li key={`${index}-${condition}`} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
          <ClipboardList aria-hidden="true" className="h-4 w-4 text-accent" />
          Test steps
          <span className="ml-auto normal-case tracking-normal text-zinc-400">
            {steps.length} {steps.length === 1 ? "step" : "steps"}
          </span>
        </div>
        <StepList items={steps} />
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
  const [analysisError, setAnalysisError] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
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
      const updated = await backendFetch<BackendRequirementDetail>(
        `requirements/${encodeURIComponent(id)}`,
      );
      setRequirement(updated);
      setLoadedFor(id);
      setAnalysisMessage("Risk and assurance analysis completed.");
    } catch (cause) {
      setAnalysisError(
        cause instanceof Error ? cause.message : "The analysis could not be completed.",
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

  const hasGeneratedScript = requirement?.tests?.some(
    (test) => test.origin === "generated" && test.freshness !== "superseded",
  ) ?? false;
  const canGenerateScript =
    String(requirement?.assurance?.level ?? "").toLowerCase() === "scripted" &&
    !hasGeneratedScript;
  const needsAnalysis = Boolean(
    requirement &&
      (!requirement.risk ||
        !requirement.assurance ||
        String(requirement.risk.freshness ?? "").toLowerCase() !== "fresh" ||
        String(requirement.assurance.freshness ?? "").toLowerCase() !== "fresh"),
  );

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
            {needsAnalysis ? (
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
            ) : null}
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
              {requirement.tests?.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {requirement.tests?.map((test) => (
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
                    disabled={isGeneratingScript}
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

          {requirement.tests?.some(
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
                ?.filter(
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
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Version history</h2>
            {requirement.versions?.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {requirement.versions?.map((version) => (
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
