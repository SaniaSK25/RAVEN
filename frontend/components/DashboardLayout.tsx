"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardCheck,
  Download,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  Network,
  Scale,
  Settings,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Requirements", icon: FileText, href: "/requirements" },
  { label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
  { label: "Assurance", icon: ShieldCheck, href: "/assurance" },
  { label: "Tests", icon: FlaskConical, href: "/tests" },
  { label: "Traceability", icon: Network, href: "/traceability" },
  { label: "Changes", icon: History, href: "/changes" },
  { label: "Compliance", icon: Scale, href: "/compliance" },
  { label: "Exports", icon: Download, href: "/exports" },
  { label: "Settings", icon: Settings, href: null },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-[13px] font-bold tracking-tight text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            R
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-wide">
              RAVEN
            </span>
            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Regulatory QA
            </span>
          </span>
        </div>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.href && isActive(item.href)) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current="page"
                      className="flex items-center gap-3 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              }
              if (item.href) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  {/* Disabled until future pages are implemented. */}
                  <button
                    type="button"
                    disabled
                    title={`${item.label} — coming soon`}
                    className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 opacity-70 dark:text-zinc-400"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="rounded border border-zinc-200 px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase dark:border-zinc-700">
                      Soon
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="border-t border-zinc-200 px-5 py-3 text-[11px] leading-5 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          QA control center
          <br />
          Demo data — not connected
        </p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="flex items-center gap-2.5 md:hidden">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              R
            </span>
            <span className="text-sm font-bold tracking-wide">RAVEN</span>
          </span>
          <p className="hidden text-sm text-zinc-500 md:block dark:text-zinc-400">
            Regulated-software QA control center
          </p>
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            QA Workspace
          </span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
