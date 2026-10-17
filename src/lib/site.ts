function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Set automatically on Vercel, so OpenGraph and sitemap URLs are absolute without configuration.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Parallax",
  description:
    "Compare prediction-market odds for the same event across Polymarket and Kalshi. See the gap in percentage points, and the news behind the move. Free, no account needed.",
  url: siteUrl(),
  github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/kyledev223/parallax",
};
