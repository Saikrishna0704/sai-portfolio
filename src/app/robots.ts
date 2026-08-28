import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Nothing here is private, so everything is crawlable. The point of the file
 * is less the permission than the sitemap pointer: without it a crawler has to
 * discover both routes by following links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
