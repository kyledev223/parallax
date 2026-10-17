import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getPairs } from "@/lib/event-map";
import { STALE_AFTER_MS, WIDE_GAP_PP } from "@/lib/gap";
import { MAX_MID_SPREAD } from "@/lib/venues/price";

export const metadata: Metadata = pageMetadata({
  title: "Methodology",
  description: "How Parallax pairs markets across venues, computes the gap, handles stale data, and where it falls short.",
  path: "/about",
});

const SECTIONS = [
  { id: "pairs", title: "How pairs are chosen" },
  { id: "prices", title: "How prices are read" },
  { id: "gap", title: "How the gap is computed" },
  { id: "freshness", title: "Data delays and staleness" },
  { id: "news", title: "News" },
  { id: "limitations", title: "Limitations" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line pt-10">
      <h2 id={`${id}-h`} className="text-3xl leading-tight sm:text-[2.5rem]">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[17px] leading-[1.7] text-muted [&_strong]:font-medium [&_strong]:text-fg">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  const count = getPairs().length;
  const spreadCents = Math.round(MAX_MID_SPREAD * 100);
  const staleMin = STALE_AFTER_MS / 60_000;

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <header className="lg:col-span-2">
          <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-none">Methodology</h1>
          <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-muted">
            Parallax compares what different prediction markets charge for the same outcome. This page explains exactly how,
            and where the comparison can mislead.
          </p>
        </header>

        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 space-y-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted hover:text-fg">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-[68ch] space-y-14">
          <Section id="pairs" title="How pairs are chosen">
            <p>
              Every pair is matched by hand and kept in a file in the project. There are {count} today. A pair is added only
              when both markets ask <strong>the same question</strong>, resolve <strong>in the same window</strong>, and use{" "}
              <strong>compatible rules</strong>. We read each venue&apos;s resolution rules before adding a pair, and note any
              differences on the event page.
            </p>
            <p>
              Automatic matching by title is unreliable. Two markets can look the same and still resolve differently. For
              example, one venue&apos;s &ldquo;Anthropic IPO before 2027&rdquo; resolves when an IPO is{" "}
              <em>announced</em>, while another&apos;s resolves when the IPO actually <em>happens</em>. We left that pair
              out: the prices answer different questions, so their gap means little.
            </p>
            <p>
              Some pairs are close but not identical, such as two Bitcoin markets that read different price indexes, or a
              Senate race where one venue resolves on the election result and the other on who is sworn in. Those are kept,
              with the difference noted, because the gap is still informative.
            </p>
          </Section>

          <Section id="prices" title="How prices are read">
            <p>
              Both venues are read through their public, read-only APIs: Polymarket&apos;s Gamma API for market prices and
              its CLOB API for history; Kalshi&apos;s Trade API for markets and hourly candlesticks. No account or API key
              is used.
            </p>
            <p>
              Every price is turned into a <strong>yes probability between 0 and 1</strong> with one rule for both venues:
              the <strong>midpoint of the best bid and ask</strong> when they are {spreadCents}¢ or less apart, otherwise
              the <strong>last traded price</strong>. This avoids showing a stale trade when the order book has moved, and
              avoids a meaningless midpoint when the book is very wide.
            </p>
            <p>
              24-hour volume is in US dollars. Polymarket reports it directly. Kalshi reports contracts, so we multiply by
              the current yes price. That makes Kalshi volume an approximation.
            </p>
          </Section>

          <Section id="gap" title="How the gap is computed">
            <p>
              <strong>Gap = Polymarket yes probability − Kalshi yes probability</strong>, in percentage points, rounded to
              0.1. If Polymarket prices yes at 62% and Kalshi at 57%, the gap is +5.0pp. A negative gap means Kalshi prices
              yes higher.
            </p>
            <p>
              The screener sorts by the absolute gap, so the largest disagreements come first in either direction. Gaps of{" "}
              {WIDE_GAP_PP}pp or more are highlighted. The history chart aligns both venues on an hourly grid and computes the
              gap at each hour where both have a price.
            </p>
          </Section>

          <Section id="freshness" title="Data delays and staleness">
            <p>
              Prices are fetched on our server and refreshed in the background every 30 seconds, and open pages update
              themselves on the same rhythm. What you see is usually under a minute old; every price shows when it was
              last updated. Price history refreshes about every minute, and news every 15 minutes. Polymarket&apos;s own
              data can lag its order book by a minute or two.
            </p>
            <p>
              A gap is marked <strong>stale</strong> when either price is more than {staleMin} minutes old. Kalshi&apos;s
              API doesn&apos;t say when a price last changed, so for Kalshi we use the time we read it. If a venue stops
              responding, its last known price stays on screen and is flagged stale once it ages past {staleMin} minutes.
              If we have no price at all, that venue is shown as unavailable and no gap is computed.
            </p>
          </Section>

          <Section id="news" title="News">
            <p>
              When enabled, each event shows recent headlines that match its keywords. A headline next to a move is a lead
              to check, not evidence that it caused the move. Headlines come from a third-party news index and may be
              incomplete or late.
            </p>
          </Section>

          <Section id="limitations" title="Limitations">
            <ul className="list-disc space-y-3 pl-5 marker:text-line">
              <li>
                <strong>A gap is not free money.</strong> Fees, bid/ask spreads, deposit and withdrawal costs, and the time
                until resolution can all exceed it.
              </li>
              <li>
                <strong>Liquidity differs.</strong> A thin market can show a large gap that disappears after one small
                trade. Check volume and the order book on the venue.
              </li>
              <li>
                <strong>Rules can differ in small ways</strong>, such as the resolution source, cutoff time, or treatment of
                edge cases. We note what we find, but you should read the rules on each venue.
              </li>
              <li>
                <strong>Access differs.</strong> The venues have different eligibility rules by country and state, which
                keeps some gaps open.
              </li>
              <li>
                <strong>Data can be delayed or wrong.</strong> We show what the venues&apos; public APIs report, a minute or
                so behind. Always confirm on the venue before acting.
              </li>
            </ul>
            <p>
              Parallax is not affiliated with Polymarket or Kalshi. Read the{" "}
              <Link href="/risk" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
                risk disclaimer
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
