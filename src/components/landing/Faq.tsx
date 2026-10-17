"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Eyebrow } from "../ui/Mark";

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is it free?",
    a: "Yes. Plax is free to use and there is no account to create. It reads public market data and doesn't sell anything.",
  },
  {
    q: "What is a gap?",
    a: "The difference between two venues' prices for the same outcome, in percentage points. If Polymarket prices yes at 62% and Kalshi at 57%, the gap is +5.0pp. It is measured on the last traded or midpoint price, so it ignores fees and spreads.",
  },
  {
    q: "How are events matched?",
    a: (
      <>
        By hand. Each pair is listed in a file in the project and checked for the same question, resolution date and
        rules. Markets that look alike but resolve differently are left out. See the{" "}
        <Link href="/about" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
          methodology
        </Link>{" "}
        for details.
      </>
    ),
  },
  {
    q: "How fresh is the data?",
    a: "Prices refresh every 30 seconds and are usually under a minute old. Each price shows when it last updated, and a gap is marked stale when either side is more than 10 minutes old.",
  },
  {
    q: "Which venues are covered?",
    a: "Polymarket and Kalshi today. More venues will be added where markets overlap closely enough to compare.",
  },
  {
    q: "Is this financial advice?",
    a: (
      <>
        No. A gap is not a trade recommendation. Venues differ in fees, rules, liquidity and who can use them, and any
        of those can explain a gap. Read the{" "}
        <Link href="/risk" className="text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
          risk disclaimer
        </Link>
        .
      </>
    ),
  },
];

export function Faq() {
  const base = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="faq-title" className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02]">
            Questions, answered plainly
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            const btn = `${base}-q${i}`;
            const panel = `${base}-a${i}`;
            return (
              <div key={item.q}>
                <h3 className="font-sans">
                  <button
                    id={btn}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panel}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] text-fg hover:text-accent-hover"
                  >
                    {item.q}
                    <span
                      aria-hidden="true"
                      className={`relative size-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                    >
                      <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                      <span className="absolute left-1/2 top-0 h-full w-px bg-current" />
                    </span>
                  </button>
                </h3>
                <div
                  id={panel}
                  role="region"
                  aria-labelledby={btn}
                  className="accordion-panel"
                  data-open={isOpen}
                  inert={!isOpen}
                >
                  <div>
                    <p className="max-w-[62ch] pb-6 leading-relaxed text-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
