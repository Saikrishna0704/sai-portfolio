"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useSelection } from "@/state/selection";

import { SceneBoundary } from "./SceneBoundary";

// WebGL has no server-side equivalent; keep it out of the SSR pass entirely.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export function CelestialScene() {
  // Read here, outside the Canvas, and hand down as props: R3F renders with
  // its own reconciler, so context is not reliably shared across the boundary.
  const { selection, hover, activeDomainId, select, setHover } = useSelection();

  // Anywhere but the overview, the scene is scenery behind a reading surface.
  const isBackdrop = usePathname() !== "/";

  return (
    <SceneBoundary>
      <SceneCanvas
        selection={selection}
        activeDomainId={activeDomainId}
        hover={hover}
        isBackdrop={isBackdrop}
        onSelect={select}
        onHover={setHover}
      />
    </SceneBoundary>
  );
}
