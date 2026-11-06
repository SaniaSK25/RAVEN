interface RequirementPayload {
  description: string;
  text: string;
  created_by: string;
}

interface RequirementBatchPayload {
  requirements: RequirementPayload[];
}

function isRequirementBatchPayload(value: unknown): value is RequirementBatchPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    Array.isArray(payload.requirements) &&
    payload.requirements.length >= 1 &&
    payload.requirements.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "description" in item &&
        typeof item.description === "string" &&
        item.description.trim().length > 0 &&
        "text" in item &&
        typeof item.text === "string" &&
        item.text.trim().length > 0 &&
        "created_by" in item &&
        typeof item.created_by === "string" &&
        item.created_by.trim().length > 0,
    )
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRequirementBatchPayload(payload)) {
    return Response.json(
      { detail: "Provide at least one requirement with description, text, and created_by values." },
      { status: 400 },
    );
  }

  const backendUrl = (
    process.env.RAVEN_BACKEND_URL ?? "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${backendUrl}/api/v1/requirements/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("RAVEN requirement ingestion request failed:", error);
    return Response.json(
      {
        detail:
          "Could not connect to the RAVEN backend. Check that it is running and RAVEN_BACKEND_URL is correct.",
      },
      { status: 502 },
    );
  }

  const responseText = await backendResponse.text();
  let responseBody: unknown;
  try {
    responseBody = responseText ? JSON.parse(responseText) : {};
  } catch {
    responseBody = { detail: responseText || "The backend returned an empty response." };
  }
  return Response.json(responseBody, { status: backendResponse.status });
}
