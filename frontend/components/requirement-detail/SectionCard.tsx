import type { ReactNode } from "react";

interface SectionCardProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Shared card wrapper matching the Dashboard / list card language. */
export default function SectionCard({ id, title, description, children }: SectionCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-lg border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2
        id={`${id}-heading`}
        className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
