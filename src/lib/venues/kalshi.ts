/**
 * Kalshi, read-only and unauthenticated.
 * - Markets: GET https://external-api.kalshi.com/trade-api/v2/markets?tickers=A,B,C
 * - History: GET /series/{series_ticker}/markets/{ticker}/candlesticks?start_ts&end_ts&period_interval
 * Prices are fixed-point dollar strings (`*_dollars`), quantities fixed-point counts (`*_fp`).
 * Docs: https://docs.kalshi.com (Get Markets, Get Market Candlesticks, Fixed-Point Representation).
 */
import type { EventPair, HistoryPoint, VenueQuote } from "../types";
import { chunk, getJson, type FetchLike } from "./http";
import { impliedProbability, toNumber } from "./price";

export const KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2";

/** The subset of Kalshi's Market schema we read. */
export interface KalshiMarket {
  ticker: string;
  event_ticker?: string;
  status?: string;
  yes_bid_dollars?: string | null;
  yes_ask_dollars?: string | null;
  last_price_dollars?: string | null;
  previous_yes_bid_dollars?: string | null;
  previous_yes_ask_dollars?: string | null;
  previous_price_dollars?: string | null;
  volume_24h_fp?: string | null;
  close_time?: string | null;
}

interface KalshiCandlestick {
  end_period_ts: number;
  yes_bid?: { close_dollars?: string | null } | null;
  yes_ask?: { close_dollars?: string | null } | null;
  price?: { close_dollars?: string | null } | null;
}

/**
 * Normalizes one Kalshi market. Kalshi exposes no per-price timestamp
 * (`updated_time` is metadata only), so lastUpdated is when we read it.
 */
export function normalizeKalshi(m: KalshiMarket, pair: EventPair, observedAt: string): VenueQuote | null {
  const p = impliedProbability({ bid: m.yes_bid_dollars, ask: m.yes_ask_dollars, last: m.last_price_dollars });
  if (p == null) return null;
  const prev = impliedProbability({
    bid: m.previous_yes_bid_dollars,
    ask: m.previous_yes_ask_dollars,
    last: m.previous_price_dollars,
  });
  const invert = Boolean(pair.venues.kalshi.invert);
  const yes = invert ? 1 - p : p;
  const change = prev == null ? null : invert ? prev - p : p - prev;
  const contracts = toNumber(m.volume_24h_fp) ?? 0;

  return {
    eventId: pair.id,
    venue: "kalshi",
    yesProbability: yes,
    // Contracts × current yes price ≈ dollars traded. Approximate, see /about.
    volume24h: Math.round(contracts * p * 100) / 100,
    lastUpdated: observedAt,
    url: pair.venues.kalshi.url ?? `https://kalshi.com/markets/${pair.venues.kalshi.seriesTicker.toLowerCase()}`,
    change24h: change,
  };
}

export async function fetchKalshiMarkets(tickers: string[], fetchImpl?: FetchLike): Promise<Map<string, KalshiMarket>> {
  const out = new Map<string, KalshiMarket>();
  for (const group of chunk([...new Set(tickers)], 50)) {
    const qs = new URLSearchParams({ tickers: group.join(","), limit: "1000" });
    const res = await getJson<{ markets?: KalshiMarket[] }>(`${KALSHI_BASE}/markets?${qs}`, { fetchImpl });
    if (!Array.isArray(res.markets)) throw new Error("Kalshi /markets returned no markets array");
    for (const m of res.markets) if (m?.ticker) out.set(m.ticker, m);
  }
  return out;
}

export function candlesToHistory(candles: KalshiCandlestick[], invert = false): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  for (const c of candles) {
    const p = impliedProbability({
      bid: c.yes_bid?.close_dollars,
      ask: c.yes_ask?.close_dollars,
      last: c.price?.close_dollars,
    });
    if (p == null || !Number.isFinite(c.end_period_ts)) continue;
    out.push({ t: c.end_period_ts, p: invert ? 1 - p : p });
  }
  return out;
}

export async function fetchKalshiHistory(
  pair: EventPair,
  { fetchImpl, now = Date.now(), days = 7, periodMinutes = 60 }: { fetchImpl?: FetchLike; now?: number; days?: number; periodMinutes?: 1 | 60 | 1440 } = {},
): Promise<HistoryPoint[]> {
  const { ticker, seriesTicker, invert } = pair.venues.kalshi;
  const end = Math.floor(now / 1000);
  const qs = new URLSearchParams({
    start_ts: String(end - days * 86400),
    end_ts: String(end),
    period_interval: String(periodMinutes),
  });
  const url = `${KALSHI_BASE}/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(ticker)}/candlesticks?${qs}`;
  const res = await getJson<{ candlesticks?: KalshiCandlestick[] }>(url, { fetchImpl });
  return candlesToHistory(res.candlesticks ?? [], Boolean(invert));
}
