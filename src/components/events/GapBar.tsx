/**
 * Tiny diverging bar: right (verdigris) when Polymarket is higher, left
 * (copper) when Kalshi is. Full width at 8pp. Decorative; the number carries the value.
 */
export function GapBar({ gap, max = 8 }: { gap: number | null; max?: number }) {
  const w = gap == null ? 0 : (Math.min(Math.abs(gap), max) / max) * 50;
  return (
    <span aria-hidden="true" className="relative inline-block h-1.5 w-16 rounded-full bg-line/60 align-middle">
      <span className="absolute inset-y-[-2px] left-1/2 w-px bg-muted/50" />
      {gap != null && gap !== 0 && (
        <span
          className={`absolute inset-y-0 rounded-full ${gap > 0 ? "left-1/2 bg-series-pm" : "right-1/2 bg-series-ks"}`}
          style={{ width: `${w}%` }}
        />
      )}
    </span>
  );
}
