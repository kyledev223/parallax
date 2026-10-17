/** Spreads wider than this fall back to the last trade, matching how Polymarket displays prices. */
export const MAX_MID_SPREAD = 0.1;

export function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * One rule for every venue, so gaps compare like with like:
 * - the bid/ask midpoint when the spread is $0.10 or tighter,
 * - otherwise the last trade,
 * - otherwise the midpoint of a wide book, if there is any book at all.
 * A missing bid counts as 0 and a missing ask as 1 (an empty side).
 */
export function impliedProbability(q: { bid?: unknown; ask?: unknown; last?: unknown }): number | null {
  const bid = toNumber(q.bid) ?? 0;
  const ask = toNumber(q.ask) ?? 1;
  const last = toNumber(q.last);
  const spread = ask - bid;

  if (spread >= 0 && spread <= MAX_MID_SPREAD + 1e-9) return clamp01((bid + ask) / 2);
  if (last != null && last > 0 && last < 1) return last;
  if (spread >= 0 && spread < 1) return clamp01((bid + ask) / 2);
  return null;
}

/** Parses Gamma's JSON-encoded string arrays, e.g. '["Yes", "No"]'. */
export function parseJsonArray(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v !== "string") return null;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

/** Earlier of two ISO timestamps; falls back to `fallback` when `iso` is missing or invalid. */
export function earliest(iso: unknown, fallback: string): string {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return fallback;
  return t < Date.parse(fallback) ? new Date(t).toISOString() : fallback;
}
