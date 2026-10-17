import { pct, pp } from "@/lib/format";
import type { EventRow } from "@/lib/types";

/**
 * Original abstract art: oxidized-copper textures built from SVG turbulence,
 * and the parallax motif of two overlapping, offset circles.
 */

function Patina({ id, seed, copper = false }: { id: string; seed: number; copper?: boolean }) {
  // Grayscale noise → verdigris (or copper-tinged) ramp.
  const r = copper ? "0.06 0.20 0.45 0.62" : "0.04 0.10 0.22 0.42";
  const g = copper ? "0.07 0.16 0.30 0.52" : "0.08 0.22 0.48 0.78";
  const b = copper ? "0.08 0.14 0.24 0.40" : "0.09 0.20 0.42 0.66";
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.016" numOctaves="5" seed={seed} result="n" />
      <feColorMatrix in="n" type="matrix" values="0.4 0.4 0.4 0 0  0.4 0.4 0.4 0 0  0.4 0.4 0.4 0 0  0 0 0 0 1" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={r} />
        <feFuncG type="table" tableValues={g} />
        <feFuncB type="table" tableValues={b} />
      </feComponentTransfer>
    </filter>
  );
}

const MONO = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" } as const;

export function SpreadArt({ row }: { row: EventRow | null }) {
  // No live row: draw the lenses at a neutral offset and show dashes, never invented numbers.
  const pm = row?.quotes.polymarket?.yesProbability ?? null;
  const ks = row?.quotes.kalshi?.yesProbability ?? null;
  const gap = row?.gapPp ?? null;
  // Offset between the two lenses grows with the gap (clamped to stay legible).
  const d = Math.min(210, 70 + Math.abs(gap ?? 4) * 14);
  const cy = 210;
  const r = 128;
  const ax = 240 - d / 2;
  const bx = 240 + d / 2;

  return (
    <svg viewBox="0 0 480 420" className="h-auto w-full" role="img" aria-labelledby="spread-art-title">
      <title id="spread-art-title">
        {row
          ? `${row.pair.shortName}: Polymarket ${pct(pm)}, Kalshi ${pct(ks)}, a ${pp(gap)} gap.`
          : "Two overlapping circles, offset to show a gap between venues. Live prices are unavailable right now."}
      </title>
      <defs>
        <Patina id="sa-patina-a" seed={11} />
        <Patina id="sa-patina-b" seed={4} copper />
        <clipPath id="sa-clip-a">
          <circle cx={ax} cy={cy} r={r} />
        </clipPath>
        <clipPath id="sa-clip-b">
          <circle cx={bx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="sa-vignette" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#151923" stopOpacity="0" />
          <stop offset="100%" stopColor="#0D0F14" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <rect width="480" height="420" fill="#0f1218" />

      <g clipPath="url(#sa-clip-b)" opacity="0.75">
        <rect width="480" height="420" filter="url(#sa-patina-b)" />
      </g>
      <g clipPath="url(#sa-clip-a)" opacity="0.85">
        <rect width="480" height="420" filter="url(#sa-patina-a)" />
      </g>
      {/* Where the venues agree: the lens overlap, brightened. */}
      <g clipPath="url(#sa-clip-a)">
        <circle cx={bx} cy={cy} r={r} fill="#7FD4C4" opacity="0.16" />
      </g>
      <rect width="480" height="420" fill="url(#sa-vignette)" />

      <circle cx={ax} cy={cy} r={r} fill="none" stroke="#4FB3A1" strokeWidth="1.25" />
      <circle cx={bx} cy={cy} r={r} fill="none" stroke="#E8E4DA" strokeOpacity="0.45" strokeWidth="1.25" />

      {/* Dimension line between centers */}
      <g stroke="#E8E4DA" strokeOpacity="0.7" strokeWidth="1">
        <line x1={ax} y1={52} x2={bx} y2={52} />
        <line x1={ax} y1={46} x2={ax} y2={58} />
        <line x1={bx} y1={46} x2={bx} y2={58} />
        <line x1={ax} y1={58} x2={ax} y2={cy} strokeDasharray="2 4" strokeOpacity="0.35" />
        <line x1={bx} y1={58} x2={bx} y2={cy} strokeDasharray="2 4" strokeOpacity="0.35" />
      </g>
      <text x="240" y="38" textAnchor="middle" fill="#4FB3A1" fontSize="15" style={MONO}>
        {pp(gap)}
      </text>
      <circle cx={ax} cy={cy} r="2.5" fill="#4FB3A1" />
      <circle cx={bx} cy={cy} r="2.5" fill="#E8E4DA" />

      <g fontSize="12" style={MONO}>
        <text x={ax} y={cy + r + 28} textAnchor="middle" fill="#8A8F9C">
          Polymarket
        </text>
        <text x={ax} y={cy + r + 48} textAnchor="middle" fill="#E8E4DA" fontSize="15">
          {pct(pm)}
        </text>
        <text x={bx} y={cy + r + 28} textAnchor="middle" fill="#8A8F9C">
          Kalshi
        </text>
        <text x={bx} y={cy + r + 48} textAnchor="middle" fill="#E8E4DA" fontSize="15">
          {pct(ks)}
        </text>
      </g>
    </svg>
  );
}

export function MoversArt({ row }: { row: EventRow | null }) {
  const move = row?.move24hPp ?? null;
  const up = (move ?? 1) >= 0;
  // A quiet line, one decisive step, then a new level.
  const path = up
    ? "M24 300 L70 296 L110 302 L150 294 L190 298 L226 292 L236 196 L262 204 L300 190 L340 198 L380 186 L420 192 L456 184"
    : "M24 170 L70 176 L110 168 L150 174 L190 166 L226 172 L236 268 L262 262 L300 276 L340 268 L380 280 L420 272 L456 280";
  const jumpY = up ? 196 : 268;

  return (
    <svg viewBox="0 0 480 420" className="h-auto w-full" role="img" aria-labelledby="movers-art-title">
      <title id="movers-art-title">
        {row
          ? `${row.pair.shortName} moved ${pp(move)} in 24 hours.`
          : "A price line on a copper plate, stepping sharply at one moment."}
      </title>
      <defs>
        <Patina id="ma-patina" seed={23} copper />
        <linearGradient id="ma-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D0F14" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0D0F14" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <rect width="480" height="420" filter="url(#ma-patina)" opacity="0.7" />
      <rect width="480" height="420" fill="url(#ma-fade)" />

      {/* Ripples from the moment of the move, drawn from two offset centers. */}
      <g fill="none" strokeWidth="1">
        {[40, 80, 120, 160].map((rr, i) => (
          <circle key={`a${rr}`} cx="232" cy={jumpY} r={rr} stroke="#4FB3A1" strokeOpacity={0.5 - i * 0.1} />
        ))}
        {[40, 80, 120, 160].map((rr, i) => (
          <circle key={`b${rr}`} cx="250" cy={jumpY + 8} r={rr} stroke="#E8E4DA" strokeOpacity={0.22 - i * 0.04} />
        ))}
      </g>

      <path d={path} fill="none" stroke="#E8E4DA" strokeWidth="1.75" strokeLinejoin="round" />
      <line x1="231" y1="40" x2="231" y2="380" stroke="#E8E4DA" strokeOpacity="0.3" strokeDasharray="2 4" />
      <circle cx="231" cy="40" r="4" fill="#4FB3A1" />
      <text x="242" y="44" fill="#E8E4DA" fontSize="12" style={MONO}>
        headline
      </text>

      <text x="24" y="396" fill="#8A8F9C" fontSize="12" style={MONO}>
        24h
      </text>
      <text x="456" y="396" textAnchor="end" fill={move == null ? "#8A8F9C" : up ? "#5CD18B" : "#F2716B"} fontSize="15" style={MONO}>
        {pp(move)}
      </text>
    </svg>
  );
}
