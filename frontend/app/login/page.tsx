"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import {
  DEMO_CREDENTIALS,
  DEMO_ROLES,
  getDemoSession,
  loginDemo,
  type DemoRole,
} from "@/lib/auth-demo";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

/**
 * Standalone entry screen (no DashboardLayout). Demo authentication only —
 * see lib/auth-demo.ts. No existing application pages are modified.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DemoRole>("qa-member");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (getDemoSession()) {
      router.replace("/");
    }
  }, [router]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password) {
      setFieldError("Enter your email and password to sign in.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError(null);
    setSigningIn(true);
    // Brief beat so the signing-in state is perceptible; no backend call.
    window.setTimeout(() => {
      const result = loginDemo(email, password, role);
      setSigningIn(false);
      if (result.ok) {
        router.push("/");
      } else {
        setAuthError(result.error);
      }
    }, 400);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded bg-zinc-900 text-base font-bold tracking-tight text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            R
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-wide text-zinc-900 dark:text-zinc-50">
              RAVEN
            </span>
            <span className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
              Regulatory QA
            </span>
          </span>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Regulated-software QA control center.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.example"
                aria-invalid={fieldError !== null}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={fieldError !== null}
                className={inputClass}
              />
            </div>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                Demo role
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_ROLES.map((option) => {
                  const checked = role === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-md border px-3.5 py-2.5 ${
                        checked
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={checked}
                          onChange={() => setRole(option.value)}
                          className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {option.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block pl-6 text-[12px] text-zinc-500 dark:text-zinc-400">
                        {option.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {fieldError || authError ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
              >
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {fieldError ?? authError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={signingIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Lock aria-hidden="true" className="h-4 w-4" />
              {signingIn ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
              Demo credentials
            </p>
            <p className="mt-0.5 font-mono text-[13px] text-zinc-600 dark:text-zinc-300">
              {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
            </p>
            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
              Local demo only — not production authentication.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-zinc-400 dark:text-zinc-500">
          QA control center · Demo data — not connected
        </p>
      </div>
    </div>
  );
}
