import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { brewers } from "./__fixtures__/pairs";
import { buildNewsDataQuery, buildQuery, fetchNews, NEWSDATA_TTL_SECONDS, newsConfig, parseGdelt, parseNewsData, parseRss } from "./news";

const rss = readFileSync(new URL("./__fixtures__/news.rss.xml", import.meta.url), "utf8");

describe("newsConfig", () => {
  it("is off by default", () => {
    expect(newsConfig({}).enabled).toBe(false);
  });

  it("turns on with NEWS_ENABLED and defaults to GDELT", () => {
    expect(newsConfig({ NEWS_ENABLED: "true" })).toMatchObject({ enabled: true, provider: "gdelt" });
  });

  it("requires a {query} template for RSS", () => {
    expect(newsConfig({ NEWS_ENABLED: "1", NEWS_PROVIDER: "rss" }).enabled).toBe(false);
    expect(newsConfig({ NEWS_ENABLED: "1", NEWS_PROVIDER: "rss", NEWS_RSS_URL: "https://x/rss?q={query}" }).enabled).toBe(true);
  });
});

describe("buildQuery", () => {
  it("requires the first keyword and ORs the rest, quoting phrases", () => {
    expect(buildQuery(["Federal Reserve", "FOMC", "interest rates"])).toBe('"Federal Reserve" (FOMC OR "interest rates")');
    expect(buildQuery(["Brewers", "World Series"])).toBe('Brewers "World Series"');
    expect(buildQuery(["Bitcoin"])).toBe("Bitcoin");
    expect(buildQuery([" ", ""])).toBeNull();
  });
});

describe("parsers", () => {
  it("parses a real RSS search feed and strips the source suffix", () => {
    const items = parseRss(rss);
    expect(items).toHaveLength(3);
    expect(items[0].title).toBe("Brewers announce World Series ticket sales for potential Games 1, 2");
    expect(items[0].source).toBe("MLB.com");
    expect(items[0].url).toMatch(/^https:\/\/news\.google\.com\//);
    expect(items[0].publishedAt).toMatch(/^2026-10-/);
  });

  it("decodes entities and CDATA", () => {
    const xml = `<rss><channel><item><title><![CDATA[Fed &amp; markets: "hike" &#8212; maybe]]></title><link>https://ex.com/a</link><pubDate>Fri, 16 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
    expect(parseRss(xml)[0]).toEqual({
      title: 'Fed & markets: "hike" — maybe',
      url: "https://ex.com/a",
      source: "ex.com",
      publishedAt: "2026-10-16T12:00:00.000Z",
    });
  });

  it("skips items without a usable link", () => {
    expect(parseRss("<item><title>x</title><link>javascript:alert(1)</link></item>")).toEqual([]);
  });

  it("parses GDELT article lists", () => {
    const items = parseGdelt({
      articles: [
        { url: "https://www.reuters.com/a", title: "Brewers take Game 1", seendate: "20261016T201500Z", domain: "reuters.com" },
        { url: "", title: "no url" },
      ],
    });
    expect(items).toEqual([
      { title: "Brewers take Game 1", url: "https://www.reuters.com/a", source: "reuters.com", publishedAt: "2026-10-16T20:15:00Z" },
    ]);
  });
});

describe("fetchNews", () => {
  it("does nothing when disabled", async () => {
    const fetchImpl = vi.fn();
    expect(await fetchNews(brewers, { config: newsConfig({}), fetchImpl })).toEqual({ status: "disabled" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches from an RSS template", async () => {
    const fetchImpl = vi.fn(async (_url: string) => new Response(rss, { status: 200 }));
    const config = newsConfig({ NEWS_ENABLED: "1", NEWS_PROVIDER: "rss", NEWS_RSS_URL: "https://feeds.example/search?q={query}" });
    const res = await fetchNews(brewers, { config, fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe(`https://feeds.example/search?q=${encodeURIComponent('Brewers "World Series"')}`);
    expect(res.status === "ok" && res.items.length).toBe(3);
  });

  it("reports rate limiting as an error, not a crash", async () => {
    const fetchImpl = vi.fn(async () => new Response("Please limit requests", { status: 429 }));
    const res = await fetchNews(brewers, { config: newsConfig({ NEWS_ENABLED: "1" }), fetchImpl });
    expect(res).toMatchObject({ status: "error", provider: "gdelt" });
  });
});

describe("NewsData.io provider", () => {
  const env = { NEWS_ENABLED: "true", NEWSDATA_API_KEY: "pub_test123" };

  it("is chosen automatically when a key is set, with a 4-hour cache", () => {
    expect(newsConfig(env)).toMatchObject({ enabled: true, provider: "newsdata", ttlSeconds: NEWSDATA_TTL_SECONDS });
    expect(NEWSDATA_TTL_SECONDS).toBe(4 * 3600);
  });

  it("stays off without a key, and an explicit provider still wins", () => {
    expect(newsConfig({ NEWS_ENABLED: "true", NEWS_PROVIDER: "newsdata" }).enabled).toBe(false);
    expect(newsConfig({ ...env, NEWS_PROVIDER: "gdelt" })).toMatchObject({ provider: "gdelt", ttlSeconds: 900 });
    expect(newsConfig({ NEWSDATA_API_KEY: "pub_x" }).enabled).toBe(false); // flag still required
  });

  it("builds explicit AND/OR queries within the free plan's 100-character limit", () => {
    expect(buildNewsDataQuery(["Federal Reserve", "FOMC", "interest rates"])).toBe(
      '"Federal Reserve" AND (FOMC OR "interest rates")',
    );
    expect(buildNewsDataQuery(["Brewers", "World Series"])).toBe('Brewers AND "World Series"');
    const long = ["Katie Zacharia", "White House press secretary", "resignation announcement", "briefing room departure"];
    const q = buildNewsDataQuery(long)!;
    expect(q.length).toBeLessThanOrEqual(100);
    expect(q.startsWith('"Katie Zacharia" AND')).toBe(true);
    expect(buildNewsDataQuery([])).toBeNull();
  });

  it("parses articles, converts UTC dates and drops flagged duplicates", () => {
    const items = parseNewsData({
      status: "success",
      results: [
        { title: "Fed signals a December hike", link: "https://www.reuters.com/a", source_name: "Reuters", pubDate: "2026-10-16 14:32:11" },
        { title: "Same story again", link: "https://ex.com/dup", source_id: "ex", pubDate: "2026-10-16 15:00:00", duplicate: true },
        { title: "No link", link: null },
      ],
    });
    expect(items).toEqual([
      { title: "Fed signals a December hike", url: "https://www.reuters.com/a", source: "Reuters", publishedAt: "2026-10-16T14:32:11Z" },
    ]);
  });

  it("surfaces NewsData's error envelope as an error", () => {
    expect(() => parseNewsData({ status: "error", results: { message: "API key invalid" } })).toThrow(/API key invalid/);
  });

  const article = (title: string) => ({ title, link: `https://ex.com/${encodeURIComponent(title)}`, source_name: "Ex", pubDate: "2026-10-16 12:00:00" });
  const respond = (...titles: string[]) =>
    new Response(JSON.stringify({ status: "success", results: titles.map(article) }), { status: 200 });

  it("searches metadata only (qInMeta), not full text, via the shared fetch cache", async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => respond("Brewers take Game 1"));
    const res = await fetchNews(brewers, { config: newsConfig(env), fetchImpl });
    expect(res).toMatchObject({ status: "ok", provider: "newsdata", items: [{ title: "Brewers take Game 1" }] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://newsdata.io/api/1/latest");
    expect(u.searchParams.get("apikey")).toBe("pub_test123");
    expect(u.searchParams.get("qInMeta")).toBe('Brewers AND "World Series"');
    expect(u.searchParams.has("q")).toBe(false);
    expect(u.searchParams.get("language")).toBe("en");
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(NEWSDATA_TTL_SECONDS);
  });

  it("makes exactly one request per event, even when nothing matches (rate-limit budget)", async () => {
    const fetchImpl = vi.fn(async () => respond());
    expect(await fetchNews(brewers, { config: newsConfig(env), fetchImpl })).toEqual({
      status: "ok",
      items: [],
      provider: "newsdata",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports quota exhaustion as an error, not a crash", async () => {
    const fetchImpl = vi.fn(async () => new Response('{"status":"error"}', { status: 429 }));
    expect(await fetchNews(brewers, { config: newsConfig(env), fetchImpl })).toMatchObject({ status: "error", provider: "newsdata" });
  });
});

describe("RSS source cleanup", () => {
  it("shows a domain when a feed puts a URL in <source>", () => {
    const xml = `<item><title>Fed holds - x</title><link>https://ex.com/a</link><source url="https://streamlinefeed.co.ke">https://streamlinefeed.co.ke/</source></item>`;
    expect(parseRss(xml)[0].source).toBe("streamlinefeed.co.ke");
  });
});
