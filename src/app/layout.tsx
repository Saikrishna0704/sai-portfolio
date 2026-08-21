import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";
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

export const metadata: Metadata = {
  title: `${person.name} — ${person.tagline}`,
  description: person.bio,
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
