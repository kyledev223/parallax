"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { socialLinks } from "./SocialLinks";
import { Mark } from "./ui/Mark";

const LINKS = [
  { href: "/#spreads", label: "Spreads" },
  { href: "/#movers", label: "Movers" },
  { href: "/#alerts", label: "Alerts" },
  { href: "/about", label: "About" },
];

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-fg" aria-label="Parallax home">
      <Mark size={22} className="text-accent" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.32em]">Parallax</span>
    </Link>
  );
}

export function Nav() {
  const social = socialLinks();
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
          {social.length > 0 && (
            <ul className="hidden items-center gap-1 sm:flex">
              {social.map(({ key, href, label, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (opens in a new tab)`}
                    className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          )}
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
          {social.map(({ key, href, label, Icon }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 py-3 text-muted hover:text-fg"
              >
                <Icon /> {key === "twitter" ? "X (Twitter)" : "pump.fun"}
                <span className="sr-only">({label}, opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
