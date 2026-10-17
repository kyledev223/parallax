import { VENUE_LABEL } from "@/lib/format";
import type { Snapshot } from "@/lib/snapshot";
import { VENUES } from "@/lib/types";

/** Plain-language notes when a venue is down or partly missing. Renders nothing when all is well. */
export function VenueNotes({ venues }: { venues: Snapshot["venues"] }) {
  const notes: { key: string; text: string }[] = [];
  for (const v of VENUES) {
    const s = venues[v];
    const other = VENUE_LABEL[v === "polymarket" ? "kalshi" : "polymarket"];
    if (!s.ok && s.fromLastGood.length) {
      notes.push({
        key: `${v}-lastgood`,
        text: `${VENUE_LABEL[v]} isn't responding, so its last known prices are shown. They're marked stale once they're more than 10 minutes old. ${other} prices are live.`,
      });
    } else if (!s.ok) {
      notes.push({
        key: `${v}-down`,
        text: `${VENUE_LABEL[v]} is unavailable right now, so its column is empty and gaps can't be measured. ${other} prices are still live.`,
      });
    } else if (s.missing.length) {
      notes.push({
        key: `${v}-missing`,
        text: `${VENUE_LABEL[v]} returned no usable price for ${s.missing.length} event${s.missing.length === 1 ? "" : "s"}. Those rows show ${other} only.`,
      });
    }
  }
  if (!notes.length) return null;
  return (
    <div role="status" className="space-y-2">
      {notes.map((n) => (
        <p key={n.key} className="flex gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-muted">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-down" aria-hidden="true" />
          {n.text}
        </p>
      ))}
    </div>
  );
}
