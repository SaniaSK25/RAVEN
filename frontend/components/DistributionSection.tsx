"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  type PieSectorShapeProps,
} from "recharts";

export interface DistributionRow {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Tailwind classes for the text badge. */
  badgeClassName: string;
}

interface DistributionSectionProps {
  title: string;
  description: string;
  rows: DistributionRow[];
  totalLabel: string;
}

export default function DistributionSection({
  title,
  description,
  rows,
  totalLabel,
}: DistributionSectionProps) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function renderSlice(props: PieSectorShapeProps) {
    return (
      <Sector
        cx={props.cx}
        cy={props.cy}
        innerRadius={props.innerRadius ?? 48}
        outerRadius={props.outerRadius ?? 82}
        startAngle={props.startAngle}
        endAngle={props.endAngle}
        cornerRadius={props.cornerRadius}
        fill={props.fill}
        stroke="white"
        strokeWidth={2}
      />
    );
  }

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>

      <div className="mt-4 grid items-center gap-3 sm:grid-cols-[minmax(190px,0.9fr)_minmax(0,1.1fr)]">
        <div
          className="relative mx-auto h-56 w-full max-w-[260px]"
          aria-hidden="true"
          onMouseLeave={() => setActiveKey(null)}
        >
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart
                  onMouseLeave={() => setActiveKey(null)}
                  onClick={() => setActiveKey(null)}
                >
                  <Pie
                    data={rows}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                    shape={renderSlice}
                    onMouseEnter={(_, index) => setActiveKey(rows[index]?.key ?? null)}
                    onMouseLeave={() => setActiveKey(null)}
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {rows.map((row) => (
                      <Cell key={row.key} fill={row.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {total}
                </span>
                <span className="max-w-28 text-center text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                  {totalLabel}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[18px] border-zinc-100 text-center dark:border-zinc-800">
                <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">0</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">No data yet</span>
              </div>
            </div>
          )}
        </div>

        <ul className="space-y-2" aria-label={`${title} categories`}>
          {rows.map((row) => {
            const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;
            const isActive = activeKey === row.key;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveKey(row.key)}
                  onMouseLeave={() => setActiveKey(null)}
                  onFocus={() => setActiveKey(row.key)}
                  onBlur={() => setActiveKey(null)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive
                      ? "bg-zinc-50 dark:bg-zinc-900"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: row.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-5 text-zinc-800 dark:text-zinc-100">
                      {row.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {percent}% of total
                    </span>
                  </span>
                  <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {row.value}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-5 border-t border-zinc-100 pt-4 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Total: <span className="font-semibold tabular-nums">{total}</span>{" "}
        {totalLabel}
      </p>
    </section>
  );
}
