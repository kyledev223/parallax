import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
        <h1 className="text-[clamp(2.75rem,6vw,4.5rem)] leading-none">Not found</h1>
        <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-muted">
          There&apos;s no page or tracked event at this address. It may have resolved and been removed from the screener.
        </p>
        <Link
          href="/events"
          className="mt-8 inline-block rounded-md bg-accent px-5 py-3 text-[15px] font-medium text-bg hover:bg-accent-hover"
        >
          Browse all events
        </Link>
      </div>
    </PageShell>
  );
}
