import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { CelestialScene } from "@/components/scene/CelestialScene";
import { portfolioData } from "@/data/portfolio-data";

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

        {/* Ambient 3D layer. Sits behind every DOM surface and carries no
            information of its own — the shell reads correctly without it. */}
        <div className={styles.sceneLayer} aria-hidden="true">
          <CelestialScene />
        </div>

        <div className={styles.shell}>
          <SiteHeader />
          <main id="main" className={styles.main}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
