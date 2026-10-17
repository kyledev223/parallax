import { byWidestGap } from "./gap";
import type { EventRow } from "./types";

const paired = (rows: EventRow[]) => rows.filter((r) => r.gapPp != null);

/** Rows priced on both venues, alphabetical by short name. */
export function pairedRows(rows: EventRow[]): EventRow[] {
  return paired(rows).sort((a, b) => a.pair.shortName.localeCompare(b.pair.shortName));
}

export function widest(rows: EventRow[], n = 6): EventRow[] {
  return paired(rows).sort(byWidestGap).slice(0, n);
}

/** Largest absolute 24h moves on either venue. Rows with no reported move are left out. */
export function movers(rows: EventRow[], n = 6): EventRow[] {
  return rows
    .filter((r) => r.move24hPp != null && r.move24hPp !== 0)
    .sort((a, b) => Math.abs(b.move24hPp!) - Math.abs(a.move24hPp!))
    .slice(0, n);
}

/** Events 2–5pp apart: the ones a typical 5pp alert is closest to firing on. */
export function nearlyOpen(rows: EventRow[], n = 6): EventRow[] {
  return paired(rows)
    .filter((r) => Math.abs(r.gapPp!) >= 2 && Math.abs(r.gapPp!) < 5)
    .sort(byWidestGap)
    .slice(0, n);
}
