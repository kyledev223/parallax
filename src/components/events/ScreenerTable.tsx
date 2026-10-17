"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { isStale, WIDE_GAP_PP } from "@/lib/gap";
import { pct, pp, shortDate, usdCompact, VENUE_LABEL } from "@/lib/format";
import type { EventRow } from "@/lib/types";
import { useNow } from "../ui/useNow";
import { GapBar } from "./GapBar";

type SortKey = "event" | "category" | "polymarket" | "kalshi" | "gap" | "volume" | "resolves";
type Dir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; numeric: boolean; firstDir: Dir; className?: string }[] = [
  // Category is hidden on small screens; the filter pills cover it there.
  { key: "event", label: "Event", numeric: false, firstDir: "asc" },
  { key: "category", label: "Category", numeric: false, firstDir: "asc", className: "hidden sm:table-cell" },
  { key: "polymarket", label: "Polymarket", numeric: true, firstDir: "desc" },
  { key: "kalshi", label: "Kalshi", numeric: true, firstDir: "desc" },
  { key: "gap", label: "Gap", numeric: true, firstDir: "desc" },
  { key: "volume", label: "24h volume", numeric: true, firstDir: "desc" },
  { key: "resolves", label: "Resolves", numeric: true, firstDir: "asc" },
];

const SORT_LABEL: Record<SortKey, string> = {
  event: "event name",
  category: "category",
  polymarket: "Polymarket probability",
  kalshi: "Kalshi probability",
  gap: "widest gap",
  volume: "24-hour volume",
  resolves: "resolution date",
};

function value(row: EventRow, key: SortKey): number | string | null {
  switch (key) {
    case "event":
      return row.pair.title.toLowerCase();
    case "category":
      return row.pair.category;
    case "polymarket":
      return row.quotes.polymarket?.yesProbability ?? null;
    case "kalshi":
      return row.quotes.kalshi?.yesProbability ?? null;
    case "gap":
      return row.gapPp == null ? null : Math.abs(row.gapPp);
    case "volume":
      return row.volume24h;
    case "resolves":
      return Date.parse(row.pair.resolutionDate);
  }
}

function compare(a: EventRow, b: EventRow, key: SortKey, dir: Dir): number {
  const va = value(a, key);
  const vb = value(b, key);
  // Missing values always sink to the bottom, whichever way we sort.
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
  return (dir === "asc" ? c : -c) || a.pair.title.localeCompare(b.pair.title);
}

function SortIcon({ active, dir }: { active: boolean; dir: Dir }) {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true" className={active ? "text-accent" : "text-line"}>
      <path d="M4 0 8 4H0z" fill="currentColor" opacity={active && dir === "asc" ? 1 : 0.35} />
      <path d="M4 10 0 6h8z" fill="currentColor" opacity={active && dir === "desc" ? 1 : 0.35} />
    </svg>
  );
}

export function ScreenerTable({ rows }: { rows: EventRow[] }) {
  const now = useNow(30_000);
  const captionId = useId();
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "gap", dir: "desc" });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.pair.category, (counts.get(r.pair.category) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const visible = useMemo(
    () =>
      rows
        .filter((r) => category === "All" || r.pair.category === category)
        .sort((a, b) => compare(a, b, sort.key, sort.dir)),
    [rows, category, sort],
  );

  function toggle(key: SortKey) {
    const col = COLUMNS.find((c) => c.key === key)!;
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: col.firstDir }));
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center">
        <p className="text-fg">No paired events to show right now.</p>
        <p className="mt-1 text-sm text-muted">Prices may still be loading. Check back in a minute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[["All", rows.length] as const, ...categories].map(([c, n]) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-accent/70 bg-accent/10 text-fg" : "border-line text-muted hover:border-muted hover:text-fg"
              }`}
            >
              {c} <span className="num text-xs text-muted">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm sm:min-w-[760px]" aria-describedby={captionId}>
          <caption id={captionId} className="sr-only">
            {visible.length} paired events{category === "All" ? "" : ` in ${category}`}, sorted by {SORT_LABEL[sort.key]},{" "}
            {sort.dir === "asc" ? "ascending" : "descending"}. Gap is Polymarket minus Kalshi, in percentage points.
          </caption>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              {COLUMNS.map((col, i) => {
                const active = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={`whitespace-nowrap px-2 py-0 font-normal sm:px-3 ${col.numeric ? "text-right" : ""} ${col.className ?? ""} ${
                      i === 0 ? "sticky left-0 z-10 bg-panel pl-4 sm:pl-5" : ""
                    } ${i === COLUMNS.length - 1 ? "pr-4 sm:pr-5" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={`inline-flex items-center gap-1.5 py-3 hover:text-fg ${active ? "text-fg" : ""} ${
                        col.numeric ? "flex-row-reverse" : ""
                      }`}
                    >
                      {col.label}
                      <SortIcon active={active} dir={sort.dir} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const stale =
                now == null
                  ? r.stale
                  : Object.values(r.quotes).some((q) => q && isStale(q.lastUpdated, now));
              const wide = r.gapPp != null && Math.abs(r.gapPp) >= WIDE_GAP_PP;
              return (
                <tr key={r.pair.id} className="group border-b border-line/70 last:border-0 hover:bg-bg/40">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[9.5rem] bg-panel py-3 pl-4 pr-2 sm:max-w-[13rem] text-left font-normal group-hover:bg-[#121620] sm:max-w-[22rem] sm:pl-5"
                  >
                    <Link href={`/events/${r.pair.id}`} className="text-fg underline-offset-4 hover:text-accent-hover hover:underline">
                      <span className="sm:hidden">{r.pair.shortName}</span>
                      <span className="hidden sm:inline">{r.pair.title}</span>
                    </Link>
                    {(stale || r.unavailable.length > 0) && (
                      <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                        {stale && (
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-down" aria-hidden="true" /> Stale price
                          </span>
                        )}
                        {r.unavailable.map((v) => (
                          <span key={v}>{VENUE_LABEL[v]} unavailable</span>
                        ))}
                      </span>
                    )}
                  </th>
                  <td className="hidden px-3 py-3 text-muted sm:table-cell">{r.pair.category}</td>
                  <td className="num px-2 py-3 text-right sm:px-3">{pct(r.quotes.polymarket?.yesProbability)}</td>
                  <td className="num px-2 py-3 text-right sm:px-3">{pct(r.quotes.kalshi?.yesProbability)}</td>
                  <td className="px-2 py-3 text-right sm:px-3">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="hidden md:inline-flex">
                        <GapBar gap={r.gapPp} />
                      </span>
                      <span className={`num w-[4.25rem] ${wide ? "text-accent" : r.gapPp == null ? "text-muted" : "text-fg"}`}>
                        {pp(r.gapPp)}
                      </span>
                    </span>
                  </td>
                  <td className="num px-3 py-3 text-right text-muted">{usdCompact(r.volume24h)}</td>
                  <td className="num whitespace-nowrap py-3 pl-3 pr-4 text-right text-muted sm:pr-5">
                    {shortDate(r.pair.resolutionDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="p-8 text-center text-sm text-muted">
            No {category} events right now.{" "}
            <button type="button" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent" onClick={() => setCategory("All")}>
              Show all events
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">
        Gap = Polymarket − Kalshi, in percentage points. Positive means Polymarket prices yes higher. Gaps of {WIDE_GAP_PP}pp or
        more are highlighted.
      </p>
    </div>
  );
}

export function ScreenerSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-line/70 px-5 py-4 last:border-0">
            <div className="skeleton h-3.5 w-64" />
            <div className="skeleton ml-auto h-3.5 w-14" />
            <div className="skeleton h-3.5 w-14" />
            <div className="skeleton h-3.5 w-16" />
            <div className="skeleton hidden h-3.5 w-12 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
