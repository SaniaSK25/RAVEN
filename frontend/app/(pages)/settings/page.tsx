"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  HelpCircle,
  Loader2,
  RefreshCw,
  Save,
  Scale,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { backendFetch } from "@/lib/backend-api";

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
/** Highest value the Medium cutoff may reach (points). */
const MEDIUM_CEILING = 80;
/** Narrowest Medium band the UI allows (points); a floor keeps every band meaningful. */
const MIN_BAND_GAP = 10;

/** Points → display RPN (points ÷ 20). */
const toRpn = (points: number) => (points / 20).toFixed(2);

export default function Settings() {
  const [config, setConfig] = useState<BandConfig | null>(null);
  const [preview, setPreview] = useState<RecomputePreview | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bands" | "preview">("bands");
  const [showExplainer, setShowExplainer] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  // Form state
  const [formValues, setFormValues] = useState({ low_max: 45, medium_max: 67 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [exampleScores, setExampleScores] = useState({
    severity: 3,
    probability: 3,
    detectability: 3,
  });

  const loadConfig = useCallback(async () => {
    try {
      const data = await backendFetch<BandConfig>("config/bands");
      setError(null);
      setConfig(data);
      setFormValues({ low_max: data.low_max, medium_max: data.medium_max });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load configuration");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    backendFetch<BandConfig>("config/bands")
      .then((data) => {
        if (!mounted) return;
        setConfig(data);
        setFormValues({ low_max: data.low_max, medium_max: data.medium_max });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load configuration");
      })
      .finally(() => {
        if (mounted) setConfigLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const examplePoints =
    12 * exampleScores.severity +
    5 * exampleScores.probability +
    3 * exampleScores.detectability;
  const exampleBand =
    examplePoints <= formValues.low_max
      ? "Low"
      : examplePoints <= formValues.medium_max
        ? "Medium"
        : "High";
  const exampleAssurance =
    exampleScores.severity === 5
      ? "Scripted — severity 5 floor"
      : exampleBand === "High"
        ? "Scripted"
        : exampleBand === "Medium"
          ? "Exploratory"
          : "Unscripted";

  const updateThresholds = (nextValues: typeof formValues) => {
    setFormValues(nextValues);
    setFormErrors({});
    setPreview(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (formValues.low_max < POINTS_MIN || formValues.low_max > MEDIUM_CEILING) {
      errors.low_max = `Low max must be between ${POINTS_MIN} and ${MEDIUM_CEILING}`;
    }
    if (formValues.medium_max < POINTS_MIN || formValues.medium_max > MEDIUM_CEILING) {
      errors.medium_max = `Medium max must be between ${POINTS_MIN} and ${MEDIUM_CEILING}`;
    }
    if (formValues.medium_max - formValues.low_max < MIN_BAND_GAP) {
      errors.medium_max = `Medium max must be at least ${MIN_BAND_GAP} points above Low max`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveConfig = () => {
    if (!validateForm()) return;
    // Nothing is written until the confirmation dialog is accepted.
    setConfirmSave(true);
  };

  const confirmSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      const data = await backendFetch<BandConfig>("config/bands", {
        method: "POST",
        body: JSON.stringify(formValues),
      });
      setConfig(data);
      setFormValues({ low_max: data.low_max, medium_max: data.medium_max });
      setConfirmSave(false);
      setSuccess(
        "Thresholds saved for future assessments. Preview and apply a recompute to update existing assessments on non-retired requirements.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
      setConfirmSave(false);
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
        await loadConfig();
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
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="page-header-shell">
        <div className="flex items-center gap-3">
          <Scale aria-hidden="true" className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Risk band settings
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Understand the scoring rules, adjust band cutoffs, then preview and apply changes.
            </p>
          </div>
        </div>
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
            <button
              type="button"
              onClick={() => setShowExplainer((open) => !open)}
              aria-expanded={showExplainer}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                <HelpCircle aria-hidden="true" className="h-5 w-5 text-accent" />
                How a risk band is determined
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                {showExplainer ? "Hide details" : "Show details"}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform ${showExplainer ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Points = 12 × Severity + 5 × Probability + 3 × Detectability (range 20–100). Two
              cutoffs split the points into Low / Medium / High; display RPN = points ÷ 20.
            </p>
            {showExplainer && (
              <>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">
              <li className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  1. Score the evidence
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Severity, probability, and detectability are each scored from 1 to 5.
                </p>
                <p className="mt-3 rounded bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                  Points = 12S + 5P + 3D
                </p>
              </li>
              <li className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  2. Map points to a band
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  The two cutoffs define Low, Medium, and High. Display RPN is points ÷ 20.
                </p>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Total points range from 20 to 100.
                </p>
              </li>
              <li className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  3. Determine assurance
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Low → Unscripted · Medium → Exploratory · High → Scripted.
                </p>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Severity 5 always requires Scripted; otherwise the risk band determines assurance.
                </p>
              </li>
            </ol>

            <div className="mt-5 rounded-md border border-accent/30 bg-orange-50/70 p-4 dark:bg-orange-950/20">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Try an example
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Change a score or cutoff to see how the result responds. This example does not change stored assessments.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["severity", "Severity"],
                    ["probability", "Probability"],
                    ["detectability", "Detectability"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    htmlFor={`example-${key}`}
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    {label}
                    <select
                      id={`example-${key}`}
                      value={exampleScores[key]}
                      onChange={(event) =>
                        setExampleScores({
                          ...exampleScores,
                          [key]: Number(event.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      {[1, 2, 3, 4, 5].map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {12}×{exampleScores.severity} + {5}×{exampleScores.probability} + {3}×
                  {exampleScores.detectability} = {examplePoints} points (RPN{" "}
                  {(examplePoints / 20).toFixed(2)})
                </span>
                <span
                  className={`rounded border px-2 py-1 text-xs font-semibold ${getBandColor(exampleBand)}`}
                >
                  {exampleBand} band
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Assurance: <strong>{exampleAssurance}</strong>
                </span>
              </div>
            </div>
              </>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 id="bands-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Configure band cutoffs
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Drag the two knobs to set the cutoffs. The Low cutoff moves between 20 and{" "}
              {MEDIUM_CEILING} points, the Medium cutoff never rises above {MEDIUM_CEILING}, and a{" "}
              {MIN_BAND_GAP}-point window is always reserved for Medium between the knobs — they
              cannot cross. Each knob also responds to keyboard arrow keys.
            </p>

            {configLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading the current band thresholds…
              </div>
            ) : (
              <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  name: "Low",
                  range: `0–${formValues.low_max} points`,
                  action: "Unscripted",
                },
                {
                  name: "Medium",
                  range: `${formValues.low_max + 1}–${formValues.medium_max} points`,
                  action: "Exploratory",
                },
                {
                  name: "High",
                  range: `${formValues.medium_max + 1}–100 points`,
                  action: "Scripted",
                },
              ].map((band) => (
                <div
                  key={band.name}
                  className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${getBandColor(band.name)}`}>
                    {band.name}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {band.range}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {band.action} assurance
                  </p>
                </div>
              ))}
            </div>

            <BandRangeSlider
              className="mt-8"
              lowMax={formValues.low_max}
              mediumMax={formValues.medium_max}
              disabled={
                !config ||
                configLoading ||
                previewing ||
                saving ||
                loading
              }
              onChange={updateThresholds}
            />

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
                  <BandNumberInput
                    id="low_max"
                    value={formValues.low_max}
                    min={POINTS_MIN}
                    max={formValues.medium_max - MIN_BAND_GAP}
                    disabled={!config || configLoading || previewing || saving || loading}
                    describedBy={formErrors.low_max ? "low_max_error" : undefined}
                    onCommit={(nextLow) =>
                      updateThresholds({
                        ...formValues,
                        low_max: nextLow,
                      })
                    }
                  />
                  {formErrors.low_max && (
                    <p id="low_max_error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {formErrors.low_max}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Allowed {POINTS_MIN}–{formValues.medium_max - MIN_BAND_GAP} points. Saved cutoff: ≤{" "}
                  {config ? config.low_max : "—"} points (RPN ≤{" "}
                  {config ? (config.low_max / 20).toFixed(2) : "—"})
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
                  <BandNumberInput
                    id="medium_max"
                    value={formValues.medium_max}
                    min={formValues.low_max + MIN_BAND_GAP}
                    max={MEDIUM_CEILING}
                    disabled={!config || configLoading || previewing || saving || loading}
                    describedBy={formErrors.medium_max ? "medium_max_error" : undefined}
                    onCommit={(nextMedium) =>
                      updateThresholds({
                        ...formValues,
                        medium_max: nextMedium,
                      })
                    }
                  />
                  {formErrors.medium_max && (
                    <p id="medium_max_error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {formErrors.medium_max}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Allowed {formValues.low_max + MIN_BAND_GAP}–{MEDIUM_CEILING} points. Saved cutoff: ≤{" "}
                  {config ? config.medium_max : "—"} points (RPN ≤{" "}
                  {config ? (config.medium_max / 20).toFixed(2) : "—"})
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
                </dl>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={!config || configLoading || saving || previewing || loading}
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
                disabled={!config || configLoading || previewing || saving || loading}
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
              </>
            )}
          </div>

          {/* Help / Info */}
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

      {/* Confirm-save dialog */}
      {confirmSave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-save-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirmSave(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirm-save-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Confirm new band thresholds
              </h2>
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                aria-label="Close"
                className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              You are about to save the cutoffs set on the slider:
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">Low</dt>
                <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-200">
                  0–{formValues.low_max} pts · RPN up to {toRpn(formValues.low_max)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">Medium</dt>
                <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-200">
                  {formValues.low_max + 1}–{formValues.medium_max} pts · RPN{" "}
                  {toRpn(formValues.low_max + 1)}–{toRpn(formValues.medium_max)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">High</dt>
                <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-200">
                  {formValues.medium_max + 1}–100 pts · RPN {toRpn(formValues.medium_max + 1)}–5.00
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Currently saved: Low up to {config?.low_max ?? "—"} / Medium up to{" "}
              {config?.medium_max ?? "—"}.
            </p>
            <p className="mt-4 rounded-md bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              Saving writes the new thresholds to bands.yaml and applies to future assessments.
              Existing assessments keep their current band until you run Preview + Apply
              Recompute, which re-bands every current assessment that belongs to a
              non-retired requirement.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                disabled={saving}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSaveConfig()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Confirm and save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
/** Dual-knob slider for the two band cutoffs on the points scale (20-100). */
function BandRangeSlider({
  lowMax,
  mediumMax,
  disabled,
  onChange,
  className = "",
}: {
  lowMax: number;
  mediumMax: number;
  disabled: boolean;
  onChange: (values: { low_max: number; medium_max: number }) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<"low" | "medium" | null>(null);

  const fractionOf = (points: number) =>
    (points - POINTS_MIN) / (POINTS_MAX - POINTS_MIN);
  const clampLow = (raw: number) =>
    Math.min(Math.max(raw, POINTS_MIN), mediumMax - MIN_BAND_GAP);
  const clampMedium = (raw: number) =>
    Math.max(Math.min(raw, MEDIUM_CEILING), lowMax + MIN_BAND_GAP);

  const pointFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(POINTS_MIN + ratio * (POINTS_MAX - POINTS_MIN));
  };

  const startDrag = (which: "low" | "medium") =>
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      setDragging(which);
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const point = pointFromClientX(event.clientX);
    if (point === null) return;
    if (dragging === "low") {
      onChange({ low_max: clampLow(point), medium_max: mediumMax });
    } else {
      onChange({ low_max: lowMax, medium_max: clampMedium(point) });
    }
  };

  const endDrag = () => setDragging(null);

  const stepWithKeyboard = (which: "low" | "medium") =>
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const delta =
        event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (!delta) return;
      event.preventDefault();
      if (which === "low") {
        onChange({ low_max: clampLow(lowMax + delta), medium_max: mediumMax });
      } else {
        onChange({ low_max: lowMax, medium_max: clampMedium(mediumMax + delta) });
      }
    };

  const knobs: Array<{
    which: "low" | "medium";
    value: number;
    label: string;
    min: number;
    max: number;
    border: string;
    dot: string;
  }> = [
    {
      which: "low",
      value: lowMax,
      label: `Low band maximum — ${lowMax} points (RPN ${toRpn(lowMax)})`,
      min: POINTS_MIN,
      max: mediumMax - MIN_BAND_GAP,
      border: "border-emerald-600 dark:border-emerald-400",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    {
      which: "medium",
      value: mediumMax,
      label: `Medium band maximum — ${mediumMax} points (RPN ${toRpn(mediumMax)})`,
      min: lowMax + MIN_BAND_GAP,
      max: MEDIUM_CEILING,
      border: "border-red-600 dark:border-red-400",
      dot: "bg-red-500 dark:bg-red-400",
    },
  ];

  return (
    <div className={`select-none ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-semibold">
        <span className="text-emerald-700 dark:text-emerald-400">
          Low · 0–{lowMax} pts · RPN up to {toRpn(lowMax)}
        </span>
        <span className="text-amber-700 dark:text-amber-400">
          Medium · {lowMax + 1}–{mediumMax} pts · RPN {toRpn(lowMax + 1)}–
          {toRpn(mediumMax)}
        </span>
        <span className="text-red-700 dark:text-red-400">
          High · {mediumMax + 1}–100 pts · RPN {toRpn(mediumMax + 1)}–5.00
        </span>
      </div>
      <div
        ref={trackRef}
        className={`relative mt-5 h-9 touch-none ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="absolute inset-x-0 top-1/2 flex h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="bg-emerald-400 dark:bg-emerald-600"
            style={{ width: `${fractionOf(lowMax) * 100}%` }}
          />
          <div
            className="bg-amber-400 dark:bg-amber-600"
            style={{
              width: `${(fractionOf(mediumMax) - fractionOf(lowMax)) * 100}%`,
            }}
          />
          <div
            className="bg-red-400 dark:bg-red-600"
            style={{ width: `${(1 - fractionOf(mediumMax)) * 100}%` }}
          />
        </div>
        {knobs.map((knob) => (
          <div
            key={knob.which}
            data-testid={`${knob.which}-knob`}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={knob.label}
            aria-valuemin={knob.min}
            aria-valuemax={knob.max}
            aria-valuenow={knob.value}
            onPointerDown={startDrag(knob.which)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={stepWithKeyboard(knob.which)}
            style={{ left: `${fractionOf(knob.value) * 100}%` }}
            className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 bg-white shadow-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing dark:bg-zinc-950 ${
              dragging === knob.which ? "scale-110 shadow-md" : ""
            } ${knob.border}`}
          >
            <span className={`h-2 w-2 rounded-full ${knob.dot}`} />
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex justify-between font-mono text-[10px] text-zinc-400 dark:text-zinc-500"
      >
        <span>RPN 1.0</span>
        <span>2.0</span>
        <span>3.0</span>
        <span>4.0</span>
        <span>5.0</span>
      </div>
    </div>
  );
}

/**
 * Digits-only band cutoff input. Anything that is not a digit is stripped
 * while typing, and the committed value is clamp-corrected into [min, max]
 * on blur or Enter, so an out-of-range or empty value can never reach the
 * save step.
 */
function BandNumberInput({
  id,
  value,
  min,
  max,
  disabled,
  onCommit,
  describedBy,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onCommit: (value: number) => void;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  // Follow external updates (slider drags, saved-value refreshes).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const draftNum = Number.parseInt(draft, 10);
  const outOfRange = draft !== "" && !(draftNum >= min && draftNum <= max);

  const commit = () => {
    if (draft === "" || Number.isNaN(draftNum)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(Math.max(draftNum, min), max);
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        disabled={disabled}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value.replace(/[^0-9]/g, "").slice(0, 3));
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors ${
          outOfRange
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-zinc-300 focus:border-accent focus:ring-accent"
        } dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`}
        aria-invalid={outOfRange || undefined}
        aria-describedby={describedBy}
      />
      {outOfRange && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          Allowed {min}–{max} points — it will be corrected to the nearest limit when you leave the
          field.
        </p>
      )}
    </div>
  );
}
