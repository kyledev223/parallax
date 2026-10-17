"use client";

import { catchError, type ErrorInfo } from "next/error";

function Fallback({ label, className = "" }: { label: string; className?: string }, { retry }: ErrorInfo) {
  return (
    <div role="alert" className={`rounded-xl border border-line bg-panel p-6 ${className}`}>
      <p className="text-fg">Couldn&apos;t load {label}.</p>
      <p className="mt-1 text-sm text-muted">The rest of the page still works. This is usually a brief venue hiccup.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-md border border-line px-3 py-1.5 text-sm hover:border-muted"
      >
        Try again
      </button>
    </div>
  );
}

/** Error boundary for one data block, so a failure stays local to that block. */
export const BlockError = catchError(Fallback);
