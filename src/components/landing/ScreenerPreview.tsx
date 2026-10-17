import { WIDE_GAP_PP } from "@/lib/gap";
import { pct, pp, shortDate, usdCompact } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { EventRow } from "@/lib/types";

/** A non-interactive rendering of the /events screener, framed in a faux browser. */
export function ScreenerPreview({ rows }: { rows: EventRow[] }) {
  const sorted = [...rows]
    .filter((r) => r.gapPp != null)
    .sort((a, b) => Math.abs(b.gapPp!) - Math.abs(a.gapPp!))
    .slice(0, 7);

  return (
    <figure className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-10 bottom-0 -z-10 rounded-[2rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,179,161,0.16),transparent_70%)]"
      />
      <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
          </div>
          <div className="mx-auto w-full max-w-sm truncate rounded-md border border-line bg-bg px-3 py-1 text-center text-xs text-muted">
            {new URL(SITE.url).host}/events
          </div>
          <div className="w-[42px]" aria-hidden="true" />
        </div>

        <div aria-hidden="true" className="bg-bg/60">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
            <span className="font-display text-xl">Events</span>
            <span className="ml-2 hidden gap-1.5 text-xs sm:flex">
              {["All", "Politics", "Economics", "Crypto", "Sports"].map((c, i) => (
                <span
                  key={c}
                  className={`rounded-full border px-2.5 py-0.5 ${i === 0 ? "border-accent/60 text-accent" : "border-line text-muted"}`}
                >
                  {c}
                </span>
              ))}
            </span>
            <span className="ml-auto text-xs text-muted">Sorted by widest gap</span>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pl-3 pr-2 font-normal sm:px-5">Event</th>
                <th className="hidden px-3 py-2 font-normal lg:table-cell">Category</th>
                <th className="px-1.5 sm:px-3 py-2 text-right font-normal">Polymarket</th>
                <th className="px-1.5 sm:px-3 py-2 text-right font-normal">Kalshi</th>
                <th className="px-1.5 sm:px-3 py-2 text-right font-normal">Gap</th>
                <th className="hidden px-3 py-2 text-right font-normal md:table-cell">24h vol</th>
                <th className="hidden px-4 py-2 text-right font-normal sm:px-5 lg:table-cell">Resolves</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const wide = Math.abs(r.gapPp!) >= WIDE_GAP_PP;
                return (
                  <tr key={r.pair.id} className="border-b border-line/70 last:border-0">
                    <td className="max-w-[8.5rem] truncate py-2.5 pl-3 pr-2 sm:max-w-none sm:px-5">
                      <span className="sm:hidden">{r.pair.shortName}</span>
                      <span className="hidden sm:inline">{r.pair.title}</span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted lg:table-cell">{r.pair.category}</td>
                    <td className="num px-1.5 sm:px-3 py-2.5 text-right">{pct(r.quotes.polymarket?.yesProbability)}</td>
                    <td className="num px-1.5 sm:px-3 py-2.5 text-right">{pct(r.quotes.kalshi?.yesProbability)}</td>
                    <td className={`num py-2.5 pl-1.5 pr-3 text-right sm:px-3 ${wide ? "text-accent" : "text-muted"}`}>{pp(r.gapPp)}</td>
                    <td className="num hidden px-3 py-2.5 text-right text-muted md:table-cell">{usdCompact(r.volume24h)}</td>
                    <td className="num hidden px-4 py-2.5 text-right text-muted sm:px-5 lg:table-cell">
                      {shortDate(r.pair.resolutionDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <figcaption className="sr-only">
        Preview of the events screener, listing paired markets sorted by the widest gap between Polymarket and Kalshi.
      </figcaption>
    </figure>
  );
}
