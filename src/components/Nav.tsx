"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { SITE } from "@/lib/site";
import { Mark } from "./ui/Mark";

const LINKS = [
  { href: "/#spreads", label: "Spreads" },
  { href: "/#movers", label: "Movers" },
  { href: "/#alerts", label: "Alerts" },
  { href: "/about", label: "About" },
];

export function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-fg" aria-label="Parallax home">
      <Mark size={22} className="text-accent" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.32em]">Parallax</span>
    </Link>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Wordmark />

        <ul className="ml-6 hidden items-center gap-7 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={SITE.github}
            className="hidden rounded p-2 text-muted transition-colors hover:text-fg sm:block"
            aria-label="Parallax on GitHub"
          >
            <GitHubIcon />
          </a>
          <Link
            href="/events"
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
          >
            Open terminal
          </Link>
          <button
            type="button"
            className="rounded p-2 text-muted hover:text-fg md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" stroke="currentColor" strokeWidth="1.5">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </nav>

      <div id={menuId} hidden={!open} className="border-t border-line md:hidden">
        <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2 text-[15px]">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-3 text-muted hover:text-fg" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={SITE.github} className="flex items-center gap-2 py-3 text-muted hover:text-fg">
              <GitHubIcon /> GitHub
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
