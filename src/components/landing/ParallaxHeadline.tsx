"use client";

import { useEffect, useRef } from "react";

/**
 * The headline is printed twice: once in ink, once as a verdigris ghost
 * slightly out of register — the same thing, seen from two places. The ghost
 * is a CSS pseudo-element with empty alt text (see .headline in globals.css),
 * so it is pure decoration: never read aloud or treated as text. On load it
 * drifts out from behind the headline; with a fine pointer the offset follows
 * the cursor a little. Reduced motion: static offset.
 */
export function ParallaxHeadline({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    if (reduce.matches || !fine.matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--gx", `${(0.055 + x * 0.05).toFixed(4)}em`);
        el.style.setProperty("--gy", `${(0.035 + y * 0.03).toFixed(4)}em`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <h1 ref={ref} data-ghost={text} className={`headline ${className}`}>
      {text}
    </h1>
  );
}
