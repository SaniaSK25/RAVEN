"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PackageOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ExportHistory from "@/components/exports/ExportHistory";
import PackageComposer, { DEFAULT_CONTENTS } from "@/components/exports/PackageComposer";
import {
  BUILD_STEPS,
  DEMO_TOTALS,
  getExportsDemoData,
  type ExportPackage,
  type PackageContentKey,
} from "@/lib/exports-data";

const STEP_MS = 900;
let createdCount = 0;

function demoChecksum(n: number): string {
  const suffixes = ["a41f·02c9·be77·d310", "55e0·18ab·c4f2·906d", "f20c·77b1·3aa4·e589"];
  return `demo-sha256:${suffixes[n % suffixes.length]} (demo value)`;
}

function buildNewPackage(selected: PackageContentKey[], sequence: number): ExportPackage {
  const now = new Date().toISOString();
  return {
    id: `PKG-2026-0${15 + sequence}`,
    name: "Audit package — custom selection",
    createdAt: now,
    status: "BUILDING",
    contents: selected,
    formats: ["DOCX", "PDF", "ZIP"],
    requirementCount: selected.includes("requirements") ? DEMO_TOTALS.requirements : 0,
    testCount: selected.includes("tests") ? DEMO_TOTALS.tests : 0,
    criteriaCount: selected.includes("compliance") ? DEMO_TOTALS.criteria : 0,
    checksum: "Pending…",
    manifestStatus: "Pending",
    failureReason: null,
  };
}

export default function ExportsPage() {
  const initial = useMemo(() => getExportsDemoData(), []);
  const [packages, setPackages] = useState<ExportPackage[]>(initial);
  const [selected, setSelected] = useState<PackageContentKey[]>(DEFAULT_CONTENTS);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  function runBuildSequence(id: string) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBuildingId(id);
    setBuildStep(0);
    setExpandedId(id);
    for (let step = 1; step < BUILD_STEPS.length; step += 1) {
      timers.current.push(
        setTimeout(() => {
          setBuildStep(step);
          if (step === BUILD_STEPS.length - 1) {
            setPackages((prev) =>
              prev.map((pkg) =>
                pkg.id === id
                  ? {
                      ...pkg,
                      status: "READY",
                      checksum: demoChecksum(createdCount),
                      manifestStatus: "Verified (demo)",
                      failureReason: null,
                    }
                  : pkg,
              ),
            );
            setBuildingId(null);
          }
        }, step * STEP_MS),
      );
    }
  }

  function handleCreate() {
    if (buildingId || selected.length === 0) return;
    const pkg = buildNewPackage(selected, createdCount);
    createdCount += 1;
    setPackages((prev) => [pkg, ...prev]);
    runBuildSequence(pkg.id);
  }

  function handleRetry(id: string) {
    if (buildingId) return;
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, status: "BUILDING" as const } : pkg)),
    );
    runBuildSequence(id);
  }

  function handleToggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Exports
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Audit-package workspace — configure contents, build a package, inspect what was exported.
        </p>
      </div>

      <div className="mt-6">
        <PackageComposer
          selected={selected}
          onChange={setSelected}
          onCreate={handleCreate}
          creating={buildingId !== null}
        />
      </div>

      <section
        aria-label="Export history"
        className="mt-4 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        {packages.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
            >
              <PackageOpen className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              No export packages yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Configure the contents above and create your first audit package.
            </p>
          </div>
        ) : (
          <ExportHistory
            packages={packages}
            buildingId={buildingId}
            buildStep={buildStep}
            expandedId={expandedId}
            onToggle={handleToggle}
            onRetry={handleRetry}
          />
        )}
      </section>

      <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">
        Demo only — packages are simulated in this page. No files are generated, no jobs
        run, and checksums are illustrative values, not cryptographic digests.
      </p>
    </DashboardLayout>
  );
}
