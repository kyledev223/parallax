import raw from "../../data/event-map.json";
import { CATEGORIES, type Category, type EventPair } from "./types";

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Validates the curated map and returns typed pairs. Throws one error listing
 * every problem, so a bad edit to data/event-map.json fails loudly in tests
 * and at build time instead of rendering a half-broken screener.
 */
export function validateEventMap(input: unknown): EventPair[] {
  const errors: string[] = [];
  const pairs = (input as { pairs?: unknown })?.pairs;
  if (!Array.isArray(pairs)) throw new Error('event-map: expected an object with a "pairs" array');

  const seen = new Set<string>();
  const out: EventPair[] = [];

  pairs.forEach((p: Record<string, unknown>, i) => {
    const at = `pairs[${i}]${isNonEmptyString(p?.id) ? ` (${p.id})` : ""}`;
    const err = (msg: string) => errors.push(`${at}: ${msg}`);

    if (!isNonEmptyString(p?.id) || !ID_RE.test(p.id)) err("id must be lowercase kebab-case");
    else if (seen.has(p.id)) err("duplicate id");
    else seen.add(p.id);

    if (!isNonEmptyString(p?.title)) err("title is required");
    if (!isNonEmptyString(p?.shortName)) err("shortName is required");
    else if (p.shortName.length > 24) err("shortName should be 24 characters or fewer (it appears in the ticker)");
    if (!CATEGORIES.includes(p?.category as Category)) err(`category must be one of ${CATEGORIES.join(", ")}`);
    if (!isNonEmptyString(p?.resolutionDate) || !DATE_RE.test(p.resolutionDate) || Number.isNaN(Date.parse(p.resolutionDate)))
      err("resolutionDate must be YYYY-MM-DD");
    if (p?.keywords !== undefined && (!Array.isArray(p.keywords) || !p.keywords.every(isNonEmptyString)))
      err("keywords must be an array of strings");

    const v = p?.venues as EventPair["venues"] | undefined;
    if (!isNonEmptyString(v?.polymarket?.slug)) err("venues.polymarket.slug is required");
    if (!isNonEmptyString(v?.kalshi?.ticker)) err("venues.kalshi.ticker is required");
    if (!isNonEmptyString(v?.kalshi?.seriesTicker)) err("venues.kalshi.seriesTicker is required");
    else if (isNonEmptyString(v?.kalshi?.ticker) && !v.kalshi.ticker.startsWith(v.kalshi.seriesTicker))
      err("venues.kalshi.ticker should start with its seriesTicker");

    const pair = p as unknown as EventPair;
    out.push({ ...pair, keywords: pair.keywords ?? [] });
  });

  if (errors.length) throw new Error(`event-map has ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  return out;
}

const PAIRS = validateEventMap(raw);

export function getPairs(): EventPair[] {
  return PAIRS;
}

export function getPair(id: string): EventPair | undefined {
  return PAIRS.find((p) => p.id === id);
}
