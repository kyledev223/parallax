import Link from "next/link";
import { WIDE_GAP_PP } from "@/lib/gap";
import { pct, pp, VENUE_LABEL, VENUE_SHORT } from "@/lib/format";
import type { EventRow } from "@/lib/types";

/**
 * Ticker items stay out of the tab order (a moving strip of 16 links before
 * the nav is a keyboard trap in all but name); keyboard users get the static
 * "Live gaps" link to the full screener instead. Screen readers can still
 * reach every item.
 */
function Items({ rows, duplicate = false }: { rows: EventRow[]; duplicate?: boolean }) {
  return (
    <ul className={`flex shrink-0 items-center ${duplicate ? "ticker-dup" : ""}`} aria-hidden={duplicate || undefined}>
      {rows.map((row) => {
        const wide = row.gapPp != null && Math.abs(row.gapPp) >= WIDE_GAP_PP;
        return (
          <li key={row.pair.id} className="flex items-center">
            <Link
              href={`/events/${row.pair.id}`}
              tabIndex={-1}
              className="flex items-center gap-2.5 whitespace-nowrap px-5 py-2 text-[13px] hover:text-accent-hover"
            >
              <span className="text-fg">{row.pair.shortName}</span>
              {row.leader && (
                <span className="num text-muted">
                  <abbr title={VENUE_LABEL[row.leader.venue]} className="no-underline">
                    {VENUE_SHORT[row.leader.venue]}
                  </abbr>{" "}
                  {pct(row.leader.yesProbability)}
                </span>
              )}
              <span className={`num ${wide ? "text-accent" : "text-muted"}`}>
                <span className="sr-only">gap </span>
                {row.gapPp == null ? "1 venue" : pp(row.gapPp)}
              </span>
            </Link>
            <span className="h-3 w-px bg-line" aria-hidden="true" />
          </li>
        );
      })}
    </ul>
  );
}

export function Ticker({ rows }: { rows: EventRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="border-b border-line bg-panel px-5 py-2 text-[13px] text-muted">
        Live gaps will appear here once prices load.
      </div>
    );
  }
  // Roughly constant speed regardless of how many events are tracked.
  const duration = `${Math.max(40, rows.length * 5)}s`;
  return (
    <section aria-label="Live gaps between venues" className="flex border-b border-line bg-panel">
      <Link
        href="/events"
        className="relative z-10 flex shrink-0 items-center gap-2 border-r border-line bg-panel px-4 text-xs text-muted hover:text-fg"
      >
        <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
        Live gaps
        <span className="sr-only">: open the full screener</span>
      </Link>
      <div className="ticker relative min-w-0 flex-1 overflow-hidden">
        <div
          className="ticker-track flex w-max animate-ticker"
          style={{ "--ticker-duration": duration } as React.CSSProperties}
        >
          <Items rows={rows} />
          <Items rows={rows} duplicate />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-panel to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-panel to-transparent" />
      </div>
    </section>
  );
}

export function TickerSkeleton() {
  return (
    <div className="flex h-[37px] items-center gap-6 overflow-hidden border-b border-line bg-panel px-5" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-40 shrink-0" />
      ))}
    </div>
  );
}
