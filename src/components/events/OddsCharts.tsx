"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pct, pp } from "@/lib/format";
import { symmetricGapDomain, type MergedPoint } from "@/lib/history";

const PM = "var(--series-pm)";
const KS = "var(--series-ks)";
const GRID = "#252B38";
const TICK = { fill: "#8A8F9C", fontSize: 11, fontFamily: "var(--font-mono)" };
const Y_WIDTH = 44;

function dayTicks(points: MergedPoint[]): number[] {
  if (points.length < 2) return [];
  const first = points[0].t;
  const last = points[points.length - 1].t;
  const out: number[] = [];
  for (let t = Math.ceil(first / 86400) * 86400; t <= last; t += 86400) out.push(t);
  return out;
}

const dayLabel = (t: number) =>
  new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fullLabel = (t: number) =>
  new Date(t * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }) + " UTC";

function oddsDomain(points: MergedPoint[]): [number, number] {
  const vals = points.flatMap((p) => [p.pm, p.ks]).filter((v): v is number => v != null);
  if (!vals.length) return [0, 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = Math.max(0.02, (max - min) * 0.15);
  const step = max - min > 0.4 ? 0.1 : 0.05;
  return [Math.max(0, Math.floor((min - pad) / step) * step), Math.min(1, Math.ceil((max + pad) / step) * step)];
}

function ticksFor([lo, hi]: [number, number]): number[] {
  const step = hi - lo > 0.4 ? 0.1 : hi - lo > 0.15 ? 0.05 : 0.025;
  const out: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

/**
 * Where zero sits inside the gap area's bounding box, since SVG gradients use
 * the path's box, not the axis. The area always includes the zero baseline.
 * (The gap line itself is a neutral solid: a flat line has a zero-height box,
 * which a gradient can't paint.)
 */
function zeroSplit(points: MergedPoint[]): { fill: number } {
  const gaps = points.map((p) => p.gap).filter((g): g is number => g != null);
  if (!gaps.length) return { fill: 0.5 };
  const hi = Math.max(0, ...gaps);
  const lo = Math.min(0, ...gaps);
  return { fill: hi === lo ? 0.5 : hi / (hi - lo) };
}

function LineKey({ color }: { color: string }) {
  return <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

/** One readout for every series at the hovered hour. Values lead, labels follow. */
function Readout({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  const point = payload?.[0]?.payload as MergedPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="min-w-44 rounded-lg border border-line bg-bg/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 text-muted">{fullLabel(point.t)}</p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2">
          <LineKey color={PM} />
          <span className="num text-sm text-fg">{pct(point.pm)}</span>
          <span className="text-muted">Polymarket</span>
        </li>
        <li className="flex items-center gap-2">
          <LineKey color={KS} />
          <span className="num text-sm text-fg">{pct(point.ks)}</span>
          <span className="text-muted">Kalshi</span>
        </li>
        <li className="flex items-center gap-2 border-t border-line pt-1.5">
          <span className="w-4" aria-hidden="true" />
          <span className="num text-sm text-fg">{pp(point.gap)}</span>
          <span className="text-muted">Gap</span>
        </li>
      </ul>
    </div>
  );
}

function describe(points: MergedPoint[], key: "pm" | "ks", name: string): string {
  const vals = points.map((p) => p[key]).filter((v): v is number => v != null);
  if (vals.length < 2) return `${name}: no history.`;
  return `${name} moved from ${pct(vals[0])} to ${pct(vals[vals.length - 1])}.`;
}

export function OddsCharts({
  points,
  missing,
}: {
  points: MergedPoint[];
  /** Venue names whose history couldn't be loaded. */
  missing: string[];
}) {
  const uid = useId().replace(/:/g, "");
  const syncId = `odds-${uid}`;

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center">
        <p className="text-fg">No price history yet.</p>
        <p className="mt-1 text-sm text-muted">
          {missing.length === 2
            ? "Neither venue returned history just now. Try again in a minute."
            : "This market may be new. History appears after the first hours of trading."}
        </p>
      </div>
    );
  }

  const domain = oddsDomain(points);
  const gapDomain = symmetricGapDomain(points);
  const xDomain: [number, number] = [points[0].t, points[points.length - 1].t];
  const ticks = dayTicks(points);
  const last = points[points.length - 1];
  const hasGap = points.some((p) => p.gap != null);
  const tableRows = points.filter((p, i) => p.t % (6 * 3600) === 0 || i === points.length - 1);
  const split = zeroSplit(points);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" aria-hidden="true">
        <span className="inline-flex items-center gap-2">
          <LineKey color={PM} /> <span className="text-muted">Polymarket</span>
          <span className="num text-fg">{pct(last.pm)}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <LineKey color={KS} /> <span className="text-muted">Kalshi</span>
          <span className="num text-fg">{pct(last.ks)}</span>
        </span>
        {missing.length > 0 && <span className="text-xs text-muted">{missing.join(" and ")} history unavailable</span>}
      </div>

      <figure className="rounded-xl border border-line bg-panel px-2 pb-2 pt-4 sm:px-4">
        <figcaption className="sr-only">
          Yes probability over the last 7 days. {describe(points, "pm", "Polymarket")} {describe(points, "ks", "Kalshi")}
        </figcaption>
        <div className="h-[260px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} syncId={syncId} margin={{ top: 8, right: 12, bottom: 10, left: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="t" type="number" domain={xDomain} ticks={ticks} tick={false} axisLine={false} tickLine={false} height={4} />
              <YAxis
                domain={domain}
                ticks={ticksFor(domain)}
                tickFormatter={(v: number) => `${Math.round(v * 1000) / 10}%`}
                tick={TICK}
                width={Y_WIDTH}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={(props) => <Readout active={props.active} payload={props.payload} />} cursor={{ stroke: "#8A8F9C", strokeWidth: 1 }} isAnimationActive={false} />
              <Line
                name="Polymarket"
                dataKey="pm"
                stroke={PM}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, stroke: "#151923", strokeWidth: 2, fill: PM }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                name="Kalshi"
                dataKey="ks"
                stroke={KS}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, stroke: "#151923", strokeWidth: 2, fill: KS }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1 flex items-baseline justify-between px-1 text-xs text-muted sm:pl-[44px]">
            <span>Gap, Polymarket − Kalshi</span>
            <span className="num text-fg">{pp(last.gap)}</span>
          </div>
          {hasGap ? (
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} syncId={syncId} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`gap-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset={split.fill} stopColor={PM} stopOpacity={0.16} />
                      <stop offset={split.fill} stopColor={KS} stopOpacity={0.16} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={xDomain}
                    ticks={ticks}
                    tickFormatter={dayLabel}
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={gapDomain}
                    ticks={[gapDomain[0], 0, gapDomain[1]]}
                    tickFormatter={(v: number) => (v === 0 ? "0" : `${v > 0 ? "+" : "−"}${Math.abs(v)}`)}
                    tick={TICK}
                    width={Y_WIDTH}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine y={0} stroke="#8A8F9C" strokeOpacity={0.6} />
                  <Tooltip content={() => null} cursor={{ stroke: "#8A8F9C", strokeWidth: 1 }} isAnimationActive={false} />
                  <Area
                    name="Gap"
                    dataKey="gap"
                    baseValue={0}
                    stroke="#B9B5AC"
                    strokeWidth={2}
                    fill={`url(#gap-fill-${uid})`}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="px-1 py-6 text-sm text-muted sm:pl-[44px]">The gap appears once both venues have history.</p>
          )}
          <div className="flex justify-between px-1 pb-1 text-[11px] text-muted sm:pl-[44px]">
            <span>Above zero: Polymarket higher</span>
            <span>Below: Kalshi higher</span>
          </div>
        </div>
      </figure>

      <details className="group rounded-lg border border-line">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm text-muted hover:text-fg">View as a table</summary>
        <div className="max-h-80 overflow-auto border-t border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Yes probability on each venue and the gap, every six hours</caption>
            <thead className="sticky top-0 bg-panel text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-normal">Time (UTC)</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Polymarket</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Kalshi</th>
                <th scope="col" className="px-4 py-2 text-right font-normal">Gap</th>
              </tr>
            </thead>
            <tbody>
              {[...tableRows].reverse().map((p) => (
                <tr key={p.t} className="border-t border-line/60">
                  <td className="px-4 py-1.5 text-muted">{fullLabel(p.t).replace(" UTC", "")}</td>
                  <td className="num px-3 py-1.5 text-right">{pct(p.pm)}</td>
                  <td className="num px-3 py-1.5 text-right">{pct(p.ks)}</td>
                  <td className="num px-4 py-1.5 text-right">{pp(p.gap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function OddsChartsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="skeleton h-4 w-64" />
      <div className="rounded-xl border border-line bg-panel p-4">
        <div className="skeleton h-[260px] w-full sm:h-[300px]" />
        <div className="skeleton mt-4 h-[150px] w-full" />
      </div>
    </div>
  );
}
