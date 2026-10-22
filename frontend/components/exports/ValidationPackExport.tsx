/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { backendFetch } from "@/lib/backend-api";
import {
  downloadBlob,
  fetchValidationDataset,
  generateValidationPackZip,
  type ExportDataset,
} from "@/lib/export-utils";
import {
  filterRequirementSummaries,
  requirementListKey,
  requirementSelectionKey,
  requirementVersionLabel,
  type RequirementSummary,
} from "@/lib/requirement-search";

type RequirementPage = { items: RequirementSummary[] };

export default function ValidationPackExport() {
  const [requirements, setRequirements] = useState<RequirementSummary[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [dataset, setDataset] = useState<ExportDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const selectedRef = useRef<string[]>([]);
  const requestRef = useRef(0);

  const reloadRequirements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await backendFetch<RequirementPage>("requirements?limit=500");
      setRequirements(Array.isArray(page.items) ? page.items : []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Requirements could not be retrieved from the backend.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadRequirements();
  }, [reloadRequirements]);

  const loadSelection = useCallback(async (keys: string[]) => {
    const unique = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
    selectedRef.current = unique;
    setSelected(unique);
    setDataset(null);
    setError("");
    const request = requestRef.current + 1;
    requestRef.current = request;
    if (!unique.length) {
      setLoadingDataset(false);
      return;
    }
    setLoadingDataset(true);
    try {
      const next = await fetchValidationDataset(unique);
      if (requestRef.current !== request) return;
      if (next.requirements.length !== unique.length) {
        throw new Error(
          `The backend returned ${next.requirements.length} of ${unique.length} selected requirements. No export was generated.`,
        );
      }
      setDataset(next);
    } catch (cause) {
      if (requestRef.current !== request) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "The selected records could not be retrieved. No export was generated.",
      );
    } finally {
      if (requestRef.current === request) setLoadingDataset(false);
    }
  }, []);

  const filtered = useMemo(
    () => filterRequirementSummaries(requirements, search),
    [requirements, search],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const filteredKeys = useMemo(
    () => filtered.map(requirementSelectionKey),
    [filtered],
  );
  const allFilteredSelected =
    filteredKeys.length > 0 && filteredKeys.every((key) => selectedSet.has(key));

  const toggleRequirement = (key: string, checked: boolean) => {
    if (busy) return;
    const next = checked
      ? [...selectedRef.current, key]
      : selectedRef.current.filter((item) => item !== key);
    void loadSelection(next);
  };

  const selectAllFiltered = () => {
    if (busy || !filteredKeys.length) return;
    void loadSelection([...new Set([...selectedRef.current, ...filteredKeys])]);
  };

  const clearSelection = () => {
    if (busy) return;
    void loadSelection([]);
  };

  const clearSearch = () => setSearch("");

  const exportPack = async () => {
    if (busy || loadingDataset || !selectedRef.current.length) return;
    setBusy(true);
    setError("");
    try {
      // Re-read the selected records immediately before generation. A PDF is
      // never produced from a stale or partially loaded selection.
      const fresh = await fetchValidationDataset(selectedRef.current);
      if (fresh.requirements.length !== selectedRef.current.length) {
        throw new Error(
          "The selected requirement set changed while loading. No export was generated.",
        );
      }
      setDataset(fresh);
      const zip = await generateValidationPackZip(fresh);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const pack = fresh.pack_reference ? `${fresh.pack_reference}_` : "";
      downloadBlob(zip, `RAVEN_Validation_Pack_${pack}${stamp}.zip`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The validation pack could not be generated. No successful export was recorded.",
      );
    } finally {
      setBusy(false);
    }
  };

  const selectedSummary = dataset
    ? `${dataset.requirements.length} requirement(s) loaded · ${dataset.requirements.reduce(
        (count, item) => count + item.risks.length,
        0,
      )} risk assessment(s) · ${dataset.requirements.reduce(
        (count, item) => count + item.assurance.length,
        0,
      )} assurance decision(s) · ${dataset.requirements.reduce(
        (count, item) => count + item.tests.length,
        0,
      )} test script(s)`
    : loadingDataset
      ? "Retrieving the selected records..."
      : selected.length
        ? "Selection not loaded yet."
        : "No requirements selected.";

  const exportDisabled =
    busy || loadingDataset || !dataset || selected.length === 0;

  return (
    <div className="space-y-6">
      <section className="sticky top-4 z-20 rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Validation Pack Export
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Build an audit-ready pack
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Select one or more requirements. The pack is generated only after
              the selected records load successfully.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              disabled={busy || !filteredKeys.length || allFilteredSelected}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Select all filtered
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={busy || selected.length === 0}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => void exportPack()}
              disabled={exportDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Download aria-hidden="true" className="h-4 w-4" />
              )}
              {busy ? "Generating PDFs and ZIP..." : "Generate Validation Pack"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search requirements by ID or title"
              placeholder="Search requirements by ID or title"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-9 pr-9 text-sm text-zinc-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear requirement search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
          <p
            aria-live="polite"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            Selected: <strong>{selected.length}</strong> requirement
            {selected.length === 1 ? "" : "s"}
            {search ? ` · Showing ${filtered.length} of ${requirements.length}` : ""}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{selectedSummary}</span>
          {dataset && (
            <span>
              Compliance:{" "}
              {dataset.compliance_evaluated
                ? "persisted records available"
                : "not evaluated"} · Test execution: not recorded
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          >
            <X aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">The export was not completed</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() =>
                  selectedRef.current.length
                    ? void loadSelection(selectedRef.current)
                    : void reloadRequirements()
                }
                className="mt-2 inline-flex items-center gap-1 font-semibold underline"
              >
                <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Requirements
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {requirements.length} available · {selected.length} selected
              {search ? ` · ${filtered.length} matching` : ""}
            </p>
          </div>
          {search && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!allFilteredSelected) selectAllFiltered();
              }}
              disabled={busy || allFilteredSelected}
              className="text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {allFilteredSelected ? "All filtered selected" : "Select all filtered"}
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Loading requirements...
          </p>
        ) : !requirements.length ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            <p>No requirements are available from the backend.</p>
            <button
              type="button"
              onClick={() => void reloadRequirements()}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            <p>No requirements match “{search}”.</p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-2 font-semibold text-accent hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="max-h-[32rem] space-y-2 overflow-auto p-4">
            {filtered.map((requirement) => {
              const key = requirementSelectionKey(requirement);
              const checked = selectedSet.has(key);
              return (
                <label
                  key={requirement.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    checked
                      ? "border-blue-300 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-zinc-200 hover:border-blue-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-blue-900 dark:hover:bg-zinc-900"
                  } ${busy ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-accent bg-accent text-white"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                    }`}
                  >
                    {checked && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                  </span>
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(event) =>
                      toggleRequirement(key, event.target.checked)
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <b className="text-zinc-900 dark:text-zinc-50">
                        {requirementListKey(requirement)}
                      </b>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {requirementVersionLabel(requirement)} ·{" "}
                        {requirement.status}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-300">
                      {requirement.title || requirement.description || "Untitled requirement"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
