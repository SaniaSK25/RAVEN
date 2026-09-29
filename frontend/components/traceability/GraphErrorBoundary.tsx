"use client";

import { Component, type ReactNode } from "react";
import type { Traceability } from "@/lib/domain";

interface GraphErrorBoundaryProps {
  requirementId: string;
  trace: Traceability;
  children: ReactNode;
}

/**
 * Guards the third-party graph canvas: if it fails at runtime, fall back to
 * a static chain listing with the same nodes, edges, and navigation targets.
 */
export default class GraphErrorBoundary extends Component<
  GraphErrorBoundaryProps,
  { failed: boolean }
> {
  constructor(props: GraphErrorBoundaryProps) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    const { trace, requirementId } = this.props;
    return (
      <div className="rounded-md border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          Interactive graph unavailable — showing the recorded chain instead.
        </p>
        <ol className="mt-3 space-y-2">
          {trace.nodes.map((node) => (
            <li key={node.id} className="text-sm">
              <span className="text-[12px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {node.type}
              </span>{" "}
              <a
                href={
                  node.type === "requirement"
                    ? `/requirements/${requirementId}`
                    : `/requirements/${requirementId}?tab=${node.type === "test" ? "tests" : node.type}`
                }
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                {node.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    );
  }
}
