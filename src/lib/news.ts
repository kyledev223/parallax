/**
 * Optional news lookup, keyed by each pair's keywords. Off unless NEWS_ENABLED=true.
 *
 * Providers:
 * - "newsdata" (default when NEWSDATA_API_KEY is set): NewsData.io /latest.
 *   Free plan: 200 credits/day, 30 per 15 minutes, articles delayed 12 hours.
 *   Searches title + description + keywords (qInMeta), not full text, so an
 *   article that merely mentions a keyword doesn't rank. If the strict query
 *   finds nothing, it retries with the main keyword alone (still qInMeta).
 *   Responses are cached for 4 hours: at most 2 credits per event per refresh,
 *   so 16 events stay under ~130 credits/day in practice (192 worst case).
 * - "gdelt" (default without a key): GDELT DOC 2.0 API, free and keyless, but
 *   heavily rate-limited (about one request per 5 seconds per IP) and slow.
 * - "rss": any search feed that returns RSS 2.0. Set NEWS_RSS_URL to a template
 *   containing {query}. Check the feed's terms before using it in production.
 *
 * Every provider's HTTP request goes through Next's fetch cache
 * (`next: { revalidate }`), which is shared across server instances, so the
 * quota isn't spent once per serverless instance. Only 200 responses are cached.
 */
import type { EventPair, NewsItem } from "./types";
import { getJson, getText, type FetchLike } from "./venues/http";

export type NewsProvider = "newsdata" | "gdelt" | "rss";

/** GDELT can be slow; news is non-critical, so give it longer than venue calls. */
const NEWS_TIMEOUT_MS = 15_000;

export interface NewsConfig {
  enabled: boolean;
  provider: NewsProvider;
  rssTemplate?: string;
  apiKey?: string;
  limit: number;
  /** How long a successful response is reused, in seconds. */
  ttlSeconds: number;
}

/** NewsData's free plan delays articles 12 hours, so refetching more often than this buys nothing. */
export const NEWSDATA_TTL_SECONDS = 4 * 3600;
const DEFAULT_TTL_SECONDS = 15 * 60;

export function newsConfig(env: Record<string, string | undefined> = process.env): NewsConfig {
  const flag = ["1", "true", "yes", "on"].includes((env.NEWS_ENABLED ?? "").toLowerCase());
  const apiKey = env.NEWSDATA_API_KEY?.trim() || undefined;
  const requested = env.NEWS_PROVIDER?.trim().toLowerCase();
  const provider: NewsProvider =
    requested === "rss" || requested === "gdelt" || requested === "newsdata" ? requested : apiKey ? "newsdata" : "gdelt";
  const ready =
    provider === "newsdata" ? Boolean(apiKey) : provider === "rss" ? Boolean(env.NEWS_RSS_URL?.includes("{query}")) : true;
  return {
    enabled: flag && ready,
    provider,
    rssTemplate: env.NEWS_RSS_URL,
    apiKey,
    limit: 8,
    ttlSeconds: provider === "newsdata" ? NEWSDATA_TTL_SECONDS : DEFAULT_TTL_SECONDS,
  };
}

const quote = (k: string) => (/\s/.test(k) ? `"${k.replace(/"/g, "")}"` : k);

/** First keyword is required; any of the rest may match. */
export function buildQuery(keywords: string[]): string | null {
  const [head, ...rest] = keywords.map((k) => k.trim()).filter(Boolean);
  if (!head) return null;
  if (rest.length === 0) return quote(head);
  if (rest.length === 1) return `${quote(head)} ${quote(rest[0])}`;
  return `${quote(head)} (${rest.map(quote).join(" OR ")})`;
}

/**
 * NewsData syntax: explicit AND/OR, and the free plan caps q at 100
 * characters, so trailing keywords are dropped until it fits.
 */
export function buildNewsDataQuery(keywords: string[], maxLength = 100): string | null {
  const words = keywords.map((k) => k.trim()).filter(Boolean);
  for (let n = words.length; n >= 1; n--) {
    const [head, ...rest] = words.slice(0, n);
    const q =
      rest.length === 0
        ? quote(head)
        : rest.length === 1
          ? `${quote(head)} AND ${quote(rest[0])}`
          : `${quote(head)} AND (${rest.map(quote).join(" OR ")})`;
    if (q.length <= maxLength) return q;
  }
  return null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1].trim()) : null;
}

/** Minimal RSS 2.0 item parser: title, link, pubDate, source. */
export function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  for (const [, block] of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = tag(block, "title");
    const url = tag(block, "link");
    if (!title || !url || !/^https?:\/\//.test(url)) continue;
    const date = tag(block, "pubDate");
    const published = date ? new Date(date) : null;
    // Google-style feeds append " - Source" to the title; prefer the <source> tag when present.
    const rawSource = tag(block, "source");
    // Some feeds put a URL in <source>; show just its domain.
    const source =
      rawSource && !/^https?:\/\//.test(rawSource)
        ? rawSource
        : new URL(rawSource || url).hostname.replace(/^www\./, "");
    items.push({
      title: title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title,
      url,
      source,
      publishedAt: published && !Number.isNaN(published.getTime()) ? published.toISOString() : "",
    });
  }
  return items;
}

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
}

/** GDELT seendate looks like 20261016T201500Z. */
function gdeltDate(s?: string): string {
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : "";
}

export function parseGdelt(json: { articles?: GdeltArticle[] } | null | undefined): NewsItem[] {
  return (json?.articles ?? [])
    .filter((a) => a.url && a.title && /^https?:\/\//.test(a.url))
    .map((a) => ({
      title: a.title!.trim(),
      url: a.url!,
      source: a.domain ?? new URL(a.url!).hostname.replace(/^www\./, ""),
      publishedAt: gdeltDate(a.seendate),
    }));
}

interface NewsDataArticle {
  title?: string | null;
  link?: string | null;
  source_name?: string | null;
  source_id?: string | null;
  pubDate?: string | null;
  duplicate?: boolean | null;
}

/** NewsData pubDate is "YYYY-MM-DD HH:MM:SS" in UTC. */
function newsDataDate(s?: string | null): string {
  const m = s?.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);
  return m ? `${m[1]}T${m[2]}Z` : "";
}

export function parseNewsData(json: { status?: string; results?: unknown } | null | undefined): NewsItem[] {
  if (json?.status !== "success" || !Array.isArray(json.results)) {
    const message = (json?.results as { message?: string } | undefined)?.message;
    throw new Error(`NewsData returned an error${message ? `: ${message}` : ""}`);
  }
  return (json.results as NewsDataArticle[])
    .filter((a) => a.title && a.link && /^https?:\/\//.test(a.link) && !a.duplicate)
    .map((a) => ({
      title: a.title!.trim(),
      url: a.link!,
      source: a.source_name || a.source_id || new URL(a.link!).hostname.replace(/^www\./, ""),
      publishedAt: newsDataDate(a.pubDate),
    }));
}

function dedupe(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  return items
    .filter((i) => {
      const key = i.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, limit);
}

export type NewsResult =
  | { status: "disabled" }
  | { status: "ok"; items: NewsItem[]; provider: NewsProvider }
  | { status: "error"; message: string; provider: NewsProvider };

export async function fetchNews(
  pair: EventPair,
  { config = newsConfig(), fetchImpl }: { config?: NewsConfig; fetchImpl?: FetchLike } = {},
): Promise<NewsResult> {
  if (!config.enabled) return { status: "disabled" };
  const keywords = pair.keywords.length ? pair.keywords : [pair.title];
  const q = buildQuery(keywords);
  if (!q) return { status: "ok", items: [], provider: config.provider };
  // Shared, persistent fetch cache; only successful responses are stored.
  const init: RequestInit = { next: { revalidate: config.ttlSeconds, tags: ["news"] } };

  try {
    if (config.provider === "newsdata") {
      // Strict query first, then the main keyword alone. Both search metadata only.
      const attempts = [...new Set([buildNewsDataQuery(keywords), buildNewsDataQuery(keywords.slice(0, 1))])].filter(
        (x): x is string => Boolean(x),
      );
      for (const qInMeta of attempts) {
        const qs = new URLSearchParams({ apikey: config.apiKey!, qInMeta, language: "en", removeduplicate: "1" });
        const json = await getJson<{ status?: string; results?: unknown }>(`https://newsdata.io/api/1/latest?${qs}`, {
          fetchImpl,
          retries: 0,
          timeoutMs: NEWS_TIMEOUT_MS,
          init,
        });
        const items = dedupe(parseNewsData(json), config.limit);
        if (items.length) return { status: "ok", items, provider: "newsdata" };
      }
      return { status: "ok", items: [], provider: "newsdata" };
    }
    if (config.provider === "rss") {
      const url = config.rssTemplate!.replace("{query}", encodeURIComponent(q));
      const xml = await getText(url, { fetchImpl, retries: 0, timeoutMs: NEWS_TIMEOUT_MS, init });
      return { status: "ok", items: dedupe(parseRss(xml), config.limit), provider: "rss" };
    }
    const qs = new URLSearchParams({
      query: `${q} sourcelang:english`,
      mode: "artlist",
      format: "json",
      maxrecords: "25",
      timespan: "7d",
      sort: "datedesc",
    });
    const json = await getJson<{ articles?: GdeltArticle[] }>(`https://api.gdeltproject.org/api/v2/doc/doc?${qs}`, {
      fetchImpl,
      retries: 0,
      timeoutMs: NEWS_TIMEOUT_MS,
      init,
    });
    return { status: "ok", items: dedupe(parseGdelt(json), config.limit), provider: "gdelt" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e), provider: config.provider };
  }
}
