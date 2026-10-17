import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { brewers } from "./__fixtures__/pairs";
import { buildQuery, fetchNews, newsConfig, parseGdelt, parseRss } from "./news";

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
