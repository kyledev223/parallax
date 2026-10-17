import { VENUE_LABEL } from "@/lib/format";
import type { Snapshot } from "@/lib/snapshot";
import { VENUES } from "@/lib/types";
import { RelativeTime } from "../ui/RelativeTime";

/** Venue list. With a snapshot, each venue shows whether it's live, and when prices last updated. */
export function DataFrom({ snapshot }: { snapshot?: Pick<Snapshot, "venues" | "fetchedAt"> }) {
  return (
    <section aria-label="Data sources" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4 border-y border-line py-6">
        <h2 className="font-sans text-sm text-muted">Data from</h2>
        <ul className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          {VENUES.map((v) => {
            const s = snapshot?.venues[v];
            return (
              <li key={v} className="flex items-baseline gap-3">
                <span className="font-display text-3xl text-fg">{VENUE_LABEL[v]}</span>
                {s && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className={`size-1.5 rounded-full ${s.ok ? "bg-up" : "bg-down"}`} aria-hidden="true" />
                    {s.ok ? "Live" : "Unavailable"}
                  </span>
                )}
              </li>
            );
          })}
          <li className="text-sm text-muted">More venues soon</li>
        </ul>
        {snapshot && (
          <p className="text-xs text-muted sm:ml-auto">
            Updated <RelativeTime iso={snapshot.fetchedAt} className="text-fg" />
          </p>
        )}
      </div>
    </section>
  );
}
