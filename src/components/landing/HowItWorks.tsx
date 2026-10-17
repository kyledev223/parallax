import Link from "next/link";
import { Eyebrow } from "../ui/Mark";

const STEPS = [
  {
    title: "Pair",
    body: "We match markets by hand when they ask the same question, resolve on the same date, and use compatible rules. Automatic matching gets this wrong too often.",
  },
  {
    title: "Normalize",
    body: "Every venue's price becomes a yes probability between 0 and 1, with 24-hour volume in dollars and the time of the last update.",
  },
  {
    title: "Compare",
    body: "The gap is Polymarket's yes probability minus Kalshi's, in percentage points. A positive gap means Polymarket is more confident.",
  },
  {
    title: "Flag stale",
    body: "If either price is more than 10 minutes old, the gap is marked stale. A stale gap may simply reflect one venue not updating yet.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="border-y border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div>
          <Eyebrow>Method</Eyebrow>
          <h2 id="how-title" className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02]">
            How the gap is measured
          </h2>
          <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted">
            Four steps, the same for every event. The full methodology, including known limitations, is on the{" "}
            <Link href="/about" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
              about page
            </Link>
            .
          </p>
        </div>
        <ol className="relative space-y-10">
          <span className="absolute bottom-3 left-[15px] top-3 w-px bg-line" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-6">
              <span className="num relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-bg text-sm text-accent">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <h3 className="font-display text-2xl leading-tight">{s.title}</h3>
                <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
