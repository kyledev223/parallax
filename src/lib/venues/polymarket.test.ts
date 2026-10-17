import { describe, expect, it, vi } from "vitest";
import gamma from "../__fixtures__/gamma-markets.json";
import history from "../__fixtures__/clob-prices-history.json";
import { brewers, OBSERVED_AT } from "../__fixtures__/pairs";
import {
  fetchPolymarketHistory,
  fetchPolymarketMarkets,
  normalizePolymarket,
  yesTokenId,
  type GammaMarket,
} from "./polymarket";

const markets = gamma as GammaMarket[];
const brewersMarket = markets.find((m) => m.slug === brewers.venues.polymarket.slug)!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("normalizePolymarket", () => {
  it("normalizes a real Gamma market", () => {
    const q = normalizePolymarket(brewersMarket, brewers, OBSERVED_AT)!;
    expect(q).toMatchObject({
      eventId: "world-series-brewers-2026",
      venue: "polymarket",
      url: "https://polymarket.com/event/mlb-world-series-champion-2026/will-the-milwaukee-brewers-win-the-2026-world-series",
      change24h: 0.074,
      lastUpdated: "2026-10-16T20:32:52.728Z",
    });
    expect(q.yesProbability).toBeCloseTo(0.6555, 6);
    expect(q.volume24h).toBeCloseTo(90292.86, 1);
  });

  it("selects and inverts the second outcome when the pair asks for it", () => {
    const pair = { ...brewers, venues: { ...brewers.venues, polymarket: { slug: brewersMarket.slug, outcome: "No" } } };
    const q = normalizePolymarket(brewersMarket, pair, OBSERVED_AT)!;
    expect(q.yesProbability).toBeCloseTo(0.3445, 6);
    expect(q.change24h).toBeCloseTo(-0.074, 6);
    expect(yesTokenId(brewersMarket, pair)?.tokenId).toMatch(/^5752/);
  });

  it("returns null when the configured outcome doesn't exist", () => {
    const pair = { ...brewers, venues: { ...brewers.venues, polymarket: { slug: brewersMarket.slug, outcome: "Maybe" } } };
    expect(normalizePolymarket(brewersMarket, pair, OBSERVED_AT)).toBeNull();
  });

  it("falls back to outcomePrices when there is no book", () => {
    const m: GammaMarket = { slug: "x", outcomes: '["Yes","No"]', outcomePrices: '["0.42","0.58"]', bestBid: null, bestAsk: null, lastTradePrice: 0 };
    expect(normalizePolymarket(m, brewers, OBSERVED_AT)?.yesProbability).toBe(0.42);
  });

  it("returns null for an unpriceable placeholder market", () => {
    const m: GammaMarket = { slug: "x", outcomes: '["Yes","No"]', bestBid: 0, bestAsk: 1, lastTradePrice: 0 };
    expect(normalizePolymarket(m, brewers, OBSERVED_AT)).toBeNull();
  });

  it("treats a missing oneDayPriceChange as unknown, not zero", () => {
    const { oneDayPriceChange: _, ...rest } = brewersMarket;
    expect(normalizePolymarket(rest, brewers, OBSERVED_AT)?.change24h).toBeNull();
  });
});

describe("fetchers", () => {
  it("batches slugs into one Gamma request with closed=any", async () => {
    const fetchImpl = vi.fn(async (_url: string) => json(markets));
    const map = await fetchPolymarketMarkets([brewersMarket.slug, "other-slug", brewersMarket.slug], fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://gamma-api.polymarket.com/markets");
    expect(url.searchParams.getAll("slug")).toEqual([brewersMarket.slug, "other-slug"]);
    expect(url.searchParams.get("closed")).toBe("any");
    expect(map.get(brewersMarket.slug)?.question).toMatch(/Brewers/);
  });

  it("throws on a server error so the venue can be marked unavailable", async () => {
    const fetchImpl = vi.fn(async () => json({ error: "down" }, 503));
    await expect(fetchPolymarketMarkets(["a"], fetchImpl)).rejects.toThrow(/503/);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // one retry
  });

  it("reads CLOB price history", async () => {
    const fetchImpl = vi.fn(async (_url: string) => json(history));
    const points = await fetchPolymarketHistory("123", { fetchImpl });
    expect(new URL(fetchImpl.mock.calls[0][0]).pathname).toBe("/prices-history");
    expect(points).toHaveLength(6);
    expect(points.at(-1)).toEqual({ t: 1792182497, p: 0.6555 });
  });
});
