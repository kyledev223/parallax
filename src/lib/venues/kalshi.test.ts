import { describe, expect, it, vi } from "vitest";
import candles from "../__fixtures__/kalshi-candlesticks.json";
import fixture from "../__fixtures__/kalshi-markets.json";
import { brewers, NOW, OBSERVED_AT, pressSec } from "../__fixtures__/pairs";
import { candlesToHistory, fetchKalshiHistory, fetchKalshiMarkets, normalizeKalshi, type KalshiMarket } from "./kalshi";

const markets = fixture.markets as KalshiMarket[];
const byTicker = (t: string) => markets.find((m) => m.ticker === t)!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("normalizeKalshi", () => {
  it("normalizes a real Kalshi market from fixed-point strings", () => {
    const q = normalizeKalshi(byTicker("KXMLB-26-MIL"), brewers, OBSERVED_AT)!;
    expect(q.venue).toBe("kalshi");
    expect(q.yesProbability).toBeCloseTo(0.6545, 6); // mid of 0.6540 / 0.6550
    expect(q.change24h).toBeCloseTo(0.072, 6); // vs mid of 0.5780 / 0.5870 a day ago
    expect(q.volume24h).toBeCloseTo(612262.26 * 0.6545, 1);
    expect(q.lastUpdated).toBe(OBSERVED_AT);
    expect(q.url).toBe("https://kalshi.com/markets/kxmlb");
  });

  it("captures a big 24h move", () => {
    const q = normalizeKalshi(byTicker("KXZACHARIAOUT-26OCT-27JAN01"), pressSec, OBSERVED_AT)!;
    expect(q.yesProbability).toBeCloseTo(0.995, 6);
    expect(q.change24h).toBeCloseTo(0.67, 6);
  });

  it("inverts when the pair's yes is Kalshi's no", () => {
    const pair = { ...brewers, venues: { ...brewers.venues, kalshi: { ...brewers.venues.kalshi, invert: true } } };
    const q = normalizeKalshi(byTicker("KXMLB-26-MIL"), pair, OBSERVED_AT)!;
    expect(q.yesProbability).toBeCloseTo(0.3455, 6);
    expect(q.change24h).toBeCloseTo(-0.072, 6);
  });

  it("returns null for an empty book with no trades, and null change without history", () => {
    expect(
      normalizeKalshi({ ticker: "X", yes_bid_dollars: "0.0000", yes_ask_dollars: "1.0000", last_price_dollars: "0.0000" }, brewers, OBSERVED_AT),
    ).toBeNull();
    const q = normalizeKalshi({ ticker: "X", yes_bid_dollars: "0.40", yes_ask_dollars: "0.42" }, brewers, OBSERVED_AT)!;
    expect(q.change24h).toBeNull();
    expect(q.volume24h).toBe(0);
  });

  it("honors a url override", () => {
    const pair = { ...brewers, venues: { ...brewers.venues, kalshi: { ...brewers.venues.kalshi, url: "https://kalshi.com/x" } } };
    expect(normalizeKalshi(byTicker("KXMLB-26-MIL"), pair, OBSERVED_AT)?.url).toBe("https://kalshi.com/x");
  });
});

describe("fetchers", () => {
  it("batches tickers into a comma-separated query", async () => {
    const fetchImpl = vi.fn(async (_url: string) => json(fixture));
    const map = await fetchKalshiMarkets(["KXMLB-26-MIL", "KXSB-27-SF"], fetchImpl);
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://external-api.kalshi.com/trade-api/v2/markets");
    expect(url.searchParams.get("tickers")).toBe("KXMLB-26-MIL,KXSB-27-SF");
    expect(map.size).toBe(markets.length);
  });

  it("does not retry a 4xx", async () => {
    const fetchImpl = vi.fn(async () => json({ error: "bad" }, 400));
    await expect(fetchKalshiMarkets(["X"], fetchImpl)).rejects.toThrow(/400/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("requests hourly candlesticks for the last 7 days via the series path", async () => {
    const fetchImpl = vi.fn(async (_url: string) => json(candles));
    const points = await fetchKalshiHistory(brewers, { fetchImpl, now: NOW });
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.pathname).toBe("/trade-api/v2/series/KXMLB/markets/KXMLB-26-MIL/candlesticks");
    expect(url.searchParams.get("period_interval")).toBe("60");
    expect(Number(url.searchParams.get("end_ts")) - Number(url.searchParams.get("start_ts"))).toBe(7 * 86400);
    expect(points).toHaveLength(6);
    expect(points.at(-1)?.p).toBeCloseTo(0.655, 6); // mid of 0.6530 / 0.6570
  });

  it("skips candles that can't be priced", () => {
    expect(candlesToHistory([{ end_period_ts: 1, yes_bid: { close_dollars: "0" }, yes_ask: { close_dollars: "1" }, price: { close_dollars: null } }])).toEqual([]);
  });
});
