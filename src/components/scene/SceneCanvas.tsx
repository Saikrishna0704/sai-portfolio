"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { planets } from "@/scene/layout";
import type { Hover, Selection } from "@/state/selection";

import { AsteroidBelt } from "./AsteroidBelt";
import { CameraRig } from "./CameraRig";
import { CentralStar } from "./CentralStar";
import { DomainPlanet } from "./DomainPlanet";
import { OrbitGuide } from "./OrbitGuide";
import { Starfield } from "./Starfield";

interface SceneCanvasProps {
  selection: Selection;
  activeDomainId: string | null;
  onSelect: (next: Selection) => void;
  onHover: (next: Hover | null) => void;
}

/**
 * Phase 4: the system responds.
 *
 * Bodies are hoverable and selectable, emphasis follows the active domain, and
 * project labels appear only for the domain in focus. The camera does not move
 * yet — that is Phase 5.
 *
 * Selection state is owned by React and passed in as props rather than read
 * from context inside the Canvas: R3F renders with its own reconciler, so an
 * explicit prop avoids depending on context bridging.
 *
 * The canvas is transparent so the page's CSS ground is the single source of
 * the background colour.
 */
export default function SceneCanvas({
  selection,
  activeDomainId,
  onSelect,
  onHover,
}: SceneCanvasProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [pointerOverBody, setPointerOverBody] = useState(false);
  // Asteroids belong to no domain, so their hover cannot ride on the domain
  // hover the planets share.
  const [hoveredAsteroidId, setHoveredAsteroidId] = useState<string | null>(null);

  // A pointer cursor is the conventional signal that something is clickable.
  // Set on the canvas element's container rather than per-object so it cannot
  // be left stuck when a body unmounts mid-hover.
  useEffect(() => {
    document.body.style.cursor = pointerOverBody ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [pointerOverBody]);

  const handleHover = useCallback(
    (next: Hover | null) => {
      setPointerOverBody(next !== null);
      onHover(next);
    },
    [onHover],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 400 }}
      // Clicking empty space returns to the overview, the same as Escape.
      onPointerMissed={() => onSelect({ kind: "overview" })}
    >
      <CameraRig selection={selection} reducedMotion={reducedMotion} />

      {/* Low ambient so night sides read as shadowed, not as holes. */}
      <ambientLight intensity={0.22} />
      {/* The star lights the system from the centre it occupies. */}
      <pointLight position={[0, 0, 0]} intensity={520} distance={0} decay={2} />

      <Starfield reducedMotion={reducedMotion} />
      <CentralStar />

      {planets.map((planet) => (
        <OrbitGuide
          key={`orbit-${planet.domainId}`}
          radius={planet.orbitRadius}
          opacity={
            activeDomainId === null
              ? 0.16
              : activeDomainId === planet.domainId
                ? 0.42
                : 0.06
          }
        />
      ))}

      {planets.map((planet) => (
        <DomainPlanet
          key={planet.domainId}
          planet={planet}
          reducedMotion={reducedMotion}
          activeDomainId={activeDomainId}
          selection={selection}
          onSelect={onSelect}
          onHover={handleHover}
        />
      ))}

      <AsteroidBelt
        selection={selection}
        reducedMotion={reducedMotion}
        hoveredId={hoveredAsteroidId}
        onSelect={onSelect}
        onHover={(id) => {
          setHoveredAsteroidId(id);
          setPointerOverBody(id !== null);
        }}
      />
    </Canvas>
  );
}
