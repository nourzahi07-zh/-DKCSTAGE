import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas are never indexed.
      disallow: ["/patient/", "/admin/", "/auth/"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
