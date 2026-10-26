"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Orbit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_PATH = "/raven/api/v1/auth/login";

export default function LoginPage() {
  const router = useRouter();
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
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Those credentials could not be verified.");
      localStorage.setItem("raven_access_token", body.access_token);
      localStorage.setItem("raven_user", JSON.stringify(body.user));
      router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="raven-login min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="raven-login-grid" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-[1480px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden px-12 py-12 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black">R</span>
            <div><p className="text-sm font-bold tracking-[0.28em]">RAVEN</p><p className="text-[11px] text-white/45">REGULATORY QA</p></div>
          </div>

          <div className="relative flex min-h-[470px] items-center">
            <div className="raven-orbit raven-orbit-one" />
            <div className="raven-orbit raven-orbit-two" />
            <div className="raven-scanline" />
            <div className="relative z-10 max-w-xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-white/55 uppercase backdrop-blur"><Orbit className="h-3.5 w-3.5 text-[#ef781a]" /> Evidence control plane</div>
              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] xl:text-7xl">Make every decision<br /><span className="text-[#ef781a]">traceable.</span></h1>
              <p className="mt-7 max-w-md text-base leading-7 text-white/48">RAVEN turns requirements, risk, assurance, and evidence into one calm, reviewable system.</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12 lg:bg-white/[0.025] lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-12 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black">R</span><p className="mt-4 text-sm font-bold tracking-[0.28em]">RAVEN</p></div>
            <div className="mb-9"><p className="mb-4 text-xs font-semibold tracking-[0.22em] text-[#ef781a] uppercase">Secure workspace access</p><h2 className="text-4xl font-semibold tracking-[-0.045em]">Welcome back.</h2><p className="mt-3 text-sm leading-6 text-white/45">Sign in to continue your validation work.</p></div>
            <form onSubmit={submit} className="space-y-5">
              <label className="block"><span className="mb-2 block text-xs font-medium text-white/60">Username</span><div className="raven-field"><Fingerprint className="h-4 w-4 text-white/30" /><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" /></div></label>
              <label className="block"><span className="mb-2 block text-xs font-medium text-white/60">Password</span><div className="raven-field"><LockKeyhole className="h-4 w-4 text-white/30" /><input required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
              <button disabled={busy} className="raven-submit group" type="submit"><span>{busy ? "Verifying access" : "Enter workspace"}</span>{busy ? <span className="raven-loader" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}</button>
            </form>
            <div className="mt-9 flex items-center gap-3 text-[11px] text-white/30"><span className="h-px flex-1 bg-white/10" /><span>AUTHORIZED ACCESS ONLY</span><span className="h-px flex-1 bg-white/10" /></div>
            <p className="mt-7 text-center text-sm text-white/40">New to RAVEN? <Link className="font-semibold text-[#ef781a] hover:text-[#ff9b4a]" href="/register">Create an account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
