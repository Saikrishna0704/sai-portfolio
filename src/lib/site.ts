/**
 * The site's own absolute base URL.
 *
 * Share metadata, robots.txt and the sitemap all have to state where this site
 * lives, and the deployment host is not known at build time. Vercel supplies
 * its production domain; anything else can set the public variable. No domain
 * is hard-coded, so nothing here silently points at a site that does not exist.
 *
 * Kept in one module because three files each carrying their own copy of this
 * fallback chain could disagree after a domain change — which is exactly the
 * failure that left share cards pointing at a dead address when this project
 * was renamed. One source, so they move together or not at all.
 *
 * Note this resolves at build time and every route here is prerendered, so a
 * change of domain needs a redeploy to take effect.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
