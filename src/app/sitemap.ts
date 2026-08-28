import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * The two real pages.
 *
 * The blog is deliberately absent: it lives on another domain, and a sitemap
 * may only speak for the host that serves it. Its own site carries its own.
 *
 * `lastModified` resolves when the build runs, which is the honest answer —
 * these pages are static, so the deploy is the moment they last changed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/dossier`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
