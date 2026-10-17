# Parallax

A free, no-signup terminal that compares prediction-market odds for the **same event** across venues
(Polymarket and Kalshi), shows the gap in percentage points, and surfaces news that may explain moves.

- `/`: landing page with a live ticker, summary stats, widest gaps, biggest movers and an alert stub
- `/events`: sortable, filterable screener of every paired event
- `/events/[id]`: both venues side by side, 7-day odds and gap history, related news, links out
- `/about`: methodology (how pairs are chosen, how the gap is computed, delays, limitations)
- `/risk`: disclaimer

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4 and Recharts.
There is no database: equivalent markets are paired by hand in [`data/event-map.json`](data/event-map.json).

---

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. No API keys or env vars are needed; both venues' market data is public.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build, then serve it |
| `npm test` | Unit tests (Vitest), run against recorded real API responses |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run pairs:check` | Fetch every pair live from both venues and print prices and gaps. Exits non-zero if a venue fails or a pair can't be priced. Add `-- --news` to also test the news provider. |

## Environment variables

All optional. Copy `.env.example` to `.env.local` to set them locally.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Vercel production URL, else `http://localhost:3000` | Absolute base for canonical links, OpenGraph images and the sitemap. Set it when you use a custom domain. |
| `NEXT_PUBLIC_TWITTER` | none | X (Twitter) account for the nav and footer button: `@handle`, `handle` or a full URL. Hidden when empty. |
| `NEXT_PUBLIC_PUMPFUN_CA` | none | Token contract address; the pump.fun button links to `pump.fun/coin/<CA>`. Hidden when empty. |
| `NEWS_ENABLED` | off | Feature flag for the "In the news" section on event pages (`true` to enable) |
| `NEWSDATA_API_KEY` | none | **Recommended news source.** A free [NewsData.io](https://newsdata.io) key (no card needed). When set, it becomes the default provider. |
| `NEWS_PROVIDER` | `newsdata` if a key is set, else `gdelt` | Force a provider: `newsdata`, `gdelt` (free and keyless, but frequently rate-limited and slow) or `rss` |
| `NEWS_RSS_URL` | none | For `rss`: a search feed URL containing `{query}`. **Check the feed's terms.** For example, Google News RSS is licensed for personal, non-commercial use only. |

With news off (the default) the app works fully; event pages say headlines are turned off.

### Turning on news

1. Create a free account at [newsdata.io](https://newsdata.io) and copy your API key from the dashboard.
2. In Vercel → Project → Settings → Environment Variables, add `NEWS_ENABLED=true` and `NEWSDATA_API_KEY=<your key>`.
3. Redeploy.

The free plan allows 200 credits a day (30 per 15 minutes) and delays articles by 12 hours, so headlines are 12–48 hours old.
Searches match article titles, descriptions and keywords (NewsData's `qInMeta`), not full text, so articles that only
mention a keyword in passing don't appear. If nothing matches, the page says so rather than showing loosely related stories.

Rate limits shape the design: the free plan allows 30 requests per 15 minutes and 200 a day. Each event makes exactly one
request per refresh, results are cached for 4 hours in Next's shared fetch cache, and news is fetched when a visitor opens
an event page rather than during the build, so deploys don't spend requests. 16 events use at most 96 credits a day.
If you add more than about 25 pairs, upgrade the plan or raise `NEWSDATA_TTL_SECONDS` in `src/lib/news.ts`.
Check NewsData.io's current terms for your use case.

## How the data works

```
data/event-map.json ──► src/lib/event-map.ts   (validated at load; one error lists every problem)
                              │
Polymarket Gamma API ─┐       ▼
                      ├─► src/lib/snapshot.ts  ──► src/lib/data.ts ('use cache', 30s) ──► pages
Kalshi Trade API ─────┘   (normalize + join)
```

**Sources** (read-only, unauthenticated):

| Venue | Prices | History |
| --- | --- | --- |
| Polymarket | `GET https://gamma-api.polymarket.com/markets?slug=…&slug=…&closed=any` | `GET https://clob.polymarket.com/prices-history?market=<token id>&interval=1w&fidelity=60` |
| Kalshi | `GET https://external-api.kalshi.com/trade-api/v2/markets?tickers=A,B,C` | `GET …/series/{series}/markets/{ticker}/candlesticks?period_interval=60` |

Each refresh makes **one batched request per venue** for all pairs.

**Normalized shape** (`VenueQuote` in [`src/lib/types.ts`](src/lib/types.ts)):

```ts
{ eventId, venue, yesProbability /* 0–1 */, volume24h /* USD */, lastUpdated /* ISO */, url, change24h }
```

- **Price rule, the same for both venues:** use the bid/ask midpoint when the spread is ≤ $0.10, otherwise the last trade.
- **Gap** = Polymarket yes% − Kalshi yes%, in percentage points, rounded to 0.1.
- **Stale:** a gap is stale when either price is more than 10 minutes old. Kalshi has no price timestamp, so its `lastUpdated` is the time we read it. If a venue fails, the last good quote is kept in memory and flagged stale as it ages; with no quote at all, that venue shows as unavailable.
- **Freshness:** the snapshot is cached with `cacheLife({ stale: 30, revalidate: 30 })`, and open pages call `router.refresh()` every 30 seconds while visible. Displayed prices are typically 30–60 seconds old. History refreshes every minute; news every 4 hours with NewsData.io (15 minutes for other providers).
- **Fetch cache:** venue requests use `cache: "no-store"` so the 30-second `use cache` layer is the only freshness control.
  Without it, Next stores fetch responses with a 15-minute default and a "refreshed" snapshot can reuse old prices.
  News requests deliberately use the shared fetch cache (`next: { revalidate }`) so the API quota isn't spent per server instance.
- **Kalshi volume** is reported in contracts. We convert to dollars as contracts × current yes price, so it's approximate.

## Adding an event pair

Pairs are curated by hand because automatic matching is unreliable: two markets can share a title and still
resolve differently. Only add a pair when both markets ask **the same question**, over **the same window**,
with **compatible rules**.

**1. Find the Polymarket market slug.** Use the *market* slug, not the event slug. Event pages contain several markets:

```bash
curl -s "https://gamma-api.polymarket.com/events/slug/<event-slug-from-the-url>" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const m of JSON.parse(s).markets)console.log(m.slug,"|",m.groupItemTitle,"|",m.outcomePrices)})'
```

**2. Find the Kalshi market ticker and its series ticker.**

```bash
curl -s "https://external-api.kalshi.com/trade-api/v2/events/<EVENT_TICKER>?with_nested_markets=true" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("series:",j.event.series_ticker);for(const m of j.event.markets)console.log(m.ticker,"|",m.yes_sub_title,"|",m.rules_primary)})'
```

**3. Read both resolution rules.** These are Polymarket's `description` and Kalshi's `rules_primary` / `rules_secondary`.
Write any meaningful difference (source, cutoff time, how candidates map to parties) into `notes`.

**4. Add the entry** to `data/event-map.json`:

```json
{
  "id": "world-series-brewers-2026",
  "title": "Milwaukee Brewers win the 2026 World Series",
  "shortName": "Brewers win WS",
  "category": "Sports",
  "resolutionDate": "2026-10-31",
  "keywords": ["Brewers", "World Series"],
  "venues": {
    "polymarket": { "slug": "will-the-milwaukee-brewers-win-the-2026-world-series" },
    "kalshi": { "ticker": "KXMLB-26-MIL", "seriesTicker": "KXMLB" }
  },
  "notes": "Optional. Shown on the event page as 'How the rules compare'."
}
```

| Field | Rules |
| --- | --- |
| `id` | Lowercase kebab-case, unique. Becomes the URL `/events/<id>`. |
| `title` | Full question, phrased as the yes outcome |
| `shortName` | 24 characters or fewer. Used in the ticker, chips and mobile table. |
| `category` | One of `Politics`, `Economics`, `Crypto`, `Sports`, `Culture`, `Tech`, `World` |
| `resolutionDate` | `YYYY-MM-DD`, when the outcome is expected to be known |
| `keywords` | News query: the first keyword is required, and any of the rest may match |
| `venues.polymarket.outcome` | Optional. Which outcome is "yes" when it isn't the first (e.g. `"No"`). |
| `venues.kalshi.invert` | Optional. `true` if the pair's yes is Kalshi's NO. |
| `venues.*.url` | Optional override for the link out to the venue |

**5. Verify:**

```bash
npm run pairs:check   # both prices should appear, and the gap should look plausible
npm test              # validates the map (unique ids/slugs/tickers, formats, ticker matches series)
```

Remove pairs once they resolve. A resolved market prices at 0% or 100% and its gap means nothing.

## Project structure

```
data/event-map.json          curated pairs
assets/fonts/                WOFF fonts for next/og images (OFL)
scripts/check-pairs.ts       live pair checker
src/app/                     routes, opengraph-image, icon, sitemap, robots, error and 404 pages
src/components/              UI (landing/, events/, og/, ui/)
src/lib/
  venues/polymarket.ts       Gamma + CLOB fetchers and normalizer
  venues/kalshi.ts           Trade API fetchers and normalizer
  venues/price.ts            shared price rule and parsing helpers
  snapshot.ts                joins pairs with quotes; venue status and fallbacks (framework-free)
  data.ts                    cached server accessors (getSnapshot, getEventHistory, getEventNews)
  gap.ts, history.ts         gap, staleness, summary, history alignment
  news.ts                    optional news providers (NewsData.io, GDELT, RSS)
  __fixtures__/              trimmed real API responses used by tests
```

## Deploying to Vercel

1. Push the repo to GitHub, GitLab or Bitbucket.
2. In Vercel, **Add New → Project** and import the repo. The framework preset is detected as Next.js; keep the default build command (`next build`) and output.
3. Optionally add env vars (see above). For a custom domain, set `NEXT_PUBLIC_SITE_URL=https://your-domain`.
4. Deploy.

Notes:

- Pages are prerendered at build time, which needs outbound access to both venues' APIs. If a venue is down
  during the build, the build still succeeds and those prices show as unavailable until the next refresh.
- Cache Components runs on the Node.js runtime. Don't add `export const runtime = "edge"` to any route.
- `outputFileTracingIncludes` in `next.config.ts` ships `assets/fonts/` with server functions so event
  OpenGraph images can regenerate with live prices.
- The last-good-quote fallback lives in server memory, per instance, so on serverless it only helps within a warm instance.
- Any Node host works too: `npm run build && npm start`.

## Quality notes

- **States:** every data block has a loading skeleton, an empty state and its own error boundary with retry. If one venue fails, the other is shown with a "venue unavailable" note.
- **Accessibility:** audited with axe-core (WCAG 2.1 AA and best practices), with 0 violations on every page at 1440px and 375px.
  - Visible focus rings in the accent color; table sorting and the FAQ accordion work by keyboard; the chart has a table view and arrow-key readout.
  - Motion respects `prefers-reduced-motion`.
  - Chart series colors were validated for colorblind separation and contrast.
- **SEO:** per-page titles, descriptions and canonicals; generated OpenGraph images (a site image, plus a per-event image showing live odds); `sitemap.xml`, `robots.txt` and an SVG icon.

## Disclaimer

Parallax shows public market data for information only. It is not financial advice and doesn't offer trading.
It is not affiliated with Polymarket or Kalshi. See [`/risk`](src/app/risk/page.tsx).
