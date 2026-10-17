"use client";

import { useEffect, useState } from "react";

/**
 * Current time, ticking. Null during server render and the first client
 * render, so callers fall back to server-computed values and hydration matches.
 */
export function useNow(intervalMs = 15_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
