import { summarize } from "@/lib/gap";
import type { EventRow } from "@/lib/types";
import { AnimatedNumber, type NumberFormat } from "../ui/AnimatedNumber";

type Stat = { label: string; value: number | null; format: NumberFormat; note: string };

export function StatCards({ rows }: { rows: EventRow[] }) {
  const s = summarize(rows);
  const paired = rows.filter((r) => r.gapPp != null).length;
  const stats: Stat[] = [
    { label: "Events tracked", value: s.eventsTracked, format: "int", note: `${paired} priced on both venues` },
    {
      label: "Widest gap now",
      value: s.widestGapPp,
      format: "ppAbs",
      note: s.widestGapEvent ? s.widestGapEvent.pair.shortName : "No paired prices yet",
    },
    { label: "24h combined volume", value: s.combinedVolume24h, format: "usd", note: "Both venues, all tracked events" },
    { label: "Average gap", value: s.averageGapPp, format: "ppAbs", note: "Absolute, across paired events" },
  ];

  return (
    <section aria-label="Market summary" className="mx-auto max-w-6xl px-4 sm:px-6">
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4 [&>div]:bg-panel gap-px">
        {stats.map((st) => (
          <div key={st.label} className="flex flex-col gap-2 p-5 sm:p-6">
            <dt className="text-sm text-muted">{st.label}</dt>
            <dd className="order-first text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-fg">
              <AnimatedNumber value={st.value} format={st.format} />
            </dd>
            <dd className="truncate text-xs text-muted">{st.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-panel p-5 sm:p-6">
            <div className="skeleton h-8 w-24" />
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
