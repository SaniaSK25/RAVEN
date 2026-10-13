interface RequirementPayload {
  title: string;
  description: string;
  text: string;
  created_by: string;
}

function isRequirementPayload(value: unknown): value is RequirementPayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.title === "string" &&
    payload.title.trim().length > 0 &&
    payload.title.length <= 255 &&
    typeof payload.description === "string" &&
    payload.description.trim().length > 0 &&
    typeof payload.text === "string" &&
    payload.text.trim().length > 0 &&
    typeof payload.created_by === "string" &&
    payload.created_by.trim().length > 0
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRequirementPayload(payload)) {
    return Response.json(
      { detail: "A title, description, text, and created_by value are required." },
      { status: 400 },
    );
  }

  const backendUrl = (
    process.env.RAVEN_BACKEND_URL ?? "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${backendUrl}/api/v1/requirements`, {
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
