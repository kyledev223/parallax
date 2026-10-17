/**
 * Joins curated pairs with live quotes from every venue. Framework-free so it
 * can run in tests and scripts; src/lib/data.ts wraps it in Next's cache.
 */
import { buildRow } from "./gap";
import type { EventPair, EventRow, VenueId, VenueQuote } from "./types";
import type { FetchLike } from "./venues/http";
import { fetchKalshiMarkets, normalizeKalshi } from "./venues/kalshi";
import { fetchPolymarketMarkets, normalizePolymarket } from "./venues/polymarket";

export interface VenueStatus {
  ok: boolean;
  /** Short, user-safe reason when the venue request failed. */
  error?: string;
  /** Pairs on this venue we couldn't price (missing market or empty book). */
  missing: string[];
  /** Pairs served from the last good quote because the request failed. */
  fromLastGood: string[];
}

export interface Snapshot {
  fetchedAt: string;
  rows: EventRow[];
  venues: Record<VenueId, VenueStatus>;
}

/** Remembers the last successful quote per venue and pair, so an outage shows aging prices flagged stale instead of nothing. */
export type QuoteMemory = Map<string, VenueQuote>;

function failure(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.length > 120 ? `${msg.slice(0, 117)}...` : msg;
}

export async function loadSnapshot(
  pairs: EventPair[],
  { fetchImpl, now = Date.now(), memory }: { fetchImpl?: FetchLike; now?: number; memory?: QuoteMemory } = {},
): Promise<Snapshot> {
  const observedAt = new Date(now).toISOString();
  const [pm, ks] = await Promise.allSettled([
    fetchPolymarketMarkets(
      pairs.map((p) => p.venues.polymarket.slug),
      fetchImpl,
    ),
    fetchKalshiMarkets(
      pairs.map((p) => p.venues.kalshi.ticker),
      fetchImpl,
    ),
  ]);

  const status = (r: PromiseSettledResult<unknown>): VenueStatus => ({
    ok: r.status === "fulfilled",
    error: r.status === "rejected" ? failure(r.reason) : undefined,
    missing: [],
    fromLastGood: [],
  });
  const venues: Record<VenueId, VenueStatus> = { polymarket: status(pm), kalshi: status(ks) };

  function resolve(venue: VenueId, pair: EventPair, live: () => VenueQuote | null, ok: boolean): VenueQuote | undefined {
    const key = `${venue}:${pair.id}`;
    if (ok) {
      const q = live();
      if (q) {
        memory?.set(key, q);
        return q;
      }
      venues[venue].missing.push(pair.id);
      return undefined;
    }
    const remembered = memory?.get(key);
    if (remembered) venues[venue].fromLastGood.push(pair.id);
    return remembered;
  }

  const rows = pairs.map((pair) => {
    const polymarket = resolve(
      "polymarket",
      pair,
      () => {
        const m = pm.status === "fulfilled" ? pm.value.get(pair.venues.polymarket.slug) : undefined;
        return m ? normalizePolymarket(m, pair, observedAt) : null;
      },
      pm.status === "fulfilled",
    );
    const kalshi = resolve(
      "kalshi",
      pair,
      () => {
        const m = ks.status === "fulfilled" ? ks.value.get(pair.venues.kalshi.ticker) : undefined;
        return m ? normalizeKalshi(m, pair, observedAt) : null;
      },
      ks.status === "fulfilled",
    );
    const quotes: Partial<Record<VenueId, VenueQuote>> = {};
    if (polymarket) quotes.polymarket = polymarket;
    if (kalshi) quotes.kalshi = kalshi;
    return buildRow(pair, quotes, now);
  });

  return { fetchedAt: observedAt, rows, venues };
}
