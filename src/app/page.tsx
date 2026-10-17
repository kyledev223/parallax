import type { Metadata } from "next";
import { Suspense } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TickerSkeleton } from "@/components/Ticker";
import { CtaBand } from "@/components/landing/CtaBand";
import { DataFrom } from "@/components/landing/DataFrom";
import { Faq } from "@/components/landing/Faq";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import {
  AlertChips,
  LiveAlertForm,
  LiveDataFrom,
  LivePreview,
  LiveStats,
  LiveTicker,
  MoverChips,
  MoverVisual,
  SpreadChips,
  SpreadVisual,
} from "@/components/landing/Live";
import { AlertFormSkeleton, ArtSkeleton, ChipsSkeleton, PreviewSkeleton } from "@/components/landing/Skeletons";
import { StatCardsSkeleton } from "@/components/landing/StatCards";
import { BlockError } from "@/components/ui/BlockError";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Live block: its own loading skeleton and its own error boundary. */
function Live({ label, fallback, children }: { label: string; fallback: React.ReactNode; children: React.ReactNode }) {
  return (
    <BlockError label={label}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </BlockError>
  );
}

export default function Home() {
  return (
    <>
      <AutoRefresh />
      <Live label="live gaps" fallback={<TickerSkeleton />}>
        <LiveTicker />
      </Live>
      <Nav />
      <main id="main">
        <Hero
          preview={
            <Live label="the screener preview" fallback={<PreviewSkeleton />}>
              <LivePreview />
            </Live>
          }
        />
        <Live label="market summary" fallback={<StatCardsSkeleton />}>
          <LiveStats />
        </Live>
        <Suspense fallback={<DataFrom />}>
          <LiveDataFrom />
        </Suspense>

        <FeatureSection
          id="spreads"
          eyebrow="Spreads"
          title="Every event, measured across venues."
          body="Each event is paired by hand across venues and priced side by side. The gap is the difference in yes probability, in percentage points, refreshed every 30 seconds."
          bullets={[
            "Sorted by widest gap, so disagreements surface first",
            "Filter by politics, economics, sports and more",
            "Stale prices are flagged, never quietly mixed in",
          ]}
          chipsLabel="Widest gaps right now"
          chips={
            <Live label="the widest gaps" fallback={<ChipsSkeleton />}>
              <SpreadChips />
            </Live>
          }
          visual={
            <Live label="the spread chart" fallback={<ArtSkeleton />}>
              <SpreadVisual />
            </Live>
          }
        />

        <FeatureSection
          id="movers"
          reverse
          eyebrow="Movers"
          title="Ask why it moved before you ask whether to bet."
          body="When the odds jump, Plax lines the move up against recent headlines for that event, so you can see what the market may be reacting to."
          bullets={[
            "Biggest 24-hour moves across both venues",
            "Headlines matched to each event's keywords",
            "Odds history and gap history on one chart",
          ]}
          chipsLabel="Biggest 24h moves"
          chips={
            <Live label="the biggest moves" fallback={<ChipsSkeleton />}>
              <MoverChips />
            </Live>
          }
          visual={
            <Live label="the movers chart" fallback={<ArtSkeleton />}>
              <MoverVisual />
            </Live>
          }
        />

        <FeatureSection
          id="alerts"
          eyebrow="Alerts"
          title="Tell me when the gap opens."
          body="Pick an event and a threshold. When the two venues drift that far apart, the alert opens. No account, and you can remove it any time."
          bullets={[
            "Thresholds from 1 to 20 percentage points",
            "One alert per event, checked against live gaps",
            "Saved in this browser while alerts are in early access",
          ]}
          chipsLabel="Close to a 5pp gap"
          chips={
            <Live label="events near a 5pp gap" fallback={<ChipsSkeleton />}>
              <AlertChips />
            </Live>
          }
          visual={
            <Live label="alerts" fallback={<AlertFormSkeleton />}>
              <LiveAlertForm />
            </Live>
          }
        />

        <HowItWorks />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
