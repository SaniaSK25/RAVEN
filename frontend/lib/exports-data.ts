/**
 * Exports demo-data service.
 *
 * No export endpoint exists in the backend yet, so this module provides typed
 * demo export packages plus the selectable package-content catalogue. Counts
 * mirror the other demo datasets (18 requirements, 10 tests, 12 criteria).
 *
 * `ExportStatus` (READY / BUILDING / FAILED) is an export-workspace display
 * union with no domain equivalent — documented here, not a duplicate of any
 * domain union.
 *
 * IMPORTANT: checksums are clearly marked demo values, downloads are
 * demo-only disabled actions, and the build sequence on the page is a local
 * simulation. No files are generated, no jobs run, nothing is stored.
 *
 * To integrate the real API later, replace `getExportsDemoData()` with a
 * fetch to e.g. GET /api/exports returning `ExportPackage[]`, and wire the
 * create/retry actions to POST /api/exports with job polling.
 */

export type ExportStatus = "READY" | "BUILDING" | "FAILED";

export type PackageContentKey =
  | "requirements"
  | "risk"
  | "assurance"
  | "tests"
  | "traceability"
  | "changes"
  | "compliance"
  | "manifest";

export interface PackageContentOption {
  key: PackageContentKey;
  label: string;
  description: string;
}

export type ExportFormat = "DOCX" | "PDF" | "ZIP";

export interface ExportPackage {
  id: string;
  name: string;
  /** Demo creation timestamp (ISO). */
  createdAt: string;
  status: ExportStatus;
  contents: PackageContentKey[];
  formats: ExportFormat[];
  requirementCount: number;
  testCount: number;
  criteriaCount: number;
  /** Demo value — explicitly NOT a real cryptographic checksum. */
  checksum: string;
  manifestStatus: "Verified (demo)" | "Pending" | "Failed";
  /** Human-readable failure reason (failed packages only). */
  failureReason: string | null;
}

export const PACKAGE_CONTENTS: PackageContentOption[] = [
  { key: "requirements", label: "Requirements", description: "Requirement texts and versions in scope." },
  { key: "risk", label: "Risk Assessments", description: "Severity, probability, detectability, RPN, and rules." },
  { key: "assurance", label: "Assurance Decisions", description: "Outcomes, rationales, and decision paths." },
  { key: "tests", label: "Test Scripts", description: "Generated and manual scripts with steps." },
  { key: "traceability", label: "Traceability Matrix", description: "Requirement → risk → assurance → test links." },
  { key: "changes", label: "Change History", description: "Change events and review outcomes." },
  { key: "compliance", label: "Compliance Results", description: "Criteria coverage and named gaps." },
  { key: "manifest", label: "Manifest / Checksums", description: "Package manifest with demo checksums." },
];

/** Ordered build steps for the simulated package-creation sequence. */
export const BUILD_STEPS = [
  "Preparing package",
  "Collecting evidence",
  "Generating documents",
  "Creating manifest",
  "Ready",
] as const;

export const DEMO_TOTALS = {
  requirements: 18,
  tests: 10,
  criteria: 12,
};

export function getExportsDemoData(): ExportPackage[] {
  return demoPackages;
}

export const isExportsDemoData = true;

const demoPackages: ExportPackage[] = [
  {
    id: "PKG-2026-014",
    name: "Audit package — August release review",
    createdAt: "2026-08-20T10:15:00Z",
    status: "READY",
    contents: ["requirements", "risk", "assurance", "tests", "traceability", "changes", "compliance", "manifest"],
    formats: ["DOCX", "PDF", "ZIP"],
    requirementCount: 18,
    testCount: 10,
    criteriaCount: 12,
    checksum: "demo-sha256:7f3a·c91e·44b0·aa52 (demo value)",
    manifestStatus: "Verified (demo)",
    failureReason: null,
  },
  {
    id: "PKG-2026-013",
    name: "Audit package — batch release evidence",
    createdAt: "2026-08-18T14:02:00Z",
    status: "FAILED",
    contents: ["requirements", "risk", "tests", "manifest"],
    formats: ["DOCX", "PDF", "ZIP"],
    requirementCount: 6,
    testCount: 3,
    criteriaCount: 0,
    checksum: "—",
    manifestStatus: "Failed",
    failureReason: "Document rendering stopped at the traceability annex: a linked test record was stale. Re-run after re-analysis, or retry to rebuild from the same selection.",
  },
  {
    id: "PKG-2026-011",
    name: "Audit package — July baseline",
    createdAt: "2026-07-02T09:40:00Z",
    status: "READY",
    contents: ["requirements", "risk", "assurance", "compliance", "manifest"],
    formats: ["PDF", "ZIP"],
    requirementCount: 18,
    testCount: 0,
    criteriaCount: 12,
    checksum: "demo-sha256:1b88·0f4d·9c2e·77a1 (demo value)",
    manifestStatus: "Verified (demo)",
    failureReason: null,
  },
];
