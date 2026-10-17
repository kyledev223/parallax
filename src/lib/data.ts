/**
 * Server-only data access, cached with Next's `use cache`. Everything the
 * client sees comes through here, so API calls and rate limits stay on the server.
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPair, getPairs } from "./event-map";
import { fetchNews, type NewsResult } from "./news";
import { loadSnapshot, type QuoteMemory, type Snapshot } from "./snapshot";
import type { HistoryPoint, VenueId } from "./types";
import { fetchKalshiHistory } from "./venues/kalshi";
import { fetchPolymarketHistory, fetchPolymarketMarkets, yesTokenId } from "./venues/polymarket";

// Per server instance. Lets a venue outage degrade to last-known prices (flagged stale).
const memory: QuoteMemory = new Map();

/**
 * All pairs with live quotes, refreshed in the background every 30s. Pages
 * that read this inherit the 30s revalidate; because both the page and this
 * entry serve stale-while-revalidate, what a visitor sees is typically
 * 30–60s old (worst case about 90s with the client's 30s refresh).
 */
export async function getSnapshot(): Promise<Snapshot> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  cacheTag("snapshot");
  return loadSnapshot(getPairs(), { memory });
}

export interface EventHistory {
  /** unix seconds when fetched */
  fetchedAt: number;
  series: Record<VenueId, HistoryPoint[] | null>;
  errors: Partial<Record<VenueId, string>>;
}

/** Hourly odds history for the last 7 days on each venue. */
export async function getEventHistory(id: string): Promise<EventHistory | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`history:${id}`);

  const pair = getPair(id);
  if (!pair) return null;
  const now = Date.now();

  const [pm, ks] = await Promise.allSettled([
    (async () => {
      const market = (await fetchPolymarketMarkets([pair.venues.polymarket.slug])).get(pair.venues.polymarket.slug);
      const token = market && yesTokenId(market, pair);
      if (!token) throw new Error("market or token id not found");
      return fetchPolymarketHistory(token.tokenId);
    })(),
    fetchKalshiHistory(pair, { now }),
  ]);

  const msg = (r: PromiseRejectedResult) => (r.reason instanceof Error ? r.reason.message : String(r.reason));
  return {
    fetchedAt: Math.floor(now / 1000),
    series: {
      polymarket: pm.status === "fulfilled" ? pm.value : null,
      kalshi: ks.status === "fulfilled" ? ks.value : null,
    },
    errors: {
      ...(pm.status === "rejected" ? { polymarket: msg(pm) } : {}),
      ...(ks.status === "rejected" ? { kalshi: msg(ks) } : {}),
    },
  };
}

/** Related headlines, when the news feature flag is on. Cached for 15 minutes. */
export async function getEventNews(id: string): Promise<NewsResult> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  cacheTag(`news:${id}`);
  const pair = getPair(id);
  if (!pair) return { status: "disabled" };
  return fetchNews(pair);
}
