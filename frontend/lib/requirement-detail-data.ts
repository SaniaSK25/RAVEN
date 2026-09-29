/**
 * Requirement detail demo-data service.
 *
 * No detail endpoint exists in the backend yet, so this module builds a
 * typed detail view-model from the list demo data (`lib/requirements-data.ts`)
 * plus hand-authored fixtures for the lifecycle sections.
 *
 * Reuses the stable domain unions from lib/domain.ts — no duplicate
 * status/risk/assurance unions are defined here.
 *
 * IMPORTANT: the fixtures below DISPLAY rule-engine decisions (rule IDs,
 * decision paths, S/P/D factors). They are hard-coded demo values, NOT a
 * second risk-scoring system. The UI must never compute risk bands or RPNs;
 * `rpn` always equals the `RequirementListItem.rpn` shown in the list.
 *
 * RPN consistency note: three list RPNs (REQ-004: 72, REQ-007: 90,
 * REQ-009: 28) cannot be expressed as severity × probability × detectability
 * with 1–5 factors, so they were corrected to the nearest representable
 * value in the same band (75, 100, 27) in lib/requirements-data.ts.
 *
 * To integrate the real API later, replace `getRequirementDetail()` with a
 * fetch to e.g. GET /api/requirements/[id] returning this same
 * `RequirementDetail` shape (via the api-types adapters).
 */

import type {
  AssuranceDecision,
  ChangeEvent,
  ComplianceCriterion,
  Evidence,
  RequirementVersion,
  RiskAssessment,
  Test,
} from "@/lib/domain";
import {
  getRequirementsDemoData,
  parseVersion,
  type RequirementListItem,
} from "@/lib/requirements-data";

/** One extracted fact: domain Evidence plus list-friendly label/value. */
export interface DemoEvidence extends Evidence {
  label: string;
  value: string;
}

/** A scripted test with display helpers (domain Test has no purpose field). */
export interface DemoTest extends Test {
  purpose: string;
}

export interface RequirementDetail extends RequirementListItem {
  description: string;
  gampCategory: string;
  gxpImpact: boolean;
  evidence: DemoEvidence[];
  riskDetail: RiskAssessment;
  assuranceDetail: AssuranceDecision;
  tests: DemoTest[];
  versions: RequirementVersion[];
  changes: ChangeEvent[];
  compliance: ComplianceCriterion[];
}

export const isRequirementDemoDetail = true;

/* ------------------------- shared demo constants ------------------------ */

const DEMO_DATE = "2026-08-14T09:00:00Z";

/** severity × probability × detectability per requirement (product = list RPN). */
const FACTORS: Record<string, [number, number, number]> = {
  "REQ-001": [5, 4, 4],
  "REQ-002": [4, 3, 3],
  "REQ-003": [5, 5, 4],
  "REQ-004": [5, 5, 3],
  "REQ-005": [4, 4, 4],
  "REQ-006": [5, 4, 2],
  "REQ-007": [5, 5, 4],
  "REQ-008": [5, 3, 2],
  "REQ-009": [3, 3, 3],
  "REQ-010": [3, 2, 2],
  "REQ-011": [4, 4, 2],
  "REQ-012": [5, 4, 3],
  "REQ-013": [5, 3, 3],
  "REQ-014": [5, 5, 3],
  "REQ-015": [4, 2, 2],
  "REQ-016": [2, 2, 2],
  "REQ-017": [4, 4, 3],
  "REQ-018": [5, 2, 2],
};

const EVIDENCE_LABELS = [
  "GxP impact",
  "Patient safety impact",
  "Data integrity impact",
  "Functional complexity",
  "Dependency complexity",
  "Workflow complexity",
  "Detection / failure visibility",
] as const;

type EvidenceSeed = {
  value: string;
  confidence: Evidence["confidence"];
  source: string;
  summary: string;
};

/* ------------------------- hand-authored rich records ------------------- */
/* Four showcase records; every other ID uses the template fallback below. */

const RICH_SEEDS: Record<
  string,
  {
    description: string;
    gampCategory: string;
    gxpImpact: boolean;
    evidence: EvidenceSeed[];
    riskReasoning: string;
    riskRuleId: string;
    riskPath: string[];
    assuranceRationale: string;
    assuranceRuleId: string;
    assurancePath: string[];
  }
> = {
  "REQ-003": {
    description:
      "All creation and modification of regulated records must write an immutable, tamper-evident audit trail entry. This is the primary detective control for data integrity across the platform.",
    gampCategory: "Category 5",
    gxpImpact: true,
    evidence: [
      { value: "Direct", confidence: "high", source: "URS §4.2", summary: "Audit trail is explicitly required for every GxP record lifecycle event." },
      { value: "High", confidence: "high", source: "Hazard analysis HA-07", summary: "Missing audit entries could mask unauthorised record changes affecting patients." },
      { value: "ALCOA+ critical", confidence: "high", source: "SOP-QA-011", summary: "Tamper-evidence is named as the attributable, contemporaneous record control." },
      { value: "High", confidence: "medium", source: "Design spec DS-03", summary: "Append-only store with hash chaining spans three services." },
      { value: "High", confidence: "medium", source: "Architecture review AR-19", summary: "Audit writer depends on the shared event bus and clock service." },
      { value: "Medium", confidence: "high", source: "URS §4.2", summary: "Entry, review, and export steps follow the standard record workflow." },
      { value: "Low", confidence: "low", source: "Vendor note VN-44", summary: "Tamper alerts surface in the admin console, but the review wording is ambiguous." },
    ],
    riskReasoning:
      "Severity 5: loss of the audit trail undermines the integrity of all GxP records. Probability 5: every record operation exercises this path. Detectability 4: tampering is only found at periodic review. RPN 100 → HIGH.",
    riskRuleId: "RISK-001",
    riskPath: ["severity=5 (GxP record integrity)", "probability=5 (all record operations)", "detectability=4 (periodic review only)", "RPN 100 ≥ 51 → HIGH"],
    assuranceRationale:
      "High risk with direct GxP impact always requires full scripted assurance with formal test evidence.",
    assuranceRuleId: "ASSURE-001",
    assurancePath: ["risk=HIGH", "gxp=true", "→ SCRIPTED (rule ASSURE-001)"],
  },
  "REQ-007": {
    description:
      "Finished batches move to released stock status only after two independent electronic approvals. The control prevents premature release of product to market.",
    gampCategory: "Category 5",
    gxpImpact: true,
    evidence: [
      { value: "Direct", confidence: "high", source: "URS §7.1", summary: "Dual approval before batch release is a stated GxP release control." },
      { value: "High", confidence: "high", source: "Hazard analysis HA-12", summary: "Unauthorised release could place adulterated product on the market." },
      { value: "Direct", confidence: "medium", source: "SOP-QA-004", summary: "Release status transitions are quality records under document control." },
      { value: "Medium", confidence: "high", source: "Design spec DS-09", summary: "State machine enforces draft → approved → released with role checks." },
      { value: "Medium", confidence: "low", source: "Interface spec IS-21", summary: "Release posts to the warehouse system; retry wording needs review." },
      { value: "High", confidence: "medium", source: "URS §7.1", summary: "Two-approver workflow with escalation on rejection." },
      { value: "Medium", confidence: "medium", source: "Design spec DS-09", summary: "Rejected releases remain visible in the pending queue." },
    ],
    riskReasoning:
      "Severity 5: premature batch release is a patient-safety failure. Probability 5: every batch passes this gate. Detectability 4: a skipped approval is visible only in review reports. RPN 100 → HIGH.",
    riskRuleId: "RISK-001",
    riskPath: ["severity=5 (patient safety)", "probability=5 (every batch)", "detectability=4 (review reports only)", "RPN 100 ≥ 51 → HIGH"],
    assuranceRationale:
      "Patient-safety gate with high risk requires scripted assurance; both approval paths need formal test evidence.",
    assuranceRuleId: "ASSURE-001",
    assurancePath: ["risk=HIGH", "patient-safety=true", "→ SCRIPTED (rule ASSURE-001)"],
  },
  "REQ-014": {
    description:
      "After a disaster, GxP data must be restored within the approved recovery time objective. The last recovery drill missed the objective for the archive tier.",
    gampCategory: "Category 4",
    gxpImpact: true,
    evidence: [
      { value: "Direct", confidence: "high", source: "URS §11.3", summary: "Recovery time objective is a committed GxP continuity requirement." },
      { value: "Medium", confidence: "medium", source: "Risk register RR-31", summary: "Extended outage delays batch disposition but has no direct patient contact." },
      { value: "High", confidence: "medium", source: "SOP-IT-022", summary: "Restore validation is required before systems return to GxP service." },
      { value: "Medium", confidence: "low", source: "Drill report DR-26-Q2", summary: "Archive-tier restore timing is unclear after the storage migration." },
      { value: "High", confidence: "medium", source: "Architecture review AR-24", summary: "Recovery spans backups, archives, and the standby site." },
      { value: "Medium", confidence: "high", source: "SOP-IT-022", summary: "Documented runbook with defined roles and checkpoints." },
      { value: "Low", confidence: "low", source: "Drill report DR-26-Q2", summary: "Archive restore overran the objective; root cause still open." },
    ],
    riskReasoning:
      "Severity 5: loss of GxP data continuity halts qualified operations. Probability 5: the drill demonstrated the failure mode. Detectability 3: overruns are caught by drill monitoring. RPN 75 → HIGH. Marked stale pending the repeat drill.",
    riskRuleId: "RISK-002",
    riskPath: ["severity=5 (GxP continuity)", "probability=5 (drill demonstrated)", "detectability=3 (drill monitoring)", "RPN 75 ≥ 51 → HIGH"],
    assuranceRationale:
      "High risk with direct GxP impact requires scripted assurance; the recovery runbook must be re-executed and evidenced after the archive fix.",
    assuranceRuleId: "ASSURE-001",
    assurancePath: ["risk=HIGH", "gxp=true", "→ SCRIPTED (rule ASSURE-001)"],
  },
  "REQ-010": {
    description:
      "Installation qualification for standard components is covered by vendor qualification evidence rather than bespoke scripted testing.",
    gampCategory: "Category 1",
    gxpImpact: false,
    evidence: [
      { value: "None", confidence: "high", source: "GAMP assessment GA-02", summary: "Infrastructure software with noGxP configuration." },
      { value: "None", confidence: "high", source: "GAMP assessment GA-02", summary: "No patient-data processing in this layer." },
      { value: "Low", confidence: "high", source: "Vendor cert VC-118", summary: "Vendor version records satisfy traceability needs." },
      { value: "Low", confidence: "high", source: "Design spec DS-01", summary: "Standard install procedure with version check." },
      { value: "Low", confidence: "high", source: "Architecture review AR-02", summary: "No runtime dependencies beyond the OS baseline." },
      { value: "Low", confidence: "high", source: "SOP-IT-003", summary: "Routine install workflow." },
      { value: "High", confidence: "high", source: "Vendor cert VC-118", summary: "Version mismatch blocks install with a clear message." },
    ],
    riskReasoning:
      "Severity 3: install failure delays setup but affects no records. Probability 2: standard procedure rarely fails. Detectability 2: version check fails fast. RPN 12 → LOW.",
    riskRuleId: "RISK-004",
    riskPath: ["severity=3 (no record impact)", "probability=2 (standard procedure)", "detectability=2 (fails fast)", "RPN 12 ≤ 20 → LOW"],
    assuranceRationale:
      "Low risk on Category 1 infrastructure with no GxP impact is covered by supplier evidence; no bespoke testing required.",
    assuranceRuleId: "ASSURE-004",
    assurancePath: ["risk=LOW", "gamp=Category 1", "gxp=false", "→ SUPPLIER ASSURANCE (rule ASSURE-004)"],
  },
};

/* ------------------------------ fallbacks ------------------------------- */

function fallbackSeeds(item: RequirementListItem): {
  description: string;
  gampCategory: string;
  gxpImpact: boolean;
} {
  const high = item.risk === "HIGH";
  return {
    description: `${item.title} Validation is evidenced against the current ${item.version} implementation.`,
    gampCategory: high ? "Category 5" : item.risk === "MEDIUM" ? "Category 4" : "Category 3",
    gxpImpact: high || item.assurance === "scripted",
  };
}

function fallbackEvidence(item: RequirementListItem, gxpImpact: boolean): EvidenceSeed[] {
  const high = item.risk === "HIGH";
  const values: Array<Omit<EvidenceSeed, "source" | "summary">> =
    gxpImpact || high
      ? [
          { value: "Direct", confidence: "high" },
          { value: high ? "High" : "Medium", confidence: "high" },
          { value: high ? "ALCOA+ critical" : "Relevant", confidence: "medium" },
          { value: "Medium", confidence: "medium" },
          { value: "Medium", confidence: "medium" },
          { value: "Medium", confidence: "high" },
          {
            value: "Medium",
            confidence:
              item.status === "needs-review" || item.status === "warning" || item.status === "stale"
                ? "low"
                : "medium",
          },
        ]
      : [
          { value: "None", confidence: "high" },
          { value: "None", confidence: "high" },
          { value: "Low", confidence: "high" },
          { value: "Low", confidence: "high" },
          { value: "Low", confidence: "medium" },
          { value: "Low", confidence: "high" },
          { value: "High", confidence: "high" },
        ];
  return values.map((v, i) => ({
    ...v,
    source: `URS §${item.id.replace("REQ-", "")}`,
    summary: `Extracted from the requirement text for ${item.id} (${EVIDENCE_LABELS[i].toLowerCase()}).${
      v.confidence === "low" ? " Wording needs QA review." : ""
    }`,
  }));
}

function fallbackRiskReasoning(item: RequirementListItem, s: number, p: number, d: number): string {
  return `Severity ${s}, probability ${p}, detectability ${d}. RPN ${item.rpn} → ${item.risk}. Assessed against the current ${item.version} implementation.`;
}

function fallbackAssurance(item: RequirementListItem): { rationale: string; ruleId: string; path: string[] } {
  switch (item.assurance) {
    case "scripted":
      return {
        rationale: `${item.risk} risk with GxP relevance requires full scripted assurance with formal test evidence.`,
        ruleId: "ASSURE-001",
        path: [`risk=${item.risk}`, "gxp=true", "→ SCRIPTED (rule ASSURE-001)"],
      };
    case "exploratory":
      return {
        rationale: `${item.risk} risk is covered by charter-based exploratory assurance rather than formal scripts.`,
        ruleId: "ASSURE-002",
        path: [`risk=${item.risk}`, "→ EXPLORATORY (rule ASSURE-002)"],
      };
    case "unscripted-supplier":
      return {
        rationale: "Low risk on standard components is covered by supplier evidence; no bespoke testing required.",
        ruleId: "ASSURE-004",
        path: ["risk=LOW", "gamp=Category 1/3", "→ SUPPLIER ASSURANCE (rule ASSURE-004)"],
      };
    default:
      return {
        rationale: "Low residual risk is accepted with ad-hoc verification during routine use.",
        ruleId: "ASSURE-005",
        path: ["risk=LOW", "→ UNSCRIPTED (rule ASSURE-005)"],
      };
  }
}

function scriptedTestSeeds(item: RequirementListItem): Array<{
  purpose: string;
  preconditions: string;
  steps: Array<[string, string]>;
  status: DemoTest["status"];
}> {
  if (item.id === "REQ-003") {
    return [
      {
        purpose: "Verify every record write produces a tamper-evident audit entry.",
        preconditions: "Reviewer role; test record fixtures loaded.",
        steps: [
          ["Create a GxP record", "Audit entry appears with user, UTC timestamp, and new values"],
          ["Modify the record", "Second entry records old and new values"],
          ["Attempt direct store edit", "Write is rejected and a tamper alert is raised"],
        ],
        status: "in-review",
      },
      {
        purpose: "Verify audit export preserves entry integrity.",
        preconditions: "Audit entries exist for the test period.",
        steps: [
          ["Export the audit trail for the period", "Export matches on-screen entries including hash chain"],
        ],
        status: "draft",
      },
    ];
  }
  if (item.id === "REQ-007") {
    return [
      {
        purpose: "Verify batches release only after two independent approvals.",
        preconditions: "Batch in awaiting-release state; two approver accounts.",
        steps: [
          ["Approve once and check stock status", "Status remains unreleased with one approval recorded"],
          ["Approve with a second account", "Status changes to released with both approvals recorded"],
          ["Attempt release with the same approver twice", "Second approval is rejected as non-independent"],
        ],
        status: "in-review",
      },
    ];
  }
  if (item.id === "REQ-014") {
    return [
      {
        purpose: "Verify GxP data restores within the recovery time objective.",
        preconditions: "Standby site available; backup set from the nightly run.",
        steps: [
          ["Execute the recovery runbook", "All tiers restore and validation checks pass within the objective"],
          ["Return systems to GxP service", "Restore validation is recorded and approved"],
        ],
        status: "draft",
      },
    ];
  }
  return [
    {
      purpose: `Verify: ${item.title}`,
      preconditions: `Authorised test user; ${item.version} build deployed.`,
      steps: [
          ["Execute the requirement path", "Expected outcome from the requirement text is observed"],
          ["Exercise the failure path", "Failure is handled and recorded as specified"],
      ],
      status: item.status === "current" ? "approved" : "draft",
    },
  ];
}

function complianceSeeds(item: RequirementListItem): ComplianceCriterion[] {
  const prefix = item.id.replace("REQ-", "CR-");
  if (item.id === "REQ-003") {
    return [
      { id: `${prefix}-a`, code: "21 CFR 11.10(e)", title: "Audit trail of operator actions", status: "covered", requirementIds: [item.id], evidenceIds: [`${item.id}-ev-gxp`], gaps: [] },
      { id: `${prefix}-b`, code: "Annex 11 §9", title: "Tamper-evident change records", status: "covered", requirementIds: [item.id], evidenceIds: [`${item.id}-ev-integrity`], gaps: [] },
      { id: `${prefix}-c`, code: "ALCOA+ C", title: "Contemporaneous review evidence", status: "partial", requirementIds: [item.id], evidenceIds: [], gaps: ["Review timeliness evidence referenced in vendor note VN-44 needs QA confirmation."] },
      { id: `${prefix}-d`, code: "Annex 11 §12.4", title: "Periodic audit-trail review", status: "absent", requirementIds: [], evidenceIds: [], gaps: ["No requirement currently covers the periodic review cadence."] },
    ];
  }
  return [
    { id: `${prefix}-a`, code: "Annex 11 §4", title: "Validated for intended use", status: "covered", requirementIds: [item.id], evidenceIds: [`${item.id}-ev-gxp`], gaps: [] },
    { id: `${prefix}-b`, code: "21 CFR 820.70", title: "Controlled production processes", status: "covered", requirementIds: [item.id], evidenceIds: [`${item.id}-ev-workflow`], gaps: [] },
    { id: `${prefix}-c`, code: "ALCOA+ A", title: "Attributable actions", status: "partial", requirementIds: [item.id], evidenceIds: [], gaps: [`Attribution evidence for ${item.id} is extracted but awaiting QA confirmation.`] },
    { id: `${prefix}-d`, code: "Annex 11 §12", title: "Periodic review cadence", status: "absent", requirementIds: [], evidenceIds: [], gaps: ["No requirement currently covers the periodic review cadence."] },
  ];
}

/* -------------------------------- builder -------------------------------- */

function numericVersion(display: string): number {
  const [major = 1, minor = 0] = parseVersion(display);
  return major + minor / 10;
}

function buildDetail(item: RequirementListItem): RequirementDetail {
  const rich = RICH_SEEDS[item.id];
  const fallback = fallbackSeeds(item);
  const description = rich?.description ?? fallback.description;
  const gampCategory = rich?.gampCategory ?? fallback.gampCategory;
  const gxpImpact = rich?.gxpImpact ?? fallback.gxpImpact;
  const seeds = rich?.evidence ?? fallbackEvidence(item, gxpImpact);
  const [s, p, d] = FACTORS[item.id] ?? [3, 3, 3];
  const versionNum = numericVersion(item.version);

  const evidence: DemoEvidence[] = seeds.map((seed, i) => ({
    id: `${item.id}-ev-${EVIDENCE_LABELS[i].toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`,
    requirementId: item.id,
    version: versionNum,
    source: seed.source,
    summary: seed.summary,
    confidence: seed.confidence,
    createdAt: DEMO_DATE,
    label: EVIDENCE_LABELS[i],
    value: seed.value,
  }));

  const assurance = rich
    ? { rationale: rich.assuranceRationale, ruleId: rich.assuranceRuleId, path: rich.assurancePath }
    : fallbackAssurance(item);

  const riskDetail: RiskAssessment = {
    id: `risk-${item.id}-${item.version}`,
    requirementId: item.id,
    version: versionNum,
    severity: s,
    probability: p,
    detectability: d,
    rpn: item.rpn,
    band: item.risk,
    ruleId: rich?.riskRuleId ?? (item.risk === "HIGH" ? "RISK-001" : item.risk === "MEDIUM" ? "RISK-002" : "RISK-004"),
    decisionPath: rich?.riskPath ?? [
      `severity=${s}`,
      `probability=${p}`,
      `detectability=${d}`,
      `RPN ${item.rpn} → ${item.risk}`,
    ],
    reasoning: rich?.riskReasoning ?? fallbackRiskReasoning(item, s, p, d),
    createdAt: DEMO_DATE,
  };

  const assuranceDetail: AssuranceDecision = {
    id: `assurance-${item.id}-${item.version}`,
    requirementId: item.id,
    version: versionNum,
    outcome: item.assurance,
    ruleId: assurance.ruleId,
    decisionPath: assurance.path,
    rationale: assurance.rationale,
    generateTest: item.assurance === "scripted",
    createdAt: DEMO_DATE,
  };

  const tests: DemoTest[] =
    item.assurance === "scripted"
      ? scriptedTestSeeds(item).map((t, i) => ({
          id: `TST-${item.id.replace("REQ-", "")}-${String(i + 1).padStart(2, "0")}`,
          requirementId: item.id,
          version: versionNum,
          preconditions: t.preconditions,
          steps: t.steps.map(([action, expectedResult], j) => ({
            stepNumber: j + 1,
            action,
            expectedResult,
          })),
          status: t.status,
          createdAt: DEMO_DATE,
          purpose: t.purpose,
        }))
      : [];

  const isFirstVersion = item.version === "v1.0";
  const versions: RequirementVersion[] = isFirstVersion
    ? [
        {
          version: 1.0,
          title: item.title,
          description,
          status: item.status,
          createdAt: DEMO_DATE,
          supersededAt: null,
        },
      ]
    : [
        {
          version: 1.0,
          title: item.title,
          description: "Initial approved wording.",
          status: "superseded",
          createdAt: "2026-02-10T09:00:00Z",
          supersededAt: DEMO_DATE,
        },
        {
          version: versionNum,
          title: item.title,
          description,
          status: item.status,
          createdAt: DEMO_DATE,
          supersededAt: null,
        },
      ];

  const changes: ChangeEvent[] = isFirstVersion
    ? []
    : [
        {
          id: `chg-${item.id}-${item.version}`,
          requirementId: item.id,
          fromVersion: 1.0,
          toVersion: versionNum,
          summary:
            item.status === "warning"
              ? "Requirement text revised after review; re-assessment pending."
              : item.status === "stale"
                ? "Source document revised; linked evidence and tests are stale."
                : "Editorial clarification with no change to validated behaviour.",
          impactedIds: [`risk-${item.id}-${item.version}`],
          staleIds:
            item.status === "stale" || item.status === "warning"
              ? [`risk-${item.id}-${item.version}`]
              : [],
          status: item.status === "current" ? "confirmed" : "pending-review",
          createdAt: DEMO_DATE,
        },
      ];

  return {
    ...item,
    description,
    gampCategory,
    gxpImpact,
    evidence,
    riskDetail,
    assuranceDetail,
    tests,
    versions,
    changes,
    compliance: complianceSeeds(item),
  };
}

const cache = new Map<string, RequirementDetail>();

export function getRequirementDetail(id: string): RequirementDetail | null {
  const normalised = id.trim().toUpperCase();
  const cached = cache.get(normalised);
  if (cached) return cached;
  const item = getRequirementsDemoData().find((r) => r.id.toUpperCase() === normalised);
  if (!item) return null;
  const detail = buildDetail(item);
  cache.set(normalised, detail);
  return detail;
}
