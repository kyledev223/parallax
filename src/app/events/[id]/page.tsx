import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { NewsList, NewsListSkeleton } from "@/components/events/NewsList";
import { OddsCharts, OddsChartsSkeleton } from "@/components/events/OddsCharts";
import { QuoteCards, QuoteCardsSkeleton } from "@/components/events/QuoteCards";
import { PageShell } from "@/components/PageShell";
import { BlockError } from "@/components/ui/BlockError";
import { getEventHistory, getEventNews, getSnapshot } from "@/lib/data";
import { getPair, getPairs } from "@/lib/event-map";
import { pct, shortDate, VENUE_LABEL } from "@/lib/format";
import { mergeHistory } from "@/lib/history";
import { VENUES } from "@/lib/types";

export function generateStaticParams() {
  return getPairs().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  const pair = getPair(id);
  if (!pair) return { title: "Event not found" };
  return pageMetadata({
    title: pair.title,
    description: `${pair.title}: Polymarket and Kalshi odds side by side, the gap between them, 7-day history and related news.`,
    path: `/events/${pair.id}`,
  });
}

async function Quotes({ id }: { id: string }) {
  const snap = await getSnapshot();
  const row = snap.rows.find((r) => r.pair.id === id);
  if (!row) return null;
  return <QuoteCards row={row} />;
}

async function History({ id }: { id: string }) {
  const [history, snap] = await Promise.all([getEventHistory(id), getSnapshot()]);
  if (!history) return null;
  const row = snap.rows.find((r) => r.pair.id === id);
  const points = mergeHistory(history.series.polymarket, history.series.kalshi, {
    latest: row && {
      t: Math.floor(Date.parse(snap.fetchedAt) / 1000),
      pm: row.quotes.polymarket?.yesProbability,
      ks: row.quotes.kalshi?.yesProbability,
    },
  });
  const missing = VENUES.filter((v) => history.series[v] == null || history.series[v]!.length === 0).map(
    (v) => VENUE_LABEL[v],
  );
  return <OddsCharts points={points} missing={missing} />;
}

async function News({ id }: { id: string }) {
  // Request time only: keeps news API calls out of the build, where prerendering
  // every event page at once would burst through the provider's rate limit.
  await connection();
  return <NewsList result={await getEventNews(id)} />;
}

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const pair = getPair(id);
  if (!pair) notFound();

  return (
    <PageShell live>
      <article className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/events" className="hover:text-fg">
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">
              {pair.category}
            </li>
          </ol>
        </nav>

        <header className="mt-5 max-w-3xl">
          <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02]">{pair.title}</h1>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">Category</dt>
              <dd>{pair.category}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Resolves</dt>
              <dd className="num">{shortDate(pair.resolutionDate)}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-10">
          <BlockError label="current prices">
            <Suspense fallback={<QuoteCardsSkeleton />}>
              <Quotes id={pair.id} />
            </Suspense>
          </BlockError>
        </div>

        {pair.notes && (
          <aside className="mt-6 rounded-xl border border-line border-l-accent/70 bg-panel/60 px-5 py-4 text-sm leading-relaxed">
            <h2 className="font-sans font-medium text-fg">How the rules compare</h2>
            <p className="mt-1 max-w-[75ch] text-muted">{pair.notes}</p>
          </aside>
        )}

        <section aria-labelledby="history-title" className="mt-16">
          <h2 id="history-title" className="text-3xl sm:text-4xl">
            Last 7 days
          </h2>
          <p className="mt-2 max-w-[60ch] text-muted">
            Hourly yes probability on each venue, and the gap between them. Hover or use the arrow keys on the chart to read
            exact values.
          </p>
          <div className="mt-6">
            <BlockError label="price history">
              <Suspense fallback={<OddsChartsSkeleton />}>
                <History id={pair.id} />
              </Suspense>
            </BlockError>
          </div>
        </section>

        <section aria-labelledby="news-title" className="mt-16 grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="news-title" className="text-3xl sm:text-4xl">
              In the news
            </h2>
            <p className="mt-2 max-w-[40ch] text-muted">
              Headlines from the past few days that match this event. A headline next to a move is a lead to check, not
              proof of cause.
            </p>
          </div>
          <BlockError label="headlines">
            <Suspense fallback={<NewsListSkeleton />}>
              <News id={pair.id} />
            </Suspense>
          </BlockError>
        </section>

        <p className="mt-16 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          Probabilities are bid/ask midpoints (or last trade when the spread is wider than 10¢), shown to one decimal, e.g.{" "}
          {pct(0.6545)}. See the{" "}
          <Link href="/about" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
            methodology
          </Link>{" "}
          and{" "}
          <Link href="/risk" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
            risk disclaimer
          </Link>
          .
        </p>
      </article>
    </PageShell>
  );
}
