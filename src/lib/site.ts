function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Set automatically on Vercel, so OpenGraph and sitemap URLs are absolute without configuration.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * Social links. Leave a value empty to hide its button; nothing renders a dead link.
 * Fill these in directly, or set the env vars (env wins).
 */
const TWITTER = process.env.NEXT_PUBLIC_TWITTER ?? ""; // "@handle", "handle" or a full x.com URL
const PUMPFUN_CA = process.env.NEXT_PUBLIC_PUMPFUN_CA ?? ""; // token contract address

export function twitterUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://x.com/${v.replace(/^@/, "")}`;
}

export function pumpFunUrl(ca: string): string | null {
  const v = ca.trim();
  return v ? `https://pump.fun/coin/${v}` : null;
}

export const SITE = {
  name: "Plax",
  description:
    "Compare prediction-market odds for the same event across Polymarket and Kalshi. See the gap in percentage points, and the news behind the move. Free, no account needed.",
  url: siteUrl(),
  social: {
    twitter: twitterUrl(TWITTER),
    pumpfun: pumpFunUrl(PUMPFUN_CA),
  },
};
