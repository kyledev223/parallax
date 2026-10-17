import Link from "next/link";
import { WIDE_GAP_PP } from "@/lib/gap";
import { pp } from "@/lib/format";
import type { EventRow } from "@/lib/types";

type Kind = "gap" | "move";

export function Chips({ rows, kind, label }: { rows: EventRow[]; kind: Kind; label: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Nothing to show yet. Check back after the next price refresh.</p>;
  }
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {rows.map((r) => {
        const v = kind === "gap" ? r.gapPp : r.move24hPp;
        const tone =
          kind === "gap"
            ? v != null && Math.abs(v) >= WIDE_GAP_PP
              ? "text-accent"
              : "text-muted"
            : v != null && v > 0
              ? "text-up"
              : v != null && v < 0
                ? "text-down"
                : "text-muted";
        return (
          <li key={r.pair.id}>
            <Link
              href={`/events/${r.pair.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] transition-colors hover:border-accent/60"
            >
              <span>{r.pair.shortName}</span>
              <span className={`num ${tone}`}>
                {kind === "move" && v != null && <span aria-hidden="true">{v > 0 ? "▲ " : v < 0 ? "▼ " : ""}</span>}
                {pp(v)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
