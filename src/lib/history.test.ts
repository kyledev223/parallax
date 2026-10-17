import { describe, expect, it } from "vitest";
import { mergeHistory, symmetricGapDomain } from "./history";

const H = 3600;

describe("mergeHistory", () => {
  it("aligns irregular Polymarket points with hourly Kalshi candles", () => {
    const pm = [
      { t: 0 * H + 120, p: 0.6 },
      { t: 0 * H + 3000, p: 0.62 }, // later point in the same hour wins
      { t: 1 * H + 900, p: 0.64 },
    ];
    const ks = [
      { t: 0 * H, p: 0.58 },
      { t: 1 * H, p: 0.6 },
    ];
    expect(mergeHistory(pm, ks)).toEqual([
      { t: 0, pm: 0.62, ks: 0.58, gap: 4 },
      { t: H, pm: 0.64, ks: 0.6, gap: 4 },
    ]);
  });

  it("carries a price across a short hole but not a long one", () => {
    const pm = [0, 1, 2, 3, 4, 5, 6].map((h) => ({ t: h * H, p: 0.5 }));
    const ks = [{ t: 0, p: 0.4 }];
    const merged = mergeHistory(pm, ks, { maxFill: 2 });
    expect(merged.map((m) => m.ks)).toEqual([0.4, 0.4, 0.4, null, null, null, null]);
    expect(merged.map((m) => m.gap)).toEqual([10, 10, 10, null, null, null, null]);
  });

  it("handles one venue missing entirely", () => {
    const merged = mergeHistory([{ t: 0, p: 0.3 }], null);
    expect(merged).toEqual([{ t: 0, pm: 0.3, ks: null, gap: null }]);
  });

  it("appends a live point after history", () => {
    const merged = mergeHistory([{ t: 0, p: 0.3 }], [{ t: 0, p: 0.2 }], { latest: { t: 5000, pm: 0.35, ks: 0.3 } });
    expect(merged.at(-1)).toEqual({ t: 5000, pm: 0.35, ks: 0.3, gap: 5 });
  });

  it("returns only the live point when there is no history", () => {
    expect(mergeHistory(null, null, { latest: { t: 10, pm: 0.5 } })).toEqual([{ t: 10, pm: 0.5, ks: null, gap: null }]);
    expect(mergeHistory(null, [])).toEqual([]);
  });
});

describe("symmetricGapDomain", () => {
  it("rounds to a clean symmetric range with a minimum", () => {
    expect(symmetricGapDomain([{ t: 0, pm: null, ks: null, gap: 0.3 }])).toEqual([-2, 2]);
    expect(symmetricGapDomain([{ t: 0, pm: null, ks: null, gap: -3.2 }])).toEqual([-5, 5]);
    expect(symmetricGapDomain([{ t: 0, pm: null, ks: null, gap: 12.5 }])).toEqual([-15, 15]);
  });
});
