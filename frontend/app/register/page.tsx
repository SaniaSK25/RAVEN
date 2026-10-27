"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Orbit, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/raven/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, username, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "The account could not be created.");
      localStorage.setItem("raven_access_token", body.access_token);
      localStorage.setItem("raven_user", JSON.stringify(body.user));
      // Mirror the session into a cookie so the proxy can gate page routes.
      document.cookie = `raven_session=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="raven-login min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="raven-login-grid" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen max-w-[560px] items-center justify-center px-6 py-10">
        <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-10 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black">R</span><div><p className="text-sm font-bold tracking-[0.28em]">RAVEN</p><p className="text-[11px] text-white/40">NEW WORKSPACE IDENTITY</p></div></div>
          <div className="mb-8"><p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#ef781a] uppercase"><Orbit className="h-3.5 w-3.5" /> Create access</p><h1 className="text-4xl font-semibold tracking-[-0.05em]">Build your identity.</h1><p className="mt-3 text-sm leading-6 text-white/45">Your account is stored securely in the RAVEN database.</p></div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block"><span className="mb-2 block text-xs font-medium text-white/60">Display name</span><div className="raven-field"><UserRound className="h-4 w-4 text-white/30" /><input required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Alex Morgan" /></div></label>
            <label className="block"><span className="mb-2 block text-xs font-medium text-white/60">Username</span><div className="raven-field"><Fingerprint className="h-4 w-4 text-white/30" /><input required minLength={3} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" /></div></label>
            <label className="block"><span className="mb-2 block text-xs font-medium text-white/60">Password <span className="text-white/25">· 8 characters minimum</span></span><div className="raven-field"><LockKeyhole className="h-4 w-4 text-white/30" /><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={busy} className="raven-submit group" type="submit"><span>{busy ? "Creating identity" : "Create account"}</span>{busy ? <span className="raven-loader" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}</button>
          </form>
          <p className="mt-7 text-center text-sm text-white/40">Already have an account? <Link className="font-semibold text-[#ef781a] hover:text-[#ff9b4a]" href="/login">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
