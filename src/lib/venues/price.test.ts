import { describe, expect, it } from "vitest";
import { earliest, impliedProbability, parseJsonArray, toNumber } from "./price";

describe("impliedProbability", () => {
  it("uses the midpoint when the spread is $0.10 or less", () => {
    expect(impliedProbability({ bid: 0.651, ask: 0.66, last: 0.659 })).toBeCloseTo(0.6555, 6);
    expect(impliedProbability({ bid: "0.6540", ask: "0.6550", last: "0.6550" })).toBeCloseTo(0.6545, 6);
    expect(impliedProbability({ bid: 0.4, ask: 0.5, last: 0.9 })).toBeCloseTo(0.45, 6);
  });

  it("falls back to the last trade when the spread is wide", () => {
    expect(impliedProbability({ bid: 0.2, ask: 0.6, last: 0.31 })).toBe(0.31);
  });

  it("ignores a stale last trade when the book is tight", () => {
    // Real case: Kalshi Movistar KOI, last 0.10 but book 0.00/0.01.
    expect(impliedProbability({ bid: "0.0000", ask: "0.0100", last: "0.1000" })).toBeCloseTo(0.005, 6);
  });

  it("treats a missing bid as 0 and a missing ask as 1", () => {
    expect(impliedProbability({ ask: 0.002, last: 0.002 })).toBeCloseTo(0.001, 6);
    expect(impliedProbability({ bid: 0.97, last: 0.97 })).toBeCloseTo(0.985, 6);
  });

  it("returns null for an empty book with no trades", () => {
    expect(impliedProbability({ bid: 0, ask: 1, last: 0 })).toBeNull();
    expect(impliedProbability({})).toBeNull();
  });

  it("uses a wide book's midpoint when there is no trade", () => {
    expect(impliedProbability({ bid: 0.1, ask: 0.5 })).toBeCloseTo(0.3, 6);
  });
});

describe("helpers", () => {
  it("toNumber parses fixed-point strings and rejects junk", () => {
    expect(toNumber("0.6550")).toBe(0.655);
    expect(toNumber("612262.26")).toBe(612262.26);
    expect(toNumber("")).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber("abc")).toBeNull();
  });

  it("parseJsonArray reads Gamma's JSON-encoded arrays", () => {
    expect(parseJsonArray('["Yes", "No"]')).toEqual(["Yes", "No"]);
    expect(parseJsonArray('["0.6555", "0.3445"]')).toEqual(["0.6555", "0.3445"]);
    expect(parseJsonArray("not json")).toBeNull();
    expect(parseJsonArray(undefined)).toBeNull();
  });

  it("earliest never returns a time after the fallback", () => {
    const at = "2026-10-16T20:40:00.000Z";
    expect(earliest("2026-10-16T20:32:52.728783Z", at)).toBe("2026-10-16T20:32:52.728Z");
    expect(earliest("2026-10-16T21:00:00Z", at)).toBe(at);
    expect(earliest(null, at)).toBe(at);
  });
});
