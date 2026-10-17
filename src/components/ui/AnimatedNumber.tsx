"use client";

import { useEffect, useRef, useState } from "react";
import { pct, pp, usdCompact } from "@/lib/format";

const FORMATS = {
  int: (v: number) => Math.round(v).toLocaleString("en-US"),
  pp: (v: number) => pp(v),
  ppAbs: (v: number) => `${Math.abs(v).toFixed(1)}pp`,
  pct: (v: number) => pct(v),
  usd: (v: number) => usdCompact(v),
} as const;

export type NumberFormat = keyof typeof FORMATS;

/**
 * Renders a number in tabular mono and eases to new values when they change.
 * First render shows the value as-is (no count-up from zero), and reduced
 * motion skips the tween entirely.
 */
export function AnimatedNumber({
  value,
  format,
  className = "",
}: {
  value: number | null;
  format: NumberFormat;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (from == null || value == null || reduce) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();
    const duration = 700;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(from + (value - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={`num ${className}`}>{shown == null ? "—" : FORMATS[format](shown)}</span>;
}
