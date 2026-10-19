"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RequirementSearch from "@/components/requirements/RequirementSearch";
import {
  backendFetch,
  type BackendChangeEvent,
  type BackendPage,
  type BackendRequirement,
} from "@/lib/backend-api";

interface ChangeMutationResult {
  status: string;
  requirement_id: string;
  event_id?: string;
  impact: Record<string, unknown>;
}

function impactEntries(
  impact: Record<string, unknown>,
): Array<{ kind: string; ids: string[] }> {
  return Object.entries(impact)
    .filter(([, ids]) => Array.isArray(ids) && ids.length > 0)
    .map(([kind, ids]) => ({
      kind,
      ids: (ids as unknown[]).map(String),
    }));
}

function impactLabel(kind: string): string {
  const labels: Record<string, string> = {
    risks: "Risks",
    assessments: "Risk assessments",
    decisions: "Assurance decisions",
    tests: "Test scripts",
    links: "Trace links",
  };
  return labels[kind] ?? kind.replaceAll("_", " ");
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export default function ChangesPage() {
  const [changes, setChanges] = useState<BackendChangeEvent[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<BackendRequirement[]>([]);
  const [requirementsError, setRequirementsError] = useState("");
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [changeMode, setChangeMode] = useState<"edit" | "delete">("edit");
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [draftText, setDraftText] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadChanges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setChanges(await backendFetch<BackendChangeEvent[]>("changes"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load change events.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequirements = useCallback(async () => {
    setRequirementsLoading(true);
    setRequirementsError("");
    try {
      const result = await backendFetch<BackendPage<BackendRequirement>>(
        "requirements?limit=500",
      );
      setRequirements(
        result.items.filter((requirement) => requirement.status !== "RETIRED"),
      );
    } catch (cause) {
      setRequirementsError(
        cause instanceof Error ? cause.message : "Could not load requirements.",
      );
    } finally {
      setRequirementsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    backendFetch<BackendChangeEvent[]>("changes")
      .then((result) => {
        if (active) setChanges(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load change events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    backendFetch<BackendPage<BackendRequirement>>("requirements?limit=500")
      .then((result) => {
        if (active) {
          setRequirements(
            result.items.filter((requirement) => requirement.status !== "RETIRED"),
          );
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setRequirementsError(
            cause instanceof Error ? cause.message : "Could not load requirements.",
          );
        }
      })
      .finally(() => {
        if (active) setRequirementsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedRequirement = requirements.find(
    (requirement) => requirement.id === selectedRequirementId,
  );
  const hasTextChanges =
    selectedRequirement !== undefined && draftText !== selectedRequirement.description;

  function openEditor() {
    setIsEditorOpen(true);
    setActionError("");
    setActionMessage("");
    setDeleteConfirmed(false);
    if (!selectedRequirementId && requirements.length > 0) {
      const firstRequirement = requirements[0];
      setSelectedRequirementId(firstRequirement.id);
      setDraftText(firstRequirement.description);
    }
  }

  function selectRequirement(requirementId: string) {
    const requirement = requirements.find((item) => item.id === requirementId);
    setSelectedRequirementId(requirementId);
    setDraftText(requirement?.description ?? "");
    setDeleteConfirmed(false);
    setActionError("");
  }

  async function refreshBackendRecords() {
    await Promise.all([loadChanges(), loadRequirements()]);
  }

  async function saveRequirementChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequirement || !hasTextChanges) return;

    setIsSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      const result = await backendFetch<ChangeMutationResult>(
        `requirements/${encodeURIComponent(selectedRequirement.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            text: draftText,
            edited_by: "changes-ui",
          }),
        },
      );
      setActionMessage(
        result.status === "changed"
          ? `${selectedRequirement.req_key ?? "Requirement"} updated as version ${
              selectedRequirement.version + 1
            }. The backend recorded the affected artifacts below.`
          : "No changes were saved because the requirement description is unchanged.",
      );
      await refreshBackendRecords();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "The requirement could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function retireRequirement() {
    if (!selectedRequirement || !deleteConfirmed) return;

    setIsSaving(true);
    setActionError("");
    setActionMessage("");
    try {
    await backendFetch<ChangeMutationResult>(
      `requirements/${encodeURIComponent(selectedRequirement.id)}`,
      { method: "DELETE" },
    );
    setActionMessage(
      `${selectedRequirement.req_key ?? "Requirement"} was retired. Its affected artifacts are recorded below.`,
    );
    setSelectedRequirementId("");
    setDraftText("");
    setDeleteConfirmed(false);
    await refreshBackendRecords();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "The requirement could not be retired.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const visible = changes.filter((change) =>
    `${change.requirement_key ?? ""} ${change.current_text ?? ""} ${change.kind} ${change.status}`
    .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="page-header-shell flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Backend records</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">Changes</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Edit or retire a requirement and review exactly which linked artifacts become stale.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (isEditorOpen ? setIsEditorOpen(false) : openEditor())}
          aria-expanded={isEditorOpen}
          aria-controls="change-editor"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {isEditorOpen ? (
            <><X aria-hidden="true" className="h-4 w-4" />Close</>
          ) : (
            <><Plus aria-hidden="true" className="h-4 w-4" />Make a change</>
          )}
        </button>
      </div>

      {isEditorOpen ? (
        <section
          id="change-editor"
          aria-labelledby="change-editor-title"
          className="page-panel mt-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="change-editor-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Start a requirement change
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Changes are saved to the backend and their impact is calculated from existing trace links.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => {
                  setChangeMode("edit");
                  setDeleteConfirmed(false);
                  setActionError("");
                }}
                aria-pressed={changeMode === "edit"}
                className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                  changeMode === "edit"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />Edit text
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangeMode("delete");
                  setDeleteConfirmed(false);
                  setActionError("");
                }}
                aria-pressed={changeMode === "delete"}
                className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                  changeMode === "delete"
                    ? "bg-white text-red-700 shadow-sm dark:bg-zinc-800 dark:text-red-300"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />Retire
              </button>
            </div>
          </div>

          {requirementsLoading ? (
            <div role="status" className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              Loading requirements…
            </div>
          ) : requirementsError ? (
            <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <p>{requirementsError}</p>
              <button
                type="button"
                onClick={() => void loadRequirements()}
                className="mt-2 inline-flex items-center gap-2 font-semibold underline underline-offset-2"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />Retry
              </button>
            </div>
          ) : requirements.length === 0 ? (
            <p className="mt-5 rounded-md bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              There are no active requirements to change. Add a requirement through Ingestion first.
            </p>
          ) : (
            <form onSubmit={(event) => void saveRequirementChange(event)} className="mt-5 space-y-4">
              <div>
                <label htmlFor="change-requirement" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Requirement
                </label>
                <select
                  id="change-requirement"
                  value={selectedRequirementId}
                  onChange={(event) => selectRequirement(event.target.value)}
                  disabled={isSaving}
                  className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="" disabled>Select a requirement</option>
                  {requirements.map((requirement) => (
                    <option key={requirement.id} value={requirement.id}>
                      {requirement.req_key ? `${requirement.req_key} — ` : ""}
                      {requirement.description} (v{requirement.version})
                    </option>
                  ))}
                </select>
              </div>

              {changeMode === "edit" ? (
                <>
                  <div>
                    <label htmlFor="change-requirement-text" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Updated requirement text
                    </label>
                    <textarea
                      id="change-requirement-text"
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      disabled={!selectedRequirement || isSaving}
                      required
                      rows={6}
                      className="w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Saving creates a new requirement version. Linked risks, decisions, test scripts, and trace links are marked stale when impacted.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/traceability?requirement=${encodeURIComponent(
                        selectedRequirement?.req_key ?? selectedRequirement?.id ?? "",
                      )}&view=graph`}
                      className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                    >
                      View traceability matrix
                    </Link>
                    <button
                      type="submit"
                      disabled={!selectedRequirement || !hasTextChanges || !draftText.trim() || isSaving}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                    >
                      {isSaving ? (
                        <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Saving…</>
                      ) : (
                        <><Save aria-hidden="true" className="h-4 w-4" />Save change</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    <p className="font-semibold">Retire this requirement?</p>
                    <p className="mt-1">
                      Retirement is a soft delete: the record remains in history, a change event is created, and linked artifacts may become stale.
                    </p>
                  </div>
                  <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(event) => setDeleteConfirmed(event.target.checked)}
                      disabled={!selectedRequirement || isSaving}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    />
                    I understand this retires the requirement and cannot be undone here.
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/traceability?requirement=${encodeURIComponent(
                        selectedRequirement?.req_key ?? selectedRequirement?.id ?? "",
                      )}&view=graph`}
                      className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                    >
                      View traceability matrix
                    </Link>
                    <button
                      type="button"
                      onClick={() => void retireRequirement()}
                      disabled={!selectedRequirement || !deleteConfirmed || isSaving}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
                    >
                      {isSaving ? (
                        <><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Retiring…</>
                      ) : (
                        <><Trash2 aria-hidden="true" className="h-4 w-4" />Retire requirement</>
                      )}
                    </button>
                  </div>
                </>
              )}

              {actionError ? (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {actionError}
                </p>
              ) : null}
            </form>
          )}

          {actionMessage ? (
            <div role="status" className="mt-5 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{actionMessage}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Search change events" className="page-panel mt-6">
        <RequirementSearch value={query} onChange={setQuery} />
      </section>
      <section aria-label="Change events" className="mt-4 space-y-3">
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-14 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />Loading change events…</div>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-600" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">Could not load change events</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
            <button type="button" onClick={() => void loadChanges()} className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"><RefreshCw aria-hidden="true" className="h-4 w-4" />Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <History aria-hidden="true" className="h-6 w-6 text-zinc-400" />
            <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">{changes.length ? "No changes match" : "No backend change events"}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{changes.length ? "Try another requirement key or event status." : "Events are recorded when an existing requirement is edited or retired."}</p>
          </div>
        ) : visible.map((change) => {
          const impactedArtifacts = impactEntries(change.impact);
          return (
            <article key={change.id} className="page-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {change.requirement_key ? (
                    <Link href={`/requirements/${encodeURIComponent(change.requirement_key)}`} className="font-mono text-xs font-semibold text-accent hover:underline">{change.requirement_key}</Link>
                  ) : <span className="font-mono text-xs text-zinc-500">{change.requirement_id}</span>}
                  <h2 className="mt-1 max-w-4xl whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-zinc-900 dark:text-zinc-50">{change.current_text ?? "Requirement change"}</h2>
                </div>
                <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium capitalize text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">{statusLabel(change.status)}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>Action: {change.kind}</span>
                {change.current_version ? <span>Current version: v{change.current_version}</span> : null}
                <span>{change.created_at ? `· ${new Date(change.created_at).toLocaleString()}` : "· Date unavailable"}</span>
                <span>Recorded by: {change.created_by}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Exact impact recorded by backend</p>
                {impactedArtifacts.length ? (
                  <div className="mt-2 space-y-2">
                    {impactedArtifacts.map(({ kind, ids }) => (
                      <details key={kind} className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-amber-950 marker:text-amber-700 dark:text-amber-100 dark:marker:text-amber-300">
                          {impactLabel(kind)} · {ids.length} affected
                        </summary>
                        <ul className="space-y-1 border-t border-amber-200 px-3 py-2 dark:border-amber-900">
                          {ids.map((id) => (
                            <li key={id} className="break-all font-mono text-xs text-amber-900 dark:text-amber-200">
                              {id}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                ) : <p className="mt-1 text-xs text-zinc-500">No fresh linked risks, assessments, assurance decisions, tests, or trace links were eligible for stale marking when this change was made.</p>}
              </div>
              <Link
                href={`/traceability?requirement=${encodeURIComponent(
                  change.requirement_key ?? change.requirement_id,
                )}&view=graph`}
                className="mt-3 inline-flex text-xs font-medium text-accent underline-offset-2 hover:underline"
              >
                Open traceability matrix
              </Link>
              {change.resolution_note ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Resolution note: {change.resolution_note}</p> : null}
            </article>
          );
        })}
      </section>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Live change-event records. Use “Make a change” to edit or retire an active requirement; use the traceability matrix to review its linked artifacts.
      </p>
    </DashboardLayout>
  );
}
