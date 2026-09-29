"use client";

import { useEffect } from "react";

/**
 * Scrolls to a detail section on mount (e.g. opened via ?tab=risk).
 * Sections already carry scroll-mt for the sticky sub-nav.
 */
export default function ScrollToSection({ targetId }: { targetId: string }) {
  useEffect(() => {
    document.getElementById(targetId)?.scrollIntoView({ block: "start" });
  }, [targetId]);

  return null;
}
