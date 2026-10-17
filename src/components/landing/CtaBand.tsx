import Link from "next/link";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden border-t border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(79,179,161,0.16),transparent_70%)]"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 600 300"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-40"
      >
        <circle cx="255" cy="150" r="140" fill="none" stroke="#4FB3A1" strokeOpacity="0.5" />
        <circle cx="345" cy="150" r="140" fill="none" stroke="#E8E4DA" strokeOpacity="0.2" />
      </svg>
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <h2 id="cta-title" className="max-w-[16ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1]">
          Follow the gap to the source.
        </h2>
        <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted">
          Every paired event, both prices, and the headlines in between.
        </p>
        <Link
          href="/events"
          className="mt-9 rounded-md bg-accent px-5 py-3 text-[15px] font-medium text-bg transition-colors hover:bg-accent-hover"
        >
          Open the terminal free
        </Link>
      </div>
    </section>
  );
}
