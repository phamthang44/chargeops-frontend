import type { MetadataRoute } from "next";

const SITE_URL = "https://chargeops.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
