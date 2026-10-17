import { ImageResponse } from "next/og";
import { C, Frame, OG_SIZE, ogFonts, Wordmark } from "@/components/og/shared";
import { getSnapshot } from "@/lib/data";
import { getPair, getPairs } from "@/lib/event-map";
import { pct, pp } from "@/lib/format";

export const alt = "Polymarket and Kalshi odds for this event, and the gap between them";
export const size = OG_SIZE;
export const contentType = "image/png";

// Read once at module scope so the image can be prerendered and cached.
const fonts = await ogFonts();

export function generateStaticParams() {
  return getPairs().map((p) => ({ id: p.id }));
}

function Venue({ name, color, value }: { name: string; color: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: C.muted }}>
        <div style={{ width: 28, height: 3, borderRadius: 2, background: color }} />
        {name}
      </div>
      <div style={{ fontFamily: "Mono", fontSize: 76, color: C.text }}>{value}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pair = getPair(id);
  const snap = pair ? await getSnapshot() : null;
  const row = snap?.rows.find((r) => r.pair.id === id);
  const gap = row?.gapPp ?? null;
  const asOf = snap
    ? new Date(snap.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })
    : null;

  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark />
          <div style={{ fontSize: 24, color: C.muted }}>{pair?.category ?? ""}</div>
        </div>

        <div style={{ display: "flex", fontFamily: "Serif", fontSize: pair && pair.title.length > 48 ? 64 : 76, lineHeight: 1.02, maxWidth: 1000 }}>
          {pair?.title ?? "Event not found"}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 72 }}>
            <Venue name="Polymarket" color={C.pm} value={pct(row?.quotes.polymarket?.yesProbability)} />
            <Venue name="Kalshi" color={C.ks} value={pct(row?.quotes.kalshi?.yesProbability)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <div style={{ fontSize: 26, color: C.muted }}>{asOf ? `Gap at ${asOf} UTC` : "Gap"}</div>
            <div
              style={{
                fontFamily: "Mono",
                fontSize: 76,
                color: gap != null && Math.abs(gap) >= 5 ? C.accent : C.text,
              }}
            >
              {pp(gap)}
            </div>
          </div>
        </div>
      </Frame>
    ),
    { ...size, fonts },
  );
}
