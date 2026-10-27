import { NextResponse, type NextRequest } from "next/server";

/**
 * Login boundary for the RAVEN workspace.
 *
 * Next.js 16 renamed `middleware` to `proxy`; this file is the replacement for
 * the old middleware convention. Every page request is checked for a session
 * cookie and unauthenticated visitors are sent to the login page. The cookie
 * itself is written by the login/register pages after the backend returns a
 * JWT; the token stays in localStorage for API calls (backendFetch sends it as
 * a Bearer token).
 */

const BASE_PATH = "/raven";
const SESSION_COOKIE = "raven_session";
const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The request URL includes the basePath; normalise so the checks below work
  // regardless of whether Next strips it before invoking the proxy.
  const path =
    pathname === BASE_PATH
      ? "/"
      : pathname.startsWith(`${BASE_PATH}/`)
        ? pathname.slice(BASE_PATH.length)
        : pathname;

  // API proxy + framework assets always pass through (the login page itself
  // needs the unauthenticated /api/v1/auth/* endpoints).
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    /\/[^/]+\.[^/]+$/.test(path)
  ) {
    return NextResponse.next();
  }

  const authenticated = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );

  if (!authenticated && !isPublic) {
    // NextURL applies the configured basePath itself, so use the app-relative
    // path here; including "/raven" would produce "/raven/raven/login".
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (authenticated && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // The first entry covers the bare basePath root ("/raven"), which the
  // negative-lookahead pattern alone does not match; the second covers every
  // route below it while skipping framework assets.
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
