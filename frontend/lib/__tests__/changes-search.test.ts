import { describe, expect, it } from "@jest/globals";
import { filterChangeEvents } from "@/lib/changes-search";
import type { BackendChangeEvent } from "@/lib/backend-api";

const event: BackendChangeEvent = {
  id: "event-1",
  requirement_id: "requirement-071-id",
  requirement_key: "REQ-071",
  requirement_title: "Audit trail",
  current_text: "The system records audit changes.",
  kind: "edit",
  status: "open",
  created_by: "reviewer",
  created_at: null,
  impact: { risks: ["risk-1"] },
  diff: { before: "old approval text", after: "new audit trail text" },
  baseline_assessment_id: null,
  carried_from_event_id: null,
  resolution_note: null,
  resolved_at: null,
};

describe("filterChangeEvents", () => {
  it("searches requirement identifiers and all event text", () => {
    expect(filterChangeEvents([event], "req-071")).toEqual([event]);
    expect(filterChangeEvents([event], "old approval")).toEqual([event]);
    expect(filterChangeEvents([event], "requirement-071-id")).toEqual([event]);
  });

  it("matches all query terms across searchable fields, case-insensitively", () => {
    expect(filterChangeEvents([event], "OPEN AUDIT")).toEqual([event]);
    expect(filterChangeEvents([event], "open retired")).toEqual([]);
  });

  it("returns all events for an empty query", () => {
    expect(filterChangeEvents([event], "  ")).toEqual([event]);
  });
});
