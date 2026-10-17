export const VENUES = ["polymarket", "kalshi"] as const;
export type VenueId = (typeof VENUES)[number];

export const CATEGORIES = [
  "Politics",
  "Economics",
  "Crypto",
  "Sports",
  "Culture",
  "Tech",
  "World",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** One curated pair from data/event-map.json. */
export interface EventPair {
  id: string;
  title: string;
  shortName: string;
  category: Category;
  /** ISO date (YYYY-MM-DD) the market is expected to resolve. */
  resolutionDate: string;
  /** Words used to look up related news. */
  keywords: string[];
  venues: {
    polymarket: {
      /** Gamma market slug (the market, not the event), e.g. "will-harry-kane-win-the-2026-ballon-dor". */
      slug: string;
      /** Which outcome counts as "yes" for this pair. Defaults to the first outcome ("Yes"). */
      outcome?: string;
      /** Override the link out to the venue. */
      url?: string;
    };
    kalshi: {
      /** Market ticker, e.g. "KXFEDDECISION-26DEC-H25". */
      ticker: string;
      /** Series ticker, needed for candlestick history, e.g. "KXFEDDECISION". */
      seriesTicker: string;
      /** True when the Kalshi market's YES is the opposite of the pair's yes. */
      invert?: boolean;
      /** Override the link out to the venue. */
      url?: string;
    };
  };
  notes?: string;
}

/** A single venue's price for a pair, normalized. */
export interface VenueQuote {
  eventId: string;
  venue: VenueId;
  /** 0–1 */
  yesProbability: number;
  /** USD notional traded over the last 24h (Kalshi contracts are $1 notional). */
  volume24h: number;
  /** ISO timestamp of the price. */
  lastUpdated: string;
  url: string;
  /** Change in yes probability over 24h, in 0–1 units, when the venue reports it. */
  change24h?: number | null;
}

/** A pair joined with whatever quotes we could get. */
export interface EventRow {
  pair: EventPair;
  quotes: Partial<Record<VenueId, VenueQuote>>;
  /** Venues whose fetch failed or returned nothing usable. */
  unavailable: VenueId[];
  /** Polymarket yes% − Kalshi yes%, in percentage points. null if either side is missing. */
  gapPp: number | null;
  /** Either price is older than the stale threshold. */
  stale: boolean;
  /** Venue pricing yes higher (or the only one available). */
  leader: { venue: VenueId; yesProbability: number } | null;
  /** Largest absolute 24h move across venues, in percentage points (signed). */
  move24hPp: number | null;
  volume24h: number;
}

export interface HistoryPoint {
  /** unix seconds */
  t: number;
  /** 0–1 */
  p: number;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}
