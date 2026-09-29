/**
 * Demo authentication module (local only — NOT production auth).
 *
 * There is no authentication backend, so this module keeps a demo session in
 * localStorage sufficient to demonstrate: successful login, invalid
 * credentials, the logged-in state, and a demo role (QA Team Member vs
 * QA Team Leader) for future permission differences.
 *
 * Do NOT treat this as secure: demo credentials are public, there are no
 * tokens, no hashing, and no authorization enforcement. Replace with a real
 * auth integration (session cookie / SSO) before any regulated use.
 */

export type DemoRole = "qa-member" | "qa-leader";

export interface DemoSession {
  email: string;
  role: DemoRole;
  createdAt: string;
}

export const DEMO_CREDENTIALS = {
  email: "qa.demo@raven.local",
  password: "demo",
} as const;

export const DEMO_ROLES: Array<{ value: DemoRole; label: string; description: string }> = [
  {
    value: "qa-member",
    label: "QA Team Member",
    description: "Reviews evidence, tests, and changes.",
  },
  {
    value: "qa-leader",
    label: "QA Team Leader",
    description: "Approves releases and confirms decisions.",
  },
];

const SESSION_KEY = "raven-demo-session";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export type LoginResult = { ok: true; session: DemoSession } | { ok: false; error: string };

/** Validate demo credentials and, on success, persist a demo session. */
export function loginDemo(email: string, password: string, role: DemoRole): LoginResult {
  if (
    email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    return { ok: false, error: "Invalid email or password. Use the demo credentials shown below." };
  }
  const session: DemoSession = {
    email: DEMO_CREDENTIALS.email,
    role,
    createdAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return { ok: true, session };
}

export function getDemoSession(): DemoSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (parsed.email !== DEMO_CREDENTIALS.email) return null;
    if (parsed.role !== "qa-member" && parsed.role !== "qa-leader") return null;
    return { email: parsed.email, role: parsed.role, createdAt: parsed.createdAt ?? "" };
  } catch {
    return null;
  }
}

export function logoutDemo(): void {
  if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
}

export function roleLabel(role: DemoRole): string {
  return role === "qa-leader" ? "QA Team Leader" : "QA Team Member";
}
