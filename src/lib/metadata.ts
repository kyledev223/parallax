import type { Metadata } from "next";

/**
 * Per-page metadata. Next merges metadata shallowly, so a page that sets only
 * `title` would inherit the root layout's openGraph/twitter titles. This sets
 * all three together. Images come from the nearest opengraph-image file.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const full = `${title} · Plax`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Plax", title: full, description, url: path },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
