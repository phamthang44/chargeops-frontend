import type { MetadataRoute } from "next";
import { STATIONS } from "@/components/stations";

const SITE_URL = "https://chargeops.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/tram-sac`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...STATIONS.map((s) => ({
      url: `${SITE_URL}/tram-sac/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
