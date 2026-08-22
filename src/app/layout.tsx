import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { OpeningSequence } from "@/components/opening/OpeningSequence";
import { CelestialScene } from "@/components/scene/CelestialScene";
import { portfolioData } from "@/data/portfolio-data";
import { SelectionProvider } from "@/state/selection";

import "./globals.css";
import styles from "./layout.module.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const { person } = portfolioData;

/**
 * Absolute base for share metadata.
 *
 * OpenGraph needs absolute URLs, and the deployment host is not known at
 * build time. Vercel supplies its own; anything else can set the public one.
 * No domain is hard-coded, so nothing here silently points at a site that
 * does not exist yet.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** "https://x.com/exergyofsai" to "@exergyofsai", rather than writing it twice. */
const xHandle = `@${person.links.x.replace(/\/$/, "").split("/").pop()}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${person.name} · ${person.tagline}`,
    template: `%s · ${person.name}`,
  },
  description: person.bio,
  applicationName: person.name,
  authors: [{ name: person.name, url: person.links.linkedin }],
  creator: person.name,
  openGraph: {
    type: "profile",
    url: "/",
    siteName: person.name,
    title: `${person.name} · ${person.tagline}`,
    description: person.bio,
  },
  twitter: {
    card: "summary_large_image",
    creator: xHandle,
    title: `${person.name} · ${person.tagline}`,
    description: person.bio,
  },
};

export const viewport: Viewport = {
  themeColor: "#04060b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <OpeningSequence />

        {/* Selection is shared state: the scene and the DOM navigation both
            read and write it, so neither can drift out of step with the other. */}
        <SelectionProvider>
          {/* The 3D layer is selectable but never the only way to reach
              anything, and carries no information of its own — it stays
              aria-hidden, with the DOM navigation as the accessible path. */}
          <div className={styles.sceneLayer} aria-hidden="true">
            <CelestialScene />
          </div>

          <div className={styles.shell}>
            <SiteHeader />
            <main id="main" className={styles.main}>
              {children}
            </main>
          </div>
        </SelectionProvider>
      </body>
    </html>
  );
}
