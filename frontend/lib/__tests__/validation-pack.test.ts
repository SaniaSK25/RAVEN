import { describe, expect, it } from "@jest/globals";
import {
  assuranceReference,
  buildMetadataCrosswalk,
  buildReportReferences,
  coverageLabel,
  deriveGapFindings,
  evidenceReference,
  EVIDENCE_GROUPS,
  formatConfidence,
  formatDateTime,
  getEvidenceField,
  humanizeDecisionPath,
  matrixToCsv,
  parseTestScript,
  requirementHeading,
  riskReference,
  testReference,
  traceabilitySummary,
} from "@/lib/validation-pack";
import { filterRequirementSummaries } from "@/lib/requirement-search";
import { fixtureDataset, fixtureRequirement } from "@/lib/__tests__/fixtures";

const UUID =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe("validation-pack references", () => {
  it("builds stable report references instead of displaying UUIDs", () => {
    const refs = buildReportReferences(fixtureDataset);
    const risk = fixtureRequirement.risks[0];
    const assurance = fixtureRequirement.assurance[0];
    const test = fixtureRequirement.tests[0];
    const evidence = fixtureRequirement.evidence[0];

    expect(refs.packReference).toBe("VP-TEST0001");
    expect(riskReference(refs, risk.id)).toBe("RA-001");
    expect(assuranceReference(refs, assurance.id)).toBe("ASR-001");
    expect(testReference(refs, test.id)).toBe("TS-001");
    expect(evidenceReference(refs, evidence.id)).toBe("EV-001");
    expect(riskReference(refs, risk.id)).not.toMatch(UUID);
    expect(assuranceReference(refs, assurance.id)).not.toMatch(UUID);
    expect(testReference(refs, test.id)).not.toMatch(UUID);
    expect(evidenceReference(refs, evidence.id)).not.toMatch(UUID);
    expect(requirementHeading(fixtureRequirement)).toBe("REQ-0001 — Version 2");
    expect(requirementHeading(fixtureRequirement)).not.toMatch(UUID);
  });

  it("uses the same mapping when references are rebuilt for another section", () => {
    const first = buildReportReferences(fixtureDataset);
    const second = buildReportReferences(fixtureDataset);
    expect([...first.riskRefs.entries()]).toEqual([...second.riskRefs.entries()]);
    expect([...first.assuranceRefs.entries()]).toEqual([
      ...second.assuranceRefs.entries(),
    ]);
    expect([...first.testRefs.entries()]).toEqual([...second.testRefs.entries()]);
    expect([...first.evidenceRefs.entries()]).toEqual([
      ...second.evidenceRefs.entries(),
    ]);
  });

  it("keeps database identifiers in the machine-readable crosswalk only", () => {
    const refs = buildReportReferences(fixtureDataset);
    const crosswalk = buildMetadataCrosswalk(fixtureDataset, refs);
    expect(crosswalk.requirements[0].requirement_id).toBe(
      fixtureRequirement.id,
    );
    expect(crosswalk.requirements[0].risks[0].risk_assessment_id).toBe(
      fixtureRequirement.risks[0].id,
    );
    expect(crosswalk).not.toHaveProperty("report_reference");
    expect(crosswalk.pack_reference).toBe("VP-TEST0001");
  });
});

describe("evidence presentation helpers", () => {
  it("formats confidence as a percentage, not as a fraction", () => {
    expect(formatConfidence(0.75)).toBe("75%");
    expect(formatConfidence(0.9)).toBe("90%");
    expect(formatConfidence(0)).toBe("0%");
    expect(formatConfidence(null)).toBe("Not recorded");
  });

  it("preserves the complete supporting sentence and groups fields", () => {
    const evidence = fixtureRequirement.evidence[0];
    const field = getEvidenceField(evidence, "patient_safety");
    expect(field?.evidence).toContain(
      "release of out-of-specification product that could harm a patient",
    );
    expect(field?.evidence).toContain("retained in the audit trail");
    expect(field?.confidence).toBe(0.75);
    expect(
      EVIDENCE_GROUPS.flatMap((group) =>
        group.fields.map(([key]) => getEvidenceField(evidence, key)),
      ).filter(Boolean),
    ).toHaveLength(14);
  });

  it("handles missing optional fields without inventing evidence", () => {
    const evidence = {
      ...fixtureRequirement.evidence[0],
      fields: {},
    };
    expect(getEvidenceField(evidence, "patient_safety")).toBeNull();
    expect(formatConfidence(undefined)).toBe("Not recorded");
  });
});

describe("assurance decision paths", () => {
  it("renders readable fields rather than raw JSON", () => {
    const lines = humanizeDecisionPath({
      severity: 5,
      band: "High",
      level: "scripted",
    });
    const rendered = lines.join(" | ");
    expect(rendered).toContain("Severity score: 5");
    expect(rendered).toContain("Risk band: High");
    expect(rendered).toContain("Selected assurance level: Scripted");
    expect(rendered).not.toContain("{");
    expect(rendered).not.toContain("}");
    expect(rendered).not.toContain('"');
  });

  it("renders nested stored decision data as indented fields", () => {
    const lines = humanizeDecisionPath({
      checks: [{ name: "severity floor", result: true }],
    });
    expect(lines.join(" ")).toContain("checks:");
    expect(lines.join(" ")).toContain("name: severity floor");
    expect(lines.join(" ")).not.toContain("[object Object]");
  });
});

describe("test script parsing", () => {
  it("extracts preconditions, numbered steps, and expected results", () => {
    const parsed = parseTestScript(fixtureRequirement.tests[0].script);
    expect(parsed.parsed).toBe(true);
    expect(parsed.preconditions).toContain("failing QC result");
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0].action).toContain("Attempt to release the batch");
    expect(parsed.steps[0].expected).toContain("release is blocked");
    expect(parsed.steps[1].expected).toContain("release proceeds");
  });

  it("preserves the raw script when it cannot be parsed", () => {
    const raw = "A custom script without numbered headings.\nKeep this text intact.";
    const parsed = parseTestScript(raw);
    expect(parsed.parsed).toBe(false);
    expect(parsed.raw).toBe(raw);
  });
});

describe("gap derivation", () => {
  it("derives test lifecycle and absent-compliance findings without inventing a verdict", () => {
    const refs = buildReportReferences(fixtureDataset);
    const findings = deriveGapFindings(fixtureDataset, refs);
    expect(findings.some((finding) => finding.category === "Test lifecycle")).toBe(
      true,
    );
    const compliance = findings.find(
      (finding) => finding.category === "Compliance evaluation not recorded",
    );
    expect(compliance?.status).toBe("Derived finding");
    expect(compliance?.finding).toContain("not a compliance verdict");
    expect(compliance?.finding).not.toContain("non-compliant");
    expect(findings.every((finding) => !finding.finding.match(UUID))).toBe(true);
    expect(findings.every((finding) => finding.id.startsWith("GAP-"))).toBe(true);
  });

  it("includes O1, O2, and O3 findings from the backend traceability service", () => {
    const data = {
      ...fixtureDataset,
      orphans: [
        {
          type: "O1",
          entity_type: "requirement",
          entity_id: fixtureRequirement.id,
          entity_key: "REQ-0001",
          reason: "scripted_no_tests",
          detail:
            "Requirement REQ-0001 has a fresh scripted assurance decision but no fresh test verifies it.",
        },
        {
          type: "O2",
          entity_type: "test",
          entity_id: fixtureRequirement.tests[0].id,
          entity_key: "TC-REQ-0001-01",
          reason: "no_links",
          detail: "Test TC-REQ-0001-01 has no active verifies links.",
        },
        {
          type: "O3",
          entity_type: "risk",
          entity_id: fixtureRequirement.risks[0].id,
          entity_key: "REQ-0001",
          reason: "no_fresh_assurance",
          detail: "Risk assessment has no fresh assurance decision.",
        },
      ],
    };
    const refs = buildReportReferences(data);
    const findings = deriveGapFindings(data, refs);
    const categories = findings.map((finding) => finding.category);
    expect(categories).toContain("Requirement coverage gap");
    expect(categories).toContain("Orphaned test script");
    expect(categories).toContain("Risk without fresh assurance");
    expect(findings.some((finding) => finding.related.includes("RA-001"))).toBe(
      true,
    );
    expect(findings.some((finding) => finding.related.includes("TS-001"))).toBe(
      true,
    );
  });

  it("reports stale risk assessments while preserving the freshness value", () => {
    const data = {
      ...fixtureDataset,
      requirements: [
        {
          ...fixtureRequirement,
          risks: [{ ...fixtureRequirement.risks[0], freshness: "stale" }],
        },
      ],
    };
    const refs = buildReportReferences(data);
    const findings = deriveGapFindings(data, refs);
    expect(
      findings.some(
        (finding) =>
          finding.category === "Stale risk assessment" &&
          finding.finding.includes("stale"),
      ),
    ).toBe(true);
  });
});

describe("traceability and search", () => {
  it("computes unique coverage counts and preserves orphan counts", () => {
    const summary = traceabilitySummary(fixtureDataset);
    expect(summary.requirements).toBe(1);
    expect(summary.covered_by_tests).toBe(1);
    expect(summary.uncovered).toBe(0);
    expect(summary.rows).toBe(1);
    expect(summary.orphans.total).toBe(0);
    expect(coverageLabel("covered_by_tests")).toBe("Covered by tests");
  });

  it("serialises every matrix column and escapes CSV values", () => {
    const data = {
      ...fixtureDataset,
      traceability: {
        ...fixtureDataset.traceability,
        rows: [
          {
            ...fixtureDataset.traceability.rows[0],
            test_title: 'A title with a comma, and a "quote"',
          },
        ],
      },
    };
    const csv = matrixToCsv(data);
    expect(csv.split("\n")[0]).toContain("assurance_label");
    expect(csv.split("\n")[0]).toContain("reason_code");
    expect(csv.split("\n")[0]).toContain("test_origin");
    expect(csv).toContain('"A title with a comma, and a ""quote"""');
  });

  it("filters by requirement key and title and leaves selection keys stable", () => {
    const requirements = [
      {
        id: "a",
        req_key: "REQ-0001",
        title: "Batch release control",
        description: "Prevent release when QC fails",
        version: 2,
        status: "DRAFT",
      },
      {
        id: "b",
        req_key: "REQ-0002",
        title: "Audit trail retention",
        description: "Retain records",
        version: 1,
        status: "APPROVED",
      },
    ];
    expect(filterRequirementSummaries(requirements, "REQ-0002")).toHaveLength(1);
    expect(filterRequirementSummaries(requirements, "audit trail")).toHaveLength(1);
    expect(filterRequirementSummaries(requirements, "qc fails")).toHaveLength(1);
    expect(filterRequirementSummaries(requirements, "no match")).toHaveLength(0);
  });

  it("formats dates consistently and without locale ambiguity", () => {
    expect(formatDateTime("2026-10-22T12:00:00+00:00")).toBe(
      "2026-10-22 12:00 UTC",
    );
  });
});
