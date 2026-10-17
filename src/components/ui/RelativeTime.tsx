"use client";

import { relativeTime } from "@/lib/format";
import { useNow } from "./useNow";

function clock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC`;
}

/** "32s ago", kept current. Server render shows the UTC clock time instead. */
export function RelativeTime({ iso, className = "" }: { iso: string; className?: string }) {
  const now = useNow(10_000);
  return (
    <time dateTime={iso} title={new Date(iso).toUTCString()} className={className}>
      {now == null ? clock(iso) : relativeTime(iso, now)}
    </time>
  );
}
