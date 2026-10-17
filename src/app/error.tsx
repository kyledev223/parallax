"use client";

import Link from "next/link";
import type { ErrorInfo } from "next/error";

/** Route-level fallback. Data blocks have their own boundaries, so this is a last resort. */
export default function Error({ retry }: ErrorInfo) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
      <h1 className="text-[clamp(2.5rem,6vw,4rem)] leading-none">Something went wrong</h1>
      <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-muted">
        This page failed to load. It&apos;s usually temporary. Try again, or go back to the screener.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-accent px-5 py-3 text-[15px] font-medium text-bg hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link href="/events" className="rounded-md border border-line px-5 py-3 text-[15px] hover:border-muted">
          Open the screener
        </Link>
      </div>
    </main>
  );
}
