import type { MetadataRoute } from "next";
import { getPairs } from "@/lib/event-map";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE.url).toString();
  return [
    { url: url("/"), changeFrequency: "hourly", priority: 1 },
    { url: url("/events"), changeFrequency: "hourly", priority: 0.9 },
    ...getPairs().map((p) => ({ url: url(`/events/${p.id}`), changeFrequency: "hourly" as const, priority: 0.7 })),
    { url: url("/about"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/risk"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
