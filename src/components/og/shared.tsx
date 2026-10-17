/**
 * Shared pieces for next/og images. Satori renders a subset of CSS: every
 * element with more than one child needs display:flex, and fonts must be
 * TTF/OTF/WOFF (not WOFF2). Fonts live in assets/fonts (OFL, from Fontsource)
 * and are included in serverless bundles via outputFileTracingIncludes.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  bg: "#0D0F14",
  panel: "#151923",
  border: "#252B38",
  accent: "#4FB3A1",
  text: "#E8E4DA",
  muted: "#8A8F9C",
  pm: "#2FA48F",
  ks: "#D17A3F",
};

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export async function ogFonts() {
  const [serif, mono, sans, sansMedium] = await Promise.all([
    font("InstrumentSerif-Regular.woff"),
    font("JetBrainsMono-Medium.woff"),
    font("Inter-Regular.woff"),
    font("Inter-Medium.woff"),
  ]);
  return [
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
    { name: "Sans", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Sans", data: sansMedium, weight: 500 as const, style: "normal" as const },
  ];
}

export function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width="44" height="33" viewBox="0 0 24 18" fill="none">
        <circle cx="8.5" cy="9" r="6.75" stroke={C.accent} strokeWidth="1.5" />
        <circle cx="15.5" cy="9" r="6.75" stroke={C.accent} strokeWidth="1.5" opacity="0.55" />
      </svg>
      <div style={{ fontFamily: "Sans", fontWeight: 500, fontSize: 24, letterSpacing: 8, color: C.text }}>PARALLAX</div>
    </div>
  );
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: `radial-gradient(ellipse 70% 60% at 18% 12%, rgba(79,179,161,0.20), rgba(13,15,20,0) 70%), ${C.bg}`,
        color: C.text,
        fontFamily: "Sans",
      }}
    >
      {children}
    </div>
  );
}
