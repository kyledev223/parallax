/**
 * Live check of every pair in data/event-map.json against both venues.
 *   npm run pairs:check            prices, gaps and anything missing
 *   npm run pairs:check -- --news  also tries the news provider for the first pair
 * Exits non-zero if a venue fails or a pair can't be priced, so it can gate CI.
 */
import { getPairs } from "../src/lib/event-map";
import { pct, pp, usdCompact } from "../src/lib/format";
import { byWidestGap } from "../src/lib/gap";
import { fetchNews, newsConfig } from "../src/lib/news";
import { loadSnapshot } from "../src/lib/snapshot";

const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));
const lpad = (s: string, n: number) => s.padStart(n);

async function main() {
  const pairs = getPairs();
  const t0 = performance.now();
  const snap = await loadSnapshot(pairs);
  const ms = Math.round(performance.now() - t0);

  console.log(`\n${pairs.length} pairs · fetched ${snap.fetchedAt} in ${ms}ms\n`);
  console.log(`${pad("event", 26)} ${lpad("Poly", 7)} ${lpad("Kalshi", 7)} ${lpad("gap", 8)} ${lpad("24h move", 9)} ${lpad("24h vol", 8)}`);
  console.log("-".repeat(70));
  for (const r of [...snap.rows].sort(byWidestGap)) {
    console.log(
      `${pad(r.pair.shortName, 26)} ${lpad(pct(r.quotes.polymarket?.yesProbability), 7)} ${lpad(pct(r.quotes.kalshi?.yesProbability), 7)} ${lpad(pp(r.gapPp), 8)} ${lpad(pp(r.move24hPp), 9)} ${lpad(usdCompact(r.volume24h), 8)}${r.stale ? "  stale" : ""}`,
    );
  }

  let failed = false;
  for (const [venue, s] of Object.entries(snap.venues)) {
    if (!s.ok) {
      failed = true;
      console.log(`\n✗ ${venue} unavailable: ${s.error}`);
    }
    if (s.missing.length) {
      failed = true;
      console.log(`\n✗ ${venue} could not price: ${s.missing.join(", ")}`);
    }
  }

  if (process.argv.includes("--news")) {
    const config = { ...newsConfig({ ...process.env, NEWS_ENABLED: "true" }) };
    const res = await fetchNews(pairs[0], { config });
    console.log(`\nnews (${config.provider}) for ${pairs[0].id}:`, res.status === "ok" ? `${res.items.length} items` : res);
    if (res.status === "ok") for (const i of res.items.slice(0, 5)) console.log(`  ${i.publishedAt.slice(0, 16)}  ${i.source}  ${i.title}`);
  }

  console.log(failed ? "\nSome pairs need attention." : "\nAll pairs priced on both venues.");
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
