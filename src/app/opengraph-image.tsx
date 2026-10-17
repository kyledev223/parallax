import { ImageResponse } from "next/og";
import { C, Frame, OG_SIZE, ogFonts, Wordmark } from "@/components/og/shared";

export const alt = "Parallax: the same event, priced twice. Compare Polymarket and Kalshi odds.";
export const size = OG_SIZE;
export const contentType = "image/png";

// Read once at module scope so the image can be prerendered and cached.
const fonts = await ogFonts();

const HEADLINE = ["The same event,", "priced twice."];

export default async function Image() {
  return new ImageResponse(
    (
      <Frame>
        <Wordmark />

        {/* The headline printed twice, slightly out of register: the site's signature. */}
        <div style={{ display: "flex", position: "relative", fontFamily: "Serif", fontSize: 112, lineHeight: 0.95 }}>
          <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 7, top: 5, color: C.accent, opacity: 0.45 }}>
            {HEADLINE.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {HEADLINE.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 30, color: C.muted }}>See where prediction markets disagree, and why.</div>
            <div style={{ display: "flex", gap: 14, fontSize: 24, color: C.text }}>
              <span>Polymarket</span>
              <span style={{ color: C.muted }}>·</span>
              <span>Kalshi</span>
              <span style={{ color: C.muted }}>· Free, no account</span>
            </div>
          </div>
          <svg width="190" height="120" viewBox="0 0 190 120" fill="none">
            <circle cx="64" cy="60" r="56" stroke={C.pm} strokeWidth="2" />
            <circle cx="126" cy="60" r="56" stroke={C.ks} strokeWidth="2" />
          </svg>
        </div>
      </Frame>
    ),
    { ...size, fonts },
  );
}
