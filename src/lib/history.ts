import { gapPp } from "./gap";
import type { HistoryPoint } from "./types";

export interface MergedPoint {
  /** unix seconds, start of the bucket (or the live point's time) */
  t: number;
  /** 0–1, or null where that venue has no data */
  pm: number | null;
  ks: number | null;
  /** Polymarket − Kalshi in percentage points, where both exist */
  gap: number | null;
}

function bucketize(points: HistoryPoint[] | null, size: number): Map<number, number> {
  const out = new Map<number, { t: number; p: number }>();
  for (const pt of points ?? []) {
    const b = Math.floor(pt.t / size) * size;
    const prev = out.get(b);
    if (!prev || pt.t >= prev.t) out.set(b, pt);
  }
  return new Map([...out].map(([b, v]) => [b, v.p]));
}

/**
 * Aligns two venues' histories on a shared hourly grid so the gap can be
 * computed point by point. Each venue keeps its last price in a bucket and
 * carries it forward across short holes (no trades in an hour), but never
 * more than `maxFill` buckets, so a venue that stopped reporting isn't
 * drawn as flat. An optional `latest` point pins the end to live prices.
 */
export function mergeHistory(
  pm: HistoryPoint[] | null,
  ks: HistoryPoint[] | null,
  {
    bucketSec = 3600,
    maxFill = 3,
    latest,
  }: { bucketSec?: number; maxFill?: number; latest?: { t: number; pm?: number | null; ks?: number | null } } = {},
): MergedPoint[] {
  const a = bucketize(pm, bucketSec);
  const b = bucketize(ks, bucketSec);
  const keys = [...new Set([...a.keys(), ...b.keys()])].sort((x, y) => x - y);
  if (keys.length === 0 && !latest) return [];

  const out: MergedPoint[] = [];
  const carry = { pm: null as number | null, ks: null as number | null, pmAge: Infinity, ksAge: Infinity };

  // Walk every bucket between first and last so holes are explicit.
  const first = keys[0];
  const last = keys[keys.length - 1];
  for (let t = first; keys.length && t <= last; t += bucketSec) {
    if (a.has(t)) {
      carry.pm = a.get(t)!;
      carry.pmAge = 0;
    } else carry.pmAge++;
    if (b.has(t)) {
      carry.ks = b.get(t)!;
      carry.ksAge = 0;
    } else carry.ksAge++;

    const pmV = carry.pmAge <= maxFill ? carry.pm : null;
    const ksV = carry.ksAge <= maxFill ? carry.ks : null;
    out.push({ t, pm: pmV, ks: ksV, gap: pmV != null && ksV != null ? gapPp(pmV, ksV) : null });
  }

  if (latest && (out.length === 0 || latest.t > out[out.length - 1].t)) {
    const pmV = latest.pm ?? null;
    const ksV = latest.ks ?? null;
    out.push({ t: latest.t, pm: pmV, ks: ksV, gap: pmV != null && ksV != null ? gapPp(pmV, ksV) : null });
  }
  return out;
}

/** Range of a gap series, padded and symmetric around zero, for a diverging axis. */
export function symmetricGapDomain(points: MergedPoint[], min = 2): [number, number] {
  const m = Math.max(min, ...points.map((p) => (p.gap == null ? 0 : Math.abs(p.gap))));
  const nice = m <= 2 ? 2 : m <= 5 ? 5 : m <= 10 ? 10 : Math.ceil(m / 5) * 5;
  return [-nice, nice];
}
