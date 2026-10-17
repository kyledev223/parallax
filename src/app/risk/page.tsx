import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = pageMetadata({
  title: "Risk disclaimer",
  description: "Parallax shows public market data for information only. It is not financial advice.",
  path: "/risk",
});

export default function RiskPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-none">Risk disclaimer</h1>
        <div className="mt-8 max-w-[64ch] space-y-5 text-[17px] leading-[1.7] text-muted [&_strong]:font-medium [&_strong]:text-fg">
          <p>
            <strong>Parallax is for information only.</strong> It shows prices published by prediction markets and the
            difference between them. It is not financial, investment, legal or tax advice, and nothing here is a
            recommendation to buy, sell or hold any contract.
          </p>
          <p>
            <strong>Prediction markets carry real risk.</strong> You can lose all the money you put into a contract. Prices
            move quickly and can be thin, and a market can resolve in a way you didn&apos;t expect.
          </p>
          <p>
            <strong>A gap between venues is not a guaranteed profit.</strong> Fees, spreads, liquidity, differences in
            resolution rules, and the time until settlement can make a gap impossible to capture.
          </p>
          <p>
            <strong>Data may be delayed, incomplete or wrong.</strong> Always check the price and rules on the venue itself
            before acting.
          </p>
          <p>
            <strong>Check that you&apos;re allowed to trade.</strong> Prediction markets are regulated differently by
            country and state. It is your responsibility to follow the rules where you live.
          </p>
          <p>
            Parallax doesn&apos;t offer trading, hold funds, or have any relationship with the venues it shows. See the{" "}
            <Link href="/about" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
              methodology
            </Link>{" "}
            for how the data is collected.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
