import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getActiveServices } from "@/lib/db/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const services = await getActiveServices();

  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/a-propos`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
  ];

  return [
    ...pages,
    ...services.map((service) => ({
      url: `${base}/services/${service.id}`,
      lastModified: new Date(service.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
