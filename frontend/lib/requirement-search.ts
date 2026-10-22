export interface RequirementSummary {
  id: string;
  req_key: string | null;
  title: string;
  description?: string;
  version: number;
  status: string;
}

export function requirementSelectionKey(requirement: RequirementSummary): string {
  return requirement.req_key || requirement.id;
}

export function requirementListKey(requirement: RequirementSummary): string {
  return (
    requirement.req_key ||
    `REQ-${requirement.id.slice(0, 8).toUpperCase()}`
  );
}

export function requirementVersionLabel(requirement: RequirementSummary): string {
  return requirement.version > 0
    ? `Version ${requirement.version}`
    : "No current version";
}

/** Filter live requirement summaries by key, title, description, or status. */
export function filterRequirementSummaries(
  requirements: RequirementSummary[],
  query: string,
): RequirementSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return requirements;
  return requirements.filter((requirement) => {
    const haystack = [
      requirement.req_key,
      requirement.id,
      requirement.title,
      requirement.description,
      requirement.status,
      requirementVersionLabel(requirement),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
