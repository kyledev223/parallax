/**
 * Optional news lookup, keyed by each pair's keywords. Off unless NEWS_ENABLED=true.
 *
 * Providers:
 * - "gdelt" (default): GDELT DOC 2.0 API, free and keyless. Rate-limited to
 *   roughly one request per 5 seconds per IP, so results are cached for 15 minutes.
 * - "rss": any search feed that returns RSS 2.0. Set NEWS_RSS_URL to a template
 *   containing {query}. Check the feed's terms before using it in production.
 */
import type { EventPair, NewsItem } from "./types";
import { getJson, getText, type FetchLike } from "./venues/http";

export type NewsProvider = "gdelt" | "rss";

/** GDELT can be slow; news is non-critical, so give it longer than venue calls. */
const NEWS_TIMEOUT_MS = 15_000;

export interface NewsConfig {
  enabled: boolean;
  provider: NewsProvider;
  rssTemplate?: string;
  limit: number;
}

export function newsConfig(env: Record<string, string | undefined> = process.env): NewsConfig {
  const enabled = ["1", "true", "yes", "on"].includes((env.NEWS_ENABLED ?? "").toLowerCase());
  const provider: NewsProvider = env.NEWS_PROVIDER === "rss" ? "rss" : "gdelt";
  return {
    enabled: enabled && (provider === "gdelt" || Boolean(env.NEWS_RSS_URL?.includes("{query}"))),
    provider,
    rssTemplate: env.NEWS_RSS_URL,
    limit: 8,
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
    const source = tag(block, "source") ?? new URL(url).hostname.replace(/^www\./, "");
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
  const q = buildQuery(pair.keywords.length ? pair.keywords : [pair.title]);
  if (!q) return { status: "ok", items: [], provider: config.provider };

  try {
    if (config.provider === "rss") {
      const url = config.rssTemplate!.replace("{query}", encodeURIComponent(q));
      const xml = await getText(url, { fetchImpl, retries: 0, timeoutMs: NEWS_TIMEOUT_MS });
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
    });
    return { status: "ok", items: dedupe(parseGdelt(json), config.limit), provider: "gdelt" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e), provider: config.provider };
  }
}
