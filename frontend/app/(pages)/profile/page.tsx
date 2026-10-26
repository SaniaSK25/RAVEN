"use client";

import { useEffect, useState } from "react";
import { Check, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

interface RavenUser {
  username?: string;
  display_name?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<RavenUser | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("raven_user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  function signOut() {
    window.localStorage.removeItem("raven_access_token");
    window.localStorage.removeItem("raven_user");
    router.push("/login");
  }

  const displayName = user?.display_name || "RAVEN user";
  const username = user?.username || "No username loaded";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="page-header-shell">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Workspace identity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Profile</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Your RAVEN account and workspace access details.</p>
        </section>

        <section className="page-panel overflow-hidden p-0">
          <div className="flex items-center gap-5 border-b border-zinc-200 bg-zinc-50/80 px-6 py-7 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-2xl font-bold text-white shadow-lg dark:bg-white dark:text-zinc-950">
              {(displayName[0] || "R").toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{displayName}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">@{username}</p>
            </div>
          </div>
          <div className="grid gap-px bg-zinc-200 sm:grid-cols-2 dark:bg-zinc-800">
            <div className="bg-white px-6 py-5 dark:bg-zinc-950"><p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Display name</p><p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p></div>
            <div className="bg-white px-6 py-5 dark:bg-zinc-950"><p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Username</p><p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{username}</p></div>
          </div>
        </section>

        <section className="page-panel">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><ShieldCheck className="h-5 w-5" /></div><div><h2 className="font-semibold text-zinc-950 dark:text-white">Account security</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your account is connected to the RAVEN authentication service.</p></div></div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Active</span>
          </div>
          <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800"><button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"><LogOut className="h-4 w-4" /> Sign out</button></div>
        </section>
      </div>
    </DashboardLayout>
  );
}
