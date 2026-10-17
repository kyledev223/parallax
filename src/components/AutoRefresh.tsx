"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";

/**
 * Re-renders the current route's server components on an interval so live
 * numbers stay current without a reload. Client state (sort, filters, open
 * accordions, form input) is preserved. Pauses while the tab is hidden and
 * catches up when it becomes visible again.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const last = useRef(0);

  useEffect(() => {
    last.current = Date.now();
    let id: number | undefined;

    const refresh = () => {
      last.current = Date.now();
      startTransition(() => router.refresh());
    };
    const stop = () => {
      if (id !== undefined) window.clearInterval(id);
      id = undefined;
    };
    const start = () => {
      stop();
      id = window.setInterval(refresh, intervalMs);
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return stop();
      if (Date.now() - last.current >= intervalMs) refresh();
      start();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
