import type { ExportDataset, PackRequirement } from "@/lib/validation-pack";

const ids = {
  requirement: "11111111-1111-4111-8111-111111111111",
  version: "22222222-2222-4222-8222-222222222222",
  evidence: "33333333-3333-4333-8333-333333333333",
  risk: "44444444-4444-4444-8444-444444444444",
  assurance: "55555555-5555-4555-8555-555555555555",
  test: "66666666-6666-4666-8666-666666666666",
  prompt: "77777777-7777-4777-8777-777777777777",
};

const longEvidence =
  "Preventing batch release when QC tests fail guards against release of out-of-specification product that could harm a patient. The control is evaluated before disposition and the rejection is retained in the audit trail.";

export const fixtureRequirement: PackRequirement = {
  id: ids.requirement,
  req_key: "REQ-0001",
  display_key: "REQ-0001",
  title: "System must prevent batch release when QC tests fail",
  requirement_title: "Batch release control",
  status: "DRAFT",
  version_id: ids.version,
  version: 2,
  text: "System must prevent batch release when QC tests fail.",
  risks: [
    {
      id: ids.risk,
      requirement_version_id: ids.version,
      evidence_id: ids.evidence,
      evidence: null,
      status: "FINAL",
      is_current: true,
      freshness: "fresh",
      severity: 5,
      probability: 3,
      detectability: 3,
      severity_result: {
        score: 5,
        rule_id: "SEV-R3",
        rule_version: "3.0.0",
        reasoning:
          "A patient-safety impact and a batch-release control combine to produce the highest severity score.",
        decision_path: [
          { check: "patient_safety", result: true, evidence: "Patient safety impact." },
          { check: "batch_release", result: true, evidence: "Batch release control." },
        ],
      },
      probability_result: {
        score: 3,
        rule_id: "PROB-S7",
        rule_version: "3.0.0",
        reasoning:
          "The failure mode is plausible because the workflow depends on a QC disposition decision.",
        decision_path: [],
      },
      detectability_result: {
        score: 3,
        rule_id: "DET-S4",
        rule_version: "3.0.0",
        reasoning:
          "The control is visible in the release workflow, but the failure may not be detected until review.",
        decision_path: {},
      },
      gxp_impact: true,
      gxp_reason:
        "The requirement protects patient safety and product quality by controlling batch disposition.",
      gamp_category: "Category 5",
      gamp_reason:
        "The requirement describes configurable application logic that enforces a regulated decision.",
      rpn: 4.2,
      rpn_points: 84,
      band: "HIGH",
      configuration_version: "3.0.0",
      configuration_hash: "abc123",
      created_at: "2026-10-20T10:00:00+00:00",
      updated_at: "2026-10-20T10:05:00+00:00",
    },
  ],
  evidence: [
    {
      id: ids.evidence,
      requirement_version_id: ids.version,
      created_at: "2026-10-20T09:55:00+00:00",
      fields: {
        patient_safety: {
          value: true,
          confidence: 0.75,
          evidence: longEvidence,
        },
        product_quality: {
          value: true,
          confidence: 0.9,
          evidence:
            "The requirement ties disposition to QC test outcomes, so a failure could allow product failing quality specifications to proceed.",
        },
        batch_release: {
          value: true,
          confidence: 0.88,
          evidence:
            "The release decision is explicitly blocked when the QC result is failing.",
        },
        data_integrity: {
          value: false,
          confidence: 0.7,
          evidence:
            "The requirement does not directly change the integrity of the QC result record.",
        },
        regulatory_compliance: {
          value: true,
          confidence: 0.82,
          evidence:
            "The control supports compliance with batch release and data-integrity obligations.",
        },
        business_continuity: {
          value: false,
          confidence: 0.65,
          evidence:
            "The requirement is not primarily a business-continuity control.",
        },
        functional_complexity: {
          value: "Medium",
          confidence: 0.8,
          evidence:
            "The decision depends on a small set of QC outcomes and release states.",
        },
        dependency_complexity: {
          value: "High",
          confidence: 0.86,
          evidence:
            "The release decision depends on the QC system, the batch record, and the disposition workflow.",
        },
        workflow_complexity: {
          value: "Medium",
          confidence: 0.77,
          evidence:
            "The workflow has a rejection branch and a retained audit record.",
        },
        detection_controls: {
          value: "High",
          confidence: 0.84,
          evidence:
            "The blocked release and the retained audit record make the control visible to reviewers.",
        },
        traceability: {
          value: "Medium",
          confidence: 0.73,
          evidence:
            "The QC result and release decision can be connected through the batch record.",
        },
        failure_visibility: {
          value: "Medium",
          confidence: 0.69,
          evidence:
            "A failed release attempt is visible in the workflow log, but the reviewer must inspect it.",
        },
        gxp_impact: {
          value: true,
          confidence: 0.93,
          evidence:
            "Patient safety and product quality are directly affected by the release decision.",
        },
        gamp_category: {
          value: 5,
          confidence: 0.81,
          evidence:
            "The control is implemented as configurable application logic rather than fixed firmware.",
        },
        gxp_reason:
          "The requirement protects patient safety and product quality by controlling batch disposition.",
        gamp_reason:
          "The requirement describes configurable application logic that enforces a regulated decision.",
      },
    },
  ],
  assurance: [
    {
      id: ids.assurance,
      risk_assessment_id: ids.risk,
      assurance_level: "scripted",
      rule_id: "ASR-SEV-FLOOR",
      rule_version: "3.0.0",
      generate_test: true,
      reasoning:
        "Severity 5 meets the configured severity floor, so the deterministic rule selects scripted testing regardless of the overall risk band.",
      decision_path: { severity: 5, band: "High", level: "scripted" },
      freshness: "fresh",
      created_at: "2026-10-20T10:10:00+00:00",
    },
  ],
  tests: [
    {
      id: ids.test,
      title: "Batch release blocked by failing QC result",
      external_code: "TC-REQ-0001-01",
      requirement_version_id: ids.version,
      assurance_decision_id: ids.assurance,
      status: "DRAFT",
      version: 1,
      origin: "generated",
      freshness: "fresh",
      script:
        "Preconditions:\nA batch record exists with a failing QC result and no release approval.\n\nTest Steps:\n1. Attempt to release the batch while the QC result is failing. Expected: The release is blocked and the rejection is recorded.\n2. Correct the QC result to passing and release the batch. Expected: The release proceeds and the disposition is recorded.",
      prompt_version: {
        id: ids.prompt,
        agent_name: "test_script_generator",
        version: 2,
        hash: "a".repeat(64),
      },
      created_at: "2026-10-20T10:15:00+00:00",
    },
  ],
  compliance: [],
  compliance_evaluated: false,
};

export const fixtureDataset: ExportDataset = {
  generated_at: "2026-10-22T12:00:00+00:00",
  pack_reference: "VP-TEST0001",
  requirements: [fixtureRequirement],
  traceability: {
    columns: [
      "requirement_id",
      "requirement_version",
      "risk_id",
      "severity",
      "probability",
      "detectability",
      "rpn",
      "band",
      "assurance_level",
      "assurance_label",
      "reason_code",
      "test_id",
      "test_title",
      "test_origin",
      "coverage_status",
      "stale",
      "orphan_flags",
    ],
    rows: [
      {
        requirement_id: "REQ-0001",
        requirement_version: 2,
        risk_id: "Risk assessment · REQ-0001",
        severity: 5,
        probability: 3,
        detectability: 3,
        rpn: 4.2,
        band: "High",
        assurance_level: "scripted",
        assurance_label: "Scripted testing",
        reason_code: "ASR-SEV-FLOOR",
        test_id: "TC-REQ-0001-01",
        test_title: "Batch release blocked by failing QC result",
        test_origin: "generated",
        coverage_status: "covered_by_tests",
        stale: false,
        orphan_flags: "",
      },
    ],
    summary: {
      requirements: 1,
      covered_by_tests: 1,
      covered_by_assurance: 0,
      uncovered: 0,
      stale: 0,
      rows: 1,
      stale_rows: 0,
      orphans: { O1: 0, O2: 0, O3: 0, total: 0 },
    },
  },
  orphans: [],
  changes: [],
  compliance_evaluated: false,
  compliance_record_count: 0,
  test_execution_available: false,
};
