"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  ClipboardCheck,
  Download,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  Menu,
  Network,
  Scale,
  Settings,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Requirements", icon: FileText, href: "/requirements" },
  { label: "Ingestion", icon: Upload, href: "/ingestion" },
  { label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
  { label: "Assurance", icon: ShieldCheck, href: "/assurance" },
  { label: "Tests", icon: FlaskConical, href: "/tests" },
  { label: "Traceability", icon: Network, href: "/traceability" },
  { label: "Changes", icon: History, href: "/changes" },
  { label: "Compliance", icon: Scale, href: null },
  { label: "Exports", icon: Download, href: "/exports" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleMouseEnter = () => setSidebarCollapsed(false);
  const handleMouseLeave = () => setSidebarCollapsed(true);

  return (
    <div className="flex min-h-screen bg-canvas text-ink dark:bg-black dark:text-zinc-100">
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden shrink-0 flex-col self-start border-r border-zinc-200 bg-[linear-gradient(180deg,#070708_0%,#111111_100%)] transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen dark:border-zinc-800 dark:bg-black ${sidebarCollapsed ? "w-16" : "w-64"}`}
      >
        <div className={`flex h-16 items-center gap-2.5 border-b border-white/10 ${sidebarCollapsed ? "justify-center px-0" : "px-5"}`}>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[13px] font-bold tracking-tight text-brand shadow-sm"
          >
            R
          </span>
          {!sidebarCollapsed && (
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-wide text-white">
                RAVEN
              </span>
              <span className="block text-[11px] font-medium text-zinc-400">
                Regulatory QA
              </span>
            </span>
          )}
        </div>

        <nav aria-label="Primary" className="sidebar-nav flex-1 overscroll-contain overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.href && isActive(item.href)) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current="page"
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`relative flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      {!sidebarCollapsed && (
                        <span
                          aria-hidden="true"
                          className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-accent"
                        />
                      )}
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && item.label}
                    </Link>
                  </li>
                );
              }
              if (item.href) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-accent ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled
                    title={`${item.label} — coming soon`}
                    className={`flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 opacity-80 ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!sidebarCollapsed && (
                      <span className="rounded border border-zinc-700 px-1.5 py-px text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                        Soon
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>


      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
          <span className="flex items-center gap-2.5 md:hidden">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              R
            </span>
            <span className="text-sm font-bold tracking-wide">RAVEN</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-primary-navigation"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {mobileNavOpen ? (
                <X aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Menu aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {mobileNavOpen ? (
          <nav
            id="mobile-primary-navigation"
            aria-label="Primary"
            className="border-b border-zinc-200 bg-white/85 p-3 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/85"
          >
            <ul className="grid grid-cols-2 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                          isActive(item.href)
                            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-400">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                        {item.label} · Soon
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
