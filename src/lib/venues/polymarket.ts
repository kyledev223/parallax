/**
 * Polymarket, read-only.
 * - Market metadata and prices: Gamma API, GET https://gamma-api.polymarket.com/markets?slug=…
 *   (repeatable `slug`, up to 100 per request; `closed=any` includes resolved markets).
 * - Price history: CLOB API, GET https://clob.polymarket.com/prices-history?market=<token id>
 * Docs: https://docs.polymarket.com (Gamma + CLOB OpenAPI specs).
 */
import type { EventPair, HistoryPoint, VenueQuote } from "../types";
import { chunk, getJson, type FetchLike } from "./http";
import { earliest, impliedProbability, parseJsonArray, toNumber } from "./price";

export const GAMMA_BASE = "https://gamma-api.polymarket.com";
export const CLOB_BASE = "https://clob.polymarket.com";

/** The subset of Gamma's Market schema we read. Numeric-looking fields can arrive as strings. */
export interface GammaMarket {
  slug: string;
  question?: string | null;
  outcomes?: string | null;
  outcomePrices?: string | null;
  clobTokenIds?: string | null;
  bestBid?: number | string | null;
  bestAsk?: number | string | null;
  lastTradePrice?: number | string | null;
  oneDayPriceChange?: number | string | null;
  volume24hr?: number | string | null;
  updatedAt?: string | null;
  closed?: boolean | null;
  events?: { slug?: string | null }[] | null;
}

function outcomeIndex(m: GammaMarket, pair: EventPair): number {
  const outcomes = parseJsonArray(m.outcomes) ?? ["Yes", "No"];
  if (!pair.venues.polymarket.outcome) return 0;
  const want = pair.venues.polymarket.outcome.toLowerCase();
  return outcomes.findIndex((o) => o.toLowerCase() === want);
}

/** Normalizes one Gamma market into a quote for the pair. Returns null if it can't be priced. */
export function normalizePolymarket(m: GammaMarket, pair: EventPair, observedAt: string): VenueQuote | null {
  const idx = outcomeIndex(m, pair);
  if (idx !== 0 && idx !== 1) return null;

  // bestBid/bestAsk/lastTradePrice describe the first outcome's token.
  let p0 = impliedProbability({ bid: m.bestBid, ask: m.bestAsk, last: m.lastTradePrice });
  if (p0 == null) p0 = toNumber(parseJsonArray(m.outcomePrices)?.[0]);
  if (p0 == null || p0 < 0 || p0 > 1) return null;

  const change = toNumber(m.oneDayPriceChange);
  const eventSlug = m.events?.[0]?.slug;

  return {
    eventId: pair.id,
    venue: "polymarket",
    yesProbability: idx === 0 ? p0 : 1 - p0,
    volume24h: toNumber(m.volume24hr) ?? 0,
    // Gamma refreshes updatedAt as prices sync; never report a time later than when we looked.
    lastUpdated: earliest(m.updatedAt, observedAt),
    url:
      pair.venues.polymarket.url ??
      (eventSlug ? `https://polymarket.com/event/${eventSlug}/${m.slug}` : `https://polymarket.com/market/${m.slug}`),
    change24h: change == null ? null : idx === 0 ? change : -change,
  };
}

/** Token id whose price is the pair's yes probability, for the price-history endpoint. */
export function yesTokenId(m: GammaMarket, pair: EventPair): { tokenId: string; invert: boolean } | null {
  const ids = parseJsonArray(m.clobTokenIds);
  const idx = outcomeIndex(m, pair);
  if (!ids || idx < 0 || !ids[idx]) return null;
  // Each outcome has its own token, so no inversion is needed.
  return { tokenId: ids[idx], invert: false };
}

export async function fetchPolymarketMarkets(
  slugs: string[],
  fetchImpl?: FetchLike,
): Promise<Map<string, GammaMarket>> {
  const out = new Map<string, GammaMarket>();
  for (const group of chunk([...new Set(slugs)], 100)) {
    const qs = new URLSearchParams(group.map((s) => ["slug", s]));
    qs.set("closed", "any");
    const markets = await getJson<GammaMarket[]>(`${GAMMA_BASE}/markets?${qs}`, { fetchImpl });
    if (!Array.isArray(markets)) throw new Error("Gamma /markets returned a non-array");
    for (const m of markets) if (m?.slug) out.set(m.slug, m);
  }
  return out;
}

export async function fetchPolymarketHistory(
  tokenId: string,
  { fetchImpl, interval = "1w", fidelityMinutes = 60 }: { fetchImpl?: FetchLike; interval?: string; fidelityMinutes?: number } = {},
): Promise<HistoryPoint[]> {
  const qs = new URLSearchParams({ market: tokenId, interval, fidelity: String(fidelityMinutes) });
  const res = await getJson<{ history?: { t: number; p: number }[] }>(`${CLOB_BASE}/prices-history?${qs}`, { fetchImpl });
  return (res.history ?? [])
    .filter((h) => Number.isFinite(h?.t) && Number.isFinite(h?.p))
    .map((h) => ({ t: h.t, p: h.p }));
}
