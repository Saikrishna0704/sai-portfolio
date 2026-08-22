"use client";

import dynamic from "next/dynamic";

import { SceneBoundary } from "@/components/scene/SceneBoundary";
import type { Location } from "@/data/portfolio-data";

import styles from "./LocationView.module.css";

// WebGL has no server-side equivalent; keep it out of the SSR pass entirely.
const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), { ssr: false });

interface LocationViewProps {
  id: string;
  location: Location;
  open: boolean;
  reducedMotion: boolean;
  onToggle: () => void;
}

/**
 * Where one entry happened, on the actual planet.
 *
 * A disclosure rather than a section of its own: the place belongs to the
 * degree or the role, and pulling it out into a separate list of locations
 * asked the reader to hold two things in their head to answer one question.
 *
 * The place is written out in full whether the globe opens or not, so nothing
 * here depends on WebGL or on the disclosure being found.
 */
export function LocationView({
  id,
  location,
  open,
  reducedMotion,
  onToggle,
}: LocationViewProps) {
  const label = `${location.city}, ${location.region}, ${location.country}`;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={`${id}-globe`}
        onClick={onToggle}
      >
        <span className={styles.pin} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
        <span className={styles.hint}>{open ? "Hide" : "Locate"}</span>
      </button>

      {open && (
        <div id={`${id}-globe`} className={styles.panel}>
          <SceneBoundary>
            <div className={styles.globe}>
              <GlobeCanvas
                lat={location.lat}
                lon={location.lon}
                reducedMotion={reducedMotion}
              />
            </div>
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
