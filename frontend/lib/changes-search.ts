import type { BackendChangeEvent } from "@/lib/backend-api";

function searchableText(change: BackendChangeEvent): string {
  return [
    change.requirement_key,
    change.requirement_id,
    change.requirement_title,
    change.current_text,
    change.kind,
    change.status,
    change.created_by,
    change.resolution_note,
    change.current_version,
    JSON.stringify(change.diff ?? {}),
    JSON.stringify(change.impact ?? {}),
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();
}

export function filterChangeEvents(
  changes: BackendChangeEvent[],
  query: string,
): BackendChangeEvent[] {
  const terms = query.normalize("NFKC").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return changes;

  return changes.filter((change) => {
    const text = searchableText(change);
    return terms.every((term) => text.includes(term));
  });
}
