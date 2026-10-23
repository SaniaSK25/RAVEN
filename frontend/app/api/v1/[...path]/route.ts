import { Agent, fetch as undiciFetch } from "undici";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const backendAgent = new Agent({
  headersTimeout: 15 * 60 * 1000,
  bodyTimeout: 15 * 60 * 1000,
});

async function proxyToBackend(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const backendUrl = (
    process.env.RAVEN_BACKEND_URL ?? "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
  const incomingUrl = new URL(request.url);
  const backendPath = path.map((part) => encodeURIComponent(part)).join("/");
  const url = `${backendUrl}/api/v1/${backendPath}${incomingUrl.search}`;

  let backendResponse: Awaited<ReturnType<typeof undiciFetch>>;
  try {
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();
    backendResponse = await undiciFetch(url, {
      method: request.method,
      headers: {
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type")! }
          : {}),
      },
      body,
      cache: "no-store",
      dispatcher: backendAgent,
    });
  } catch (error) {
    console.error(`RAVEN backend request failed (${request.method} ${url}):`, error);
    return Response.json(
      {
        detail: "The RAVEN backend request timed out or could not be completed. "
          + "The backend may still be processing it; check assessment history "
          + "before retrying.",
      },
      { status: 502 },
    );
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-disposition"]) {
    const value = backendResponse.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(await backendResponse.arrayBuffer(), {
    status: backendResponse.status,
    headers,
  });
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
