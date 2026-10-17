import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ScreenerSkeleton, ScreenerTable } from "@/components/events/ScreenerTable";
import { VenueNotes } from "@/components/events/VenueNotes";
import { PageShell } from "@/components/PageShell";
import { BlockError } from "@/components/ui/BlockError";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { getSnapshot } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  title: "Events",
  description: "Every paired prediction market on Polymarket and Kalshi, with the gap between them in percentage points.",
  path: "/events",
});

async function Screener() {
  const snap = await getSnapshot();
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Prices updated <RelativeTime iso={snap.fetchedAt} className="text-fg" />. They refresh every 30 seconds.
      </p>
      <VenueNotes venues={snap.venues} />
      <ScreenerTable rows={snap.rows} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <PageShell live>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-none">Events</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Every paired market, priced on both venues and sorted by the widest gap. Select an event for its history and
            related news.
          </p>
        </header>
        <BlockError label="the screener">
          <Suspense fallback={<ScreenerSkeleton />}>
            <Screener />
          </Suspense>
        </BlockError>
      </div>
    </PageShell>
  );
}
