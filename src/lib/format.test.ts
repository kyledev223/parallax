import { describe, expect, it } from "vitest";
import { brewers } from "./__fixtures__/pairs";
import { pct, pp, relativeTime, shortDate, usdCompact, venueUrl } from "./format";

describe("pct", () => {
  it("formats to one decimal", () => {
    expect(pct(0.6545)).toBe("65.5%");
    expect(pct(0.5)).toBe("50.0%");
    expect(pct(null)).toBe("—");
  });

  it("never rounds a near-certain price to 0% or 100%", () => {
    expect(pct(0.9995)).toBe(">99.9%");
    expect(pct(0.0004)).toBe("<0.1%");
    expect(pct(1)).toBe("100.0%");
    expect(pct(0)).toBe("0.0%");
  });
});

describe("pp", () => {
  it("is signed with a true minus and no negative zero", () => {
    expect(pp(4.2)).toBe("+4.2pp");
    expect(pp(-1)).toBe("−1.0pp");
    expect(pp(-0.01)).toBe("0.0pp");
    expect(pp(undefined)).toBe("—");
  });
});

describe("other formatters", () => {
  it("compacts dollars", () => {
    expect(usdCompact(612_262)).toBe("$612K");
    expect(usdCompact(1_240_000)).toBe("$1.2M");
    expect(usdCompact(950)).toBe("$950");
  });

  it("formats date-only strings without timezone drift", () => {
    expect(shortDate("2026-11-03")).toBe("Nov 3, 2026");
  });

  it("formats relative time", () => {
    const now = Date.parse("2026-10-16T20:40:00Z");
    expect(relativeTime("2026-10-16T20:39:30Z", now)).toBe("30s ago");
    expect(relativeTime("2026-10-16T20:30:00Z", now)).toBe("10m ago");
  });

  it("builds fallback venue links", () => {
    expect(venueUrl(brewers, "polymarket")).toBe("https://polymarket.com/market/will-the-milwaukee-brewers-win-the-2026-world-series");
    expect(venueUrl(brewers, "kalshi")).toBe("https://kalshi.com/markets/kxmlb");
  });
});
