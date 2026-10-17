import type { EventPair, VenueId } from "./types";

/** Link to a pair's market on a venue, for when we have no live quote to take it from. */
export function venueUrl(pair: EventPair, venue: VenueId): string {
  if (venue === "polymarket")
    return pair.venues.polymarket.url ?? `https://polymarket.com/market/${pair.venues.polymarket.slug}`;
  return pair.venues.kalshi.url ?? `https://kalshi.com/markets/${pair.venues.kalshi.seriesTicker.toLowerCase()}`;
}

export const VENUE_LABEL: Record<VenueId, string> = {
  polymarket: "Polymarket",
  kalshi: "Kalshi",
};

export const VENUE_SHORT: Record<VenueId, string> = {
  polymarket: "PM",
  kalshi: "KS",
};

export function pct(p: number | null | undefined, digits = 1): string {
  if (p == null || Number.isNaN(p)) return "—";
  const s = (p * 100).toFixed(digits);
  const step = 10 ** -digits;
  // Don't round a near-certain price into a certainty it doesn't have.
  if (p > 0 && Number(s) === 0) return `<${step.toFixed(digits)}%`;
  if (p < 1 && Number(s) === 100) return `>${(100 - step).toFixed(digits)}%`;
  return `${s}%`;
}

/** Signed percentage points, e.g. "+4.2pp", "−1.0pp". Uses a true minus sign. */
export function pp(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return "—";
  const s = Math.abs(v).toFixed(digits);
  if (Number(s) === 0) return `0.${"0".repeat(digits)}pp`;
  return `${v > 0 ? "+" : "−"}${s}pp`;
}

export function usdCompact(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function relativeTime(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
