import { describe, expect, it } from "vitest";
import { brewers, NOW } from "./__fixtures__/pairs";
import { buildRow } from "./gap";
import { movers, nearlyOpen, pairedRows, widest } from "./selectors";
import type { VenueQuote } from "./types";

const q = (venue: VenueQuote["venue"], p: number, change24h: number | null = null): VenueQuote => ({
  eventId: "x",
  venue,
  yesProbability: p,
  volume24h: 0,
  lastUpdated: new Date(NOW).toISOString(),
  url: "",
  change24h,
});

const row = (id: string, pm: number | null, ks: number | null, move: number | null = null) =>
  buildRow(
    { ...brewers, id, shortName: id },
    { ...(pm != null ? { polymarket: q("polymarket", pm, move) } : {}), ...(ks != null ? { kalshi: q("kalshi", ks) } : {}) },
    NOW,
  );

const rows = [
  row("a", 0.5, 0.49, 0.02), // gap 1
  row("b", 0.5, 0.46, -0.15), // gap 4
  row("c", 0.4, 0.47, 0), // gap -7
  row("d", 0.6, null, 0.05), // one venue only
  row("e", 0.3, 0.325), // gap -2.5
];

describe("selectors", () => {
  it("widest ignores unpaired rows and sorts by absolute gap", () => {
    expect(widest(rows).map((r) => r.pair.id)).toEqual(["c", "b", "e", "a"]);
    expect(widest(rows, 2)).toHaveLength(2);
  });

  it("movers ranks by absolute move and drops zero or unknown moves", () => {
    expect(movers(rows).map((r) => [r.pair.id, r.move24hPp])).toEqual([
      ["b", -15],
      ["d", 5],
      ["a", 2],
    ]);
  });

  it("nearlyOpen keeps gaps from 2 up to (not including) 5pp", () => {
    expect(nearlyOpen(rows).map((r) => r.pair.id)).toEqual(["b", "e"]);
  });

  it("pairedRows is alphabetical and paired-only", () => {
    expect(pairedRows(rows).map((r) => r.pair.id)).toEqual(["a", "b", "c", "e"]);
  });
});
