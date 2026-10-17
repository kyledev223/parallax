import { describe, expect, it } from "vitest";
import { brewers, NOW } from "./__fixtures__/pairs";
import { buildRow, byWidestGap, gapPp, isStale, STALE_AFTER_MS, summarize } from "./gap";
import type { VenueQuote } from "./types";

const quote = (venue: VenueQuote["venue"], p: number, over: Partial<VenueQuote> = {}): VenueQuote => ({
  eventId: brewers.id,
  venue,
  yesProbability: p,
  volume24h: 1000,
  lastUpdated: new Date(NOW - 60_000).toISOString(),
  url: "https://example.com",
  change24h: null,
  ...over,
});

describe("gapPp", () => {
  it("is A minus B in percentage points, to 0.1pp", () => {
    expect(gapPp(0.62, 0.57)).toBe(5);
    expect(gapPp(0.57, 0.62)).toBe(-5);
    expect(gapPp(0.6555, 0.6545)).toBe(0.1);
    expect(gapPp(0.5, 0.5)).toBe(0);
  });

  it("avoids floating point noise", () => {
    expect(gapPp(0.3, 0.1)).toBe(20);
    expect(gapPp(0.123, 0.0)).toBe(12.3);
  });
});

describe("isStale", () => {
  it("flags prices older than 10 minutes", () => {
    expect(isStale(new Date(NOW - STALE_AFTER_MS + 1000).toISOString(), NOW)).toBe(false);
    expect(isStale(new Date(NOW - STALE_AFTER_MS - 1000).toISOString(), NOW)).toBe(true);
  });

  it("treats unparseable timestamps as stale", () => {
    expect(isStale("not a date", NOW)).toBe(true);
  });
});

describe("buildRow", () => {
  it("computes gap, leader, combined volume and the largest 24h move", () => {
    const row = buildRow(
      brewers,
      {
        polymarket: quote("polymarket", 0.62, { change24h: 0.074 }),
        kalshi: quote("kalshi", 0.57, { change24h: -0.081 }),
      },
      NOW,
    );
    expect(row.gapPp).toBe(5);
    expect(row.leader).toEqual({ venue: "polymarket", yesProbability: 0.62 });
    expect(row.volume24h).toBe(2000);
    expect(row.move24hPp).toBe(-8.1);
    expect(row.stale).toBe(false);
    expect(row.unavailable).toEqual([]);
  });

  it("keeps the other venue when one is unavailable, with no gap", () => {
    const row = buildRow(brewers, { kalshi: quote("kalshi", 0.57) }, NOW);
    expect(row.gapPp).toBeNull();
    expect(row.unavailable).toEqual(["polymarket"]);
    expect(row.leader?.venue).toBe("kalshi");
  });

  it("is stale when either side is old", () => {
    const old = new Date(NOW - 11 * 60_000).toISOString();
    const row = buildRow(
      brewers,
      { polymarket: quote("polymarket", 0.6), kalshi: quote("kalshi", 0.6, { lastUpdated: old }) },
      NOW,
    );
    expect(row.stale).toBe(true);
  });
});

describe("sorting and summary", () => {
  const rows = [
    buildRow({ ...brewers, id: "a" }, { polymarket: quote("polymarket", 0.5), kalshi: quote("kalshi", 0.48) }, NOW),
    buildRow({ ...brewers, id: "b" }, { polymarket: quote("polymarket", 0.4), kalshi: quote("kalshi", 0.47) }, NOW),
    buildRow({ ...brewers, id: "c" }, { kalshi: quote("kalshi", 0.9) }, NOW),
  ];

  it("sorts by absolute gap, with unpaired rows last", () => {
    expect([...rows].sort(byWidestGap).map((r) => r.pair.id)).toEqual(["b", "a", "c"]);
  });

  it("summarizes widest and average absolute gap", () => {
    const s = summarize(rows);
    expect(s.eventsTracked).toBe(3);
    expect(s.widestGapPp).toBe(7);
    expect(s.widestGapEvent?.pair.id).toBe("b");
    expect(s.averageGapPp).toBe(4.5);
  });

  it("handles no paired rows", () => {
    expect(summarize([rows[2]])).toMatchObject({ widestGapPp: null, averageGapPp: null, widestGapEvent: null });
  });
});
