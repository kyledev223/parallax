/**
 * Landing-page blocks bound to the live snapshot. Each reads the same cached
 * getSnapshot(), so there is still only one request per venue per refresh.
 */
import { getSnapshot } from "@/lib/data";
import { byWidestGap } from "@/lib/gap";
import { movers, nearlyOpen, pairedRows, widest } from "@/lib/selectors";
import { Ticker } from "../Ticker";
import { AlertForm } from "./AlertForm";
import { MoversArt, SpreadArt } from "./Art";
import { Chips } from "./Chips";
import { DataFrom } from "./DataFrom";
import { ArtFrame } from "./FeatureSection";
import { ScreenerPreview } from "./ScreenerPreview";
import { StatCards } from "./StatCards";

export async function LiveTicker() {
  const { rows } = await getSnapshot();
  return <Ticker rows={[...rows].sort(byWidestGap)} />;
}

export async function LivePreview() {
  const { rows } = await getSnapshot();
  return <ScreenerPreview rows={rows} />;
}

export async function LiveStats() {
  const { rows } = await getSnapshot();
  return <StatCards rows={rows} />;
}

export async function LiveDataFrom() {
  const snap = await getSnapshot();
  return <DataFrom snapshot={snap} />;
}

export async function SpreadChips() {
  const { rows } = await getSnapshot();
  return <Chips rows={widest(rows)} kind="gap" label="Widest gaps right now" />;
}

export async function SpreadVisual() {
  const top = widest((await getSnapshot()).rows)[0] ?? null;
  return (
    <ArtFrame caption={top ? `Widest gap now: ${top.pair.title}` : "Live prices are unavailable right now"}>
      <SpreadArt row={top} />
    </ArtFrame>
  );
}

export async function MoverChips() {
  const { rows } = await getSnapshot();
  return <Chips rows={movers(rows)} kind="move" label="Biggest 24-hour moves" />;
}

export async function MoverVisual() {
  const top = movers((await getSnapshot()).rows)[0] ?? null;
  return (
    <ArtFrame caption={top ? `Biggest move: ${top.pair.title}` : "No 24-hour moves reported yet"}>
      <MoversArt row={top} />
    </ArtFrame>
  );
}

export async function AlertChips() {
  const { rows } = await getSnapshot();
  return <Chips rows={nearlyOpen(rows)} kind="gap" label="Events close to a 5 point gap" />;
}

export async function LiveAlertForm() {
  const { rows } = await getSnapshot();
  return (
    <AlertForm
      options={pairedRows(rows).map((r) => ({ id: r.pair.id, shortName: r.pair.shortName, gapPp: r.gapPp }))}
    />
  );
}
