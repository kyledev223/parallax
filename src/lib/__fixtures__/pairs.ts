import type { EventPair } from "../types";

export const brewers: EventPair = {
  id: "world-series-brewers-2026",
  title: "Milwaukee Brewers win the 2026 World Series",
  shortName: "Brewers win WS",
  category: "Sports",
  resolutionDate: "2026-10-31",
  keywords: ["Brewers", "World Series"],
  venues: {
    polymarket: { slug: "will-the-milwaukee-brewers-win-the-2026-world-series" },
    kalshi: { ticker: "KXMLB-26-MIL", seriesTicker: "KXMLB" },
  },
};

export const pressSec: EventPair = {
  id: "press-secretary-out-2026",
  title: "Katie Zacharia leaves as Press Secretary before 2027",
  shortName: "Press Sec out by 2027",
  category: "Politics",
  resolutionDate: "2026-12-31",
  keywords: ["Katie Zacharia", "press secretary"],
  venues: {
    polymarket: { slug: "katie-zacharia-out-as-press-secretary-by-december-31" },
    kalshi: { ticker: "KXZACHARIAOUT-26OCT-27JAN01", seriesTicker: "KXZACHARIAOUT" },
  },
};

export const OBSERVED_AT = "2026-10-16T20:40:00.000Z";
export const NOW = Date.parse(OBSERVED_AT);
