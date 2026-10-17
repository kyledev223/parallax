import { WIDE_GAP_PP } from "@/lib/gap";
import { pp, usdCompact, VENUE_LABEL, venueUrl } from "@/lib/format";
import type { EventRow, VenueId } from "@/lib/types";
import { ExternalIcon } from "../PageShell";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { RelativeTime } from "../ui/RelativeTime";

const KEY_CLASS: Record<VenueId, string> = { polymarket: "bg-series-pm", kalshi: "bg-series-ks" };

function VenueCard({ row, venue }: { row: EventRow; venue: VenueId }) {
  const q = row.quotes[venue];
  const href = q?.url ?? venueUrl(row.pair, venue);
  const change = q?.change24h == null ? null : Math.round(q.change24h * 1000) / 10;

  return (
    <section aria-labelledby={`${venue}-label`} className="flex flex-col rounded-xl border border-line bg-panel p-5 sm:p-6">
      <h2 id={`${venue}-label`} className="flex items-center gap-2.5 font-sans text-sm text-muted">
        <span className={`h-0.5 w-4 rounded-full ${KEY_CLASS[venue]}`} aria-hidden="true" />
        {VENUE_LABEL[venue]}
      </h2>
      {q ? (
        <>
          <p className="mt-4 text-[clamp(2.5rem,6vw,3.5rem)] leading-none text-fg">
            <AnimatedNumber value={q.yesProbability} format="pct" />
            <span className="sr-only"> chance of yes</span>
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">24h change</dt>
              <dd className={`num mt-0.5 ${change == null ? "text-muted" : change > 0 ? "text-up" : change < 0 ? "text-down" : "text-fg"}`}>
                {change != null && change !== 0 && <span aria-hidden="true">{change > 0 ? "▲ " : "▼ "}</span>}
                {change == null ? "Not reported" : pp(change)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">24h volume</dt>
              <dd className="num mt-0.5 text-fg">{usdCompact(q.volume24h)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">Price as of</dt>
              <dd className="mt-0.5 text-fg">
                <RelativeTime iso={q.lastUpdated} />
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <div className="mt-4 flex-1">
          <p className="text-2xl text-muted">Unavailable</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {VENUE_LABEL[venue]} didn&apos;t return a price just now. The other venue is shown on its own, without a gap.
          </p>
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 self-start text-sm text-accent underline-offset-4 hover:text-accent-hover hover:underline"
      >
        View on {VENUE_LABEL[venue]}
        <ExternalIcon />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}

function sentence(gap: number | null): string {
  if (gap == null) return "No gap while one venue is unavailable.";
  if (Math.abs(gap) < 0.5) return "The two venues agree to within half a point.";
  const higher = gap > 0 ? "Polymarket" : "Kalshi";
  return `${higher} prices yes ${Math.abs(gap).toFixed(1)} points higher.`;
}

/** The space between the two cards: two lenses, offset by the gap. */
function GapLens({ row }: { row: EventRow }) {
  const gap = row.gapPp;
  // Centers drift apart as the gap widens (Polymarket left, Kalshi right, as in the cards).
  const half = 4 + Math.min(Math.abs(gap ?? 0), 10) * 2.4;
  const wide = gap != null && Math.abs(gap) >= WIDE_GAP_PP;
  return (
    <section aria-labelledby="gap-label" className="flex flex-col items-center justify-center px-2 py-6 text-center lg:w-56">
      <svg viewBox="0 0 120 64" width="120" height="64" aria-hidden="true" className="mb-3">
        <circle cx={60 - half} cy="32" r="26" fill="none" stroke="var(--series-pm)" strokeWidth="1.5" />
        <circle cx={60 + half} cy="32" r="26" fill="none" stroke="var(--series-ks)" strokeWidth="1.5" />
      </svg>
      <h2 id="gap-label" className="font-sans text-sm text-muted">
        Gap
      </h2>
      <p className={`num mt-1 text-4xl ${wide ? "text-accent" : "text-fg"}`}>{pp(gap)}</p>
      <p className="mt-2 max-w-[22ch] text-sm leading-snug text-muted">{sentence(gap)}</p>
      {row.stale && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-down" aria-hidden="true" />
          Stale: a price is over 10 minutes old
        </p>
      )}
    </section>
  );
}

export function QuoteCards({ row }: { row: EventRow }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-2">
      <VenueCard row={row} venue="polymarket" />
      <GapLens row={row} />
      <VenueCard row={row} venue="kalshi" />
    </div>
  );
}

export function QuoteCardsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_14rem_1fr] lg:gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`space-y-4 p-6 ${i === 1 ? "" : "rounded-xl border border-line bg-panel"}`}>
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-12 w-36" />
          <div className="skeleton h-3 w-40" />
        </div>
      ))}
    </div>
  );
}
