import type { EventPair, EventRow, VenueId, VenueQuote } from "./types";

export const STALE_AFTER_MS = 10 * 60 * 1000;
/** Gaps at or above this many points get highlighted. */
export const WIDE_GAP_PP = 5;

/** Gap in percentage points, A − B, rounded to 0.1pp. */
export function gapPp(a: number, b: number): number {
  return Math.round((a - b) * 1000) / 10;
}

export function isStale(lastUpdated: string, now: number): boolean {
  const t = Date.parse(lastUpdated);
  if (Number.isNaN(t)) return true;
  return now - t > STALE_AFTER_MS;
}

export function buildRow(
  pair: EventPair,
  quotes: Partial<Record<VenueId, VenueQuote>>,
  now: number,
): EventRow {
  const pm = quotes.polymarket;
  const ks = quotes.kalshi;
  const present = [pm, ks].filter((q): q is VenueQuote => Boolean(q));

  const unavailable: VenueId[] = [];
  if (!pm) unavailable.push("polymarket");
  if (!ks) unavailable.push("kalshi");

  let leader: EventRow["leader"] = null;
  for (const q of present) {
    if (!leader || q.yesProbability > leader.yesProbability) {
      leader = { venue: q.venue, yesProbability: q.yesProbability };
    }
  }

  let move24hPp: number | null = null;
  for (const q of present) {
    if (q.change24h == null) continue;
    const pp = Math.round(q.change24h * 1000) / 10;
    if (move24hPp == null || Math.abs(pp) > Math.abs(move24hPp)) move24hPp = pp;
  }

  return {
    pair,
    quotes,
    unavailable,
    gapPp: pm && ks ? gapPp(pm.yesProbability, ks.yesProbability) : null,
    stale: present.some((q) => isStale(q.lastUpdated, now)),
    leader,
    move24hPp,
    volume24h: present.reduce((sum, q) => sum + (q.volume24h || 0), 0),
  };
}

export function absGap(row: EventRow): number {
  return row.gapPp == null ? -1 : Math.abs(row.gapPp);
}

export function byWidestGap(a: EventRow, b: EventRow): number {
  return absGap(b) - absGap(a);
}

export function summarize(rows: EventRow[]) {
  const gaps = rows.filter((r) => r.gapPp != null).map((r) => Math.abs(r.gapPp!));
  const widest = [...rows].sort(byWidestGap)[0] ?? null;
  return {
    eventsTracked: rows.length,
    widestGapPp: gaps.length ? Math.max(...gaps) : null,
    widestGapEvent: widest && widest.gapPp != null ? widest : null,
    combinedVolume24h: rows.reduce((s, r) => s + r.volume24h, 0),
    averageGapPp: gaps.length ? Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10) / 10 : null,
  };
}
