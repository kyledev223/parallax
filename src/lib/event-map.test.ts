import { describe, expect, it } from "vitest";
import raw from "../../data/event-map.json";
import { getPair, getPairs, validateEventMap } from "./event-map";

describe("data/event-map.json", () => {
  it("is valid and has around 15 pairs", () => {
    const pairs = getPairs();
    expect(pairs.length).toBeGreaterThanOrEqual(12);
    expect(new Set(pairs.map((p) => p.id)).size).toBe(pairs.length);
  });

  it("looks pairs up by id", () => {
    expect(getPair("world-series-brewers-2026")?.venues.kalshi.ticker).toBe("KXMLB-26-MIL");
    expect(getPair("nope")).toBeUndefined();
  });

  it("has no duplicate venue markets", () => {
    const pairs = getPairs();
    expect(new Set(pairs.map((p) => p.venues.polymarket.slug)).size).toBe(pairs.length);
    expect(new Set(pairs.map((p) => p.venues.kalshi.ticker)).size).toBe(pairs.length);
  });
});

describe("validateEventMap", () => {
  const good = raw.pairs[0];

  it("reports every problem at once", () => {
    const bad = {
      pairs: [
        { ...good, id: "Bad Id", category: "Gossip", resolutionDate: "soon" },
        { ...good, venues: { polymarket: { slug: "" }, kalshi: { ticker: "ABC-1", seriesTicker: "XYZ" } } },
      ],
    };
    let message = "";
    try {
      validateEventMap(bad);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/5 problem/);
    expect(message).toMatch(/kebab-case/);
    expect(message).toMatch(/category must be one of/);
    expect(message).toMatch(/YYYY-MM-DD/);
    expect(message).toMatch(/polymarket.slug is required/);
    expect(message).toMatch(/should start with its seriesTicker/);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateEventMap({ pairs: [good, good] })).toThrow(/duplicate id/);
  });

  it("rejects a missing pairs array", () => {
    expect(() => validateEventMap({})).toThrow(/"pairs" array/);
  });

  it("defaults keywords to an empty list", () => {
    const { keywords: _, ...noKeywords } = good;
    expect(validateEventMap({ pairs: [noKeywords] })[0].keywords).toEqual([]);
  });
});
