import { describe, expect, it, vi } from "vitest";
import gamma from "./__fixtures__/gamma-markets.json";
import kalshi from "./__fixtures__/kalshi-markets.json";
import { brewers, NOW, pressSec } from "./__fixtures__/pairs";
import { getPairs } from "./event-map";
import { loadSnapshot, type QuoteMemory } from "./snapshot";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function fakeFetch({ pm = true, ks = true } = {}) {
  return vi.fn(async (url: string) => {
    if (url.includes("gamma-api.polymarket.com")) return pm ? json(gamma) : json({ error: "down" }, 503);
    if (url.includes("kalshi.com")) return ks ? json(kalshi) : json({ error: "down" }, 503);
    throw new Error(`unexpected ${url}`);
  });
}

describe("loadSnapshot", () => {
  it("prices every curated pair from real fixtures", async () => {
    const snap = await loadSnapshot(getPairs(), { fetchImpl: fakeFetch(), now: NOW });
    expect(snap.venues.polymarket).toMatchObject({ ok: true, missing: [] });
    expect(snap.venues.kalshi).toMatchObject({ ok: true, missing: [] });
    expect(snap.rows).toHaveLength(getPairs().length);
    for (const row of snap.rows) {
      expect(row.gapPp, row.pair.id).not.toBeNull();
      expect(row.quotes.polymarket!.yesProbability).toBeGreaterThanOrEqual(0);
      expect(row.quotes.kalshi!.yesProbability).toBeLessThanOrEqual(1);
    }
    const ws = snap.rows.find((r) => r.pair.id === brewers.id)!;
    expect(ws.gapPp).toBe(0.1); // 65.55% vs 65.45%
  });

  it("makes exactly one request per venue", async () => {
    const fetchImpl = fakeFetch();
    await loadSnapshot(getPairs(), { fetchImpl, now: NOW });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("shows the other venue with a note when one venue is down", async () => {
    const snap = await loadSnapshot([brewers, pressSec], { fetchImpl: fakeFetch({ ks: false }), now: NOW });
    expect(snap.venues.kalshi.ok).toBe(false);
    expect(snap.venues.kalshi.error).toMatch(/503/);
    for (const row of snap.rows) {
      expect(row.quotes.polymarket).toBeDefined();
      expect(row.quotes.kalshi).toBeUndefined();
      expect(row.unavailable).toEqual(["kalshi"]);
      expect(row.gapPp).toBeNull();
    }
  });

  it("falls back to the last good quote during an outage, and flags it stale once old", async () => {
    const memory: QuoteMemory = new Map();
    await loadSnapshot([brewers], { fetchImpl: fakeFetch(), now: NOW, memory });

    const soon = await loadSnapshot([brewers], { fetchImpl: fakeFetch({ ks: false }), now: NOW + 2 * 60_000, memory });
    expect(soon.venues.kalshi.fromLastGood).toEqual([brewers.id]);
    expect(soon.rows[0].gapPp).toBe(0.1);
    expect(soon.rows[0].stale).toBe(false);

    const later = await loadSnapshot([brewers], { fetchImpl: fakeFetch({ ks: false }), now: NOW + 15 * 60_000, memory });
    expect(later.rows[0].quotes.kalshi).toBeDefined();
    expect(later.rows[0].stale).toBe(true);
  });

  it("lists pairs whose market is missing from a successful response", async () => {
    const ghost = { ...brewers, id: "ghost", venues: { polymarket: { slug: "gone" }, kalshi: { ticker: "KXMLB-GONE", seriesTicker: "KXMLB" } } };
    const snap = await loadSnapshot([ghost], { fetchImpl: fakeFetch(), now: NOW });
    expect(snap.venues.polymarket.missing).toEqual(["ghost"]);
    expect(snap.venues.kalshi.missing).toEqual(["ghost"]);
    expect(snap.rows[0].unavailable).toEqual(["polymarket", "kalshi"]);
  });

  it("survives both venues failing", async () => {
    const snap = await loadSnapshot([brewers], { fetchImpl: fakeFetch({ pm: false, ks: false }), now: NOW });
    expect(snap.rows[0]).toMatchObject({ gapPp: null, leader: null, unavailable: ["polymarket", "kalshi"] });
  });
});
