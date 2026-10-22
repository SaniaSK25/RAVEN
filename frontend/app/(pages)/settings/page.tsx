"use client";

import { useState } from "react";
import { Loader2, Save, AlertCircle, RefreshCw, HelpCircle } from "lucide-react";
import { backendFetch, type BackendPage, type BackendAssessmentRecord } from "@/lib/backend-api";

interface BandConfig {
  low_max: number;
  medium_max: number;
  low_rpn_max: number;
  medium_rpn_max: number;
  high_rpn_min: number;
  rules: Record<string, string>;
}

interface RecomputePreview {
  total: number;
  changed: number;
  unchanged: number;
  band_distribution: {
    before: Record<string, number>;
    after: Record<string, number>;
  };
  changes: Array<{ index: number; diff: Record<string, { before: unknown; after: unknown }> }>;
}

interface RecomputeApplyResponse {
  success: boolean;
  message: string;
  total: number;
  changed: number;
  unchanged: number;
  band_distribution: {
    before: Record<string, number>;
    after: Record<string, number>;
  };
  new_config_version: string | null;
}

const POINTS_MIN = 20;
const POINTS_MAX = 100;

export default function Settings() {
  const [config, setConfig] = useState<BandConfig | null>(null);
  const [preview, setPreview] = useState<RecomputePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bands" | "preview">("bands");

  // Form state
  const [formValues, setFormValues] = useState({ low_max: 45, medium_max: 67 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load current config on mount
  const loadConfig = async () => {
    try {
      setError(null);
      const data = await backendFetch<BandConfig>("config/bands");
      setConfig(data);
      setFormValues({ low_max: data.low_max, medium_max: data.medium_max });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load configuration");
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (formValues.low_max < POINTS_MIN || formValues.low_max > POINTS_MAX) {
      errors.low_max = `Must be between ${POINTS_MIN} and ${POINTS_MAX}`;
    }
    if (formValues.medium_max < POINTS_MIN || formValues.medium_max > POINTS_MAX) {
      errors.medium_max = `Must be between ${POINTS_MIN} and ${POINTS_MAX}`;
    }
    if (formValues.low_max >= formValues.medium_max) {
      errors.medium_max = "Medium max must be greater than Low max";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveConfig = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      const data = await backendFetch<BandConfig>("config/bands", {
        method: "POST",
        body: JSON.stringify(formValues),
      });
      setConfig(data);
      setSuccess("Band thresholds saved. Run 'Preview Recompute' to see impact.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) return;

    try {
      setPreviewing(true);
      setError(null);
      setPreview(null);
      const data = await backendFetch<RecomputePreview>("config/recompute/preview", {
        method: "POST",
        body: JSON.stringify({
          low_max: formValues.low_max,
          medium_max: formValues.medium_max,
          dry_run: true,
        }),
      });
      setPreview(data);
      setActiveTab("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview recompute");
    } finally {
      setPreviewing(false);
    }
  };

  const handleApply = async () => {
    if (!validateForm()) return;
    if (!preview || preview.changed === 0) {
      setError("No changes to apply. Run preview first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await backendFetch<RecomputeApplyResponse>("config/recompute/apply", {
        method: "POST",
        body: JSON.stringify({
          low_max: formValues.low_max,
          medium_max: formValues.medium_max,
          confirm: true,
        }),
      });
      if (data.success) {
        setSuccess(data.message);
        setConfig(null); // Force reload
        loadConfig();
        setPreview(null);
        setActiveTab("bands");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply recompute");
    } finally {
      setLoading(false);
    }
  };

  // Band label helper
  const getBandLabel = (band: string) => {
    switch (band?.toLowerCase()) {
      case "low":
        return "Low";
      case "medium":
        return "Medium";
      case "high":
        return "High";
      default:
        return band;
    }
  };

  // Band color helper
  const getBandColor = (band: string) => {
    switch (band?.toLowerCase()) {
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900";
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure risk engine thresholds and preview recompute impact.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{success}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-1 -mb-px" aria-label="Settings sections">
          <button
            type="button"
            onClick={() => setActiveTab("bands")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === "bands"
                ? "border-accent text-accent"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700"
            }`}
          >
            Band Thresholds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            disabled={!preview}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-accent text-accent"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700"
            } ${!preview ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Recompute Preview
          </button>
        </nav>
      </div>

      {/* Band Thresholds Tab */}
      {activeTab === "bands" && (
        <section className="space-y-6" aria-labelledby="bands-heading">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 id="bands-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              RPN Band Thresholds
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Configure the points thresholds that determine risk bands. Points = 12×Severity + 5×Probability + 3×Detectability (range 20–100).
              Display RPN = Points / 20 (range 1.0–5.0).
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Low Max */}
              <div>
                <label
                  htmlFor="low_max"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Low Band Max (points)
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="low_max"
                    type="number"
                    min={POINTS_MIN}
                    max={POINTS_MAX}
                    value={formValues.low_max}
                    onChange={(e) => setFormValues({ ...formValues, low_max: parseInt(e.target.value) || 0 })}
                    className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors ${
                      formErrors.low_max
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-accent focus:ring-accent"
                    } dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`}
                    aria-invalid={!!formErrors.low_max}
                    aria-describedby={formErrors.low_max ? "low_max_error" : undefined}
                  />
                  {formErrors.low_max && (
                    <p id="low_max_error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {formErrors.low_max}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Current RPN threshold: ≤ {config ? (config.low_max / 20).toFixed(2) : "—"}
                </p>
              </div>

              {/* Medium Max */}
              <div>
                <label
                  htmlFor="medium_max"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Medium Band Max (points)
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="medium_max"
                    type="number"
                    min={POINTS_MIN}
                    max={POINTS_MAX}
                    value={formValues.medium_max}
                    onChange={(e) => setFormValues({ ...formValues, medium_max: parseInt(e.target.value) || 0 })}
                    className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors ${
                      formErrors.medium_max
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-accent focus:ring-accent"
                    } dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`}
                    aria-invalid={!!formErrors.medium_max}
                    aria-describedby={formErrors.medium_max ? "medium_max_error" : undefined}
                  />
                  {formErrors.medium_max && (
                    <p id="medium_max_error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {formErrors.medium_max}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Current RPN threshold: ≤ {config ? (config.medium_max / 20).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {/* Current Rules Display */}
            {config && (
              <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Current Decision Rules
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex flex-wrap gap-2 items-baseline">
                    <dt className="font-medium text-zinc-700 dark:text-zinc-300">Low:</dt>
                    <dd className={`px-2 py-1 rounded text-xs font-medium ${getBandColor("low")}`}>
                      {config.rules.low}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-2 items-baseline">
                    <dt className="font-medium text-zinc-700 dark:text-zinc-300">Medium:</dt>
                    <dd className={`px-2 py-1 rounded text-xs font-medium ${getBandColor("medium")}`}>
                      {config.rules.medium}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-2 items-baseline">
                    <dt className="font-medium text-zinc-700 dark:text-zinc-300">High:</dt>
                    <dd className={`px-2 py-1 rounded text-xs font-medium ${getBandColor("high")}`}>
                      {config.rules.high}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-2 items-baseline">
                    <dt className="font-medium text-zinc-700 dark:text-zinc-300">Severity Floor:</dt>
                    <dd className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {config.rules.severity_floor}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Save className="h-4 w-4" />
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing || saving}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" />
                {previewing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Previewing…
                  </>
                ) : (
                  "Preview Recompute"
                )}
              </button>
            </div>
          </div>

          {/* Help / Info */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              <HelpCircle className="h-5 w-5 text-accent" />
              How Band Thresholds Work
            </h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                The risk engine computes a <strong>weighted points score</strong> from three 1–5 factors:
              </p>
              <p className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded dark:bg-zinc-800">
                Points = 12 × Severity + 5 × Probability + 3 × Detectability
              </p>
              <p>The points range is 20–100. The display RPN is Points / 20 (range 1.0–5.0).</p>
              <p>
                <strong>Severity dominates</strong> (weight 12/20 = 60%). A severity of 4 or 5
                contributes 48–60 points alone, making High band very likely.
              </p>
              <p>
                <strong>Severity Floor:</strong> If severity ≥ 4, the assurance level is forced to
                <code className="font-mono px-1.5 py-0.5 bg-zinc-100 rounded dark:bg-zinc-800">Scripted</code>
                regardless of the band. This rule cannot be changed from this page.
              </p>
              <p>
                Changing thresholds <strong>only affects future assessments and recomputes</strong>.
                Existing assessments keep their original band until you run a recompute.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Recompute Preview Tab */}
      {activeTab === "preview" && preview && (
        <section className="space-y-6" aria-labelledby="preview-heading">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 id="preview-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Recompute Preview
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Dry-run — no data will be modified
              </span>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Total Assessments
                </p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{preview.total}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Would Change
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{preview.changed}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Unchanged
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {preview.unchanged}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Change Rate
                </p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {preview.total > 0 ? ((preview.changed / preview.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Band Distribution Comparison */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Band Distribution — Before vs After
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-2 px-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Band
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Before
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-zinc-500 dark:text-zinc-400">
                        After
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-zinc-500 dark:text-zinc-400">
                        Delta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {["Low", "Medium", "High"].map((band) => {
                      const before = preview.band_distribution.before[band] || 0;
                      const after = preview.band_distribution.after[band] || 0;
                      const delta = after - before;
                      return (
                        <tr key={band} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBandColor(band)}`}>
                              {band}
                            </span>
                          </td>
                          <td className="text-right py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {before}
                          </td>
                          <td className="text-right py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {after}
                          </td>
                          <td className="text-right py-2 px-3 font-mono">
                            {delta > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">+{delta}</span>
                            ) : delta < 0 ? (
                              <span className="text-red-600 dark:text-red-400">{delta}</span>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Changes */}
            {preview.changes.length > 0 && (
              <details className="mt-6">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span>Show {preview.changes.length} detailed change(s)</span>
                </summary>
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {preview.changes.slice(0, 50).map((change, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Assessment index: {change.index}
                      </p>
                      <dl className="mt-2 space-y-1 text-xs">
                        {Object.entries(change.diff).map(([field, diff]) => (
                          <div key={field} className="flex gap-2">
                            <dt className="font-medium text-zinc-700 dark:text-zinc-300 w-24">
                              {field}:
                            </dt>
                            <dd className="text-red-600 dark:text-red-400 font-mono">
                              {JSON.stringify(diff.before)}
                            </dd>
                            <dd className="text-emerald-600 dark:text-emerald-400 font-mono">
                              → {JSON.stringify(diff.after)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                  {preview.changes.length > 50 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-2">
                      … and {preview.changes.length - 50} more changes
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* Apply Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Applying…
                  </>
                ) : (
                  "Apply Recompute"
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "preview" && !preview && (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <RefreshCw className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No Preview Available
          </h3>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Go to the <strong>Band Thresholds</strong> tab, adjust values, and click
            <strong>Preview Recompute</strong> to see the impact.
          </p>
        </div>
      )}
    </div>
  );
}