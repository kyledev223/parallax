import Link from "next/link";
import { DoubledHeadline } from "./DoubledHeadline";

/** `preview` is the framed screener, passed in so it can stream live data. */
export function Hero({ preview }: { preview: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_45%_at_22%_18%,rgba(79,179,161,0.17),transparent_70%),radial-gradient(40%_35%_at_85%_8%,rgba(79,179,161,0.07),transparent_70%)]"
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm text-muted">
          <span className="text-fg">Polymarket</span> · <span className="text-fg">Kalshi</span> · More soon
        </p>
        <DoubledHeadline
          text="The same event, priced twice."
          className="mt-6 max-w-[15ch] text-[clamp(3rem,8.6vw,7.25rem)] leading-[0.92]"
        />
        <p className="mt-7 max-w-[36ch] text-lg leading-relaxed text-muted sm:text-xl">
          See where prediction markets disagree, and why. Free, no account needed.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/events"
            className="rounded-md bg-accent px-5 py-3 text-[15px] font-medium text-bg transition-colors hover:bg-accent-hover"
          >
            Open the terminal free
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-md border border-line px-5 py-3 text-[15px] text-fg transition-colors hover:border-muted"
          >
            How it works
          </Link>
        </div>

        <div className="mt-16 sm:mt-20">
          {preview}
        </div>
      </div>
    </section>
  );
}
