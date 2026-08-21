"use client";

import { Canvas } from "@react-three/fiber";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { planets } from "@/scene/layout";

import { CameraRig } from "./CameraRig";
import { CentralStar } from "./CentralStar";
import { DomainPlanet } from "./DomainPlanet";
import { OrbitGuide } from "./OrbitGuide";
import { Starfield } from "./Starfield";

/**
 * Phase 3: the system is alive.
 *
 * Planets travel their orbits, bodies spin, and the sky drifts — all of it
 * slow enough to read as ambient life rather than animation. The star holds
 * still: it is the fixed centre the rest of the system is measured against.
 *
 * The reduced-motion preference is read here, outside the Canvas, and passed
 * down as a prop rather than through context — R3F renders with its own
 * reconciler, and an explicit prop avoids depending on context bridging.
 * When motion is reduced the scene renders exactly as its static layout, which
 * is a complete view in itself.
 *
 * The canvas is transparent so the page's CSS ground is the single source of
 * the background colour.
 */
export default function SceneCanvas() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 400 }}
    >
      <CameraRig />

      {/* Low ambient so night sides read as shadowed, not as holes. */}
      <ambientLight intensity={0.22} />
      {/* The star lights the system from the centre it occupies. */}
      <pointLight position={[0, 0, 0]} intensity={520} distance={0} decay={2} />

      <Starfield reducedMotion={reducedMotion} />
      <CentralStar />

      {planets.map((planet) => (
        <OrbitGuide key={`orbit-${planet.domainId}`} radius={planet.orbitRadius} />
      ))}

      {planets.map((planet) => (
        <DomainPlanet
          key={planet.domainId}
          planet={planet}
          reducedMotion={reducedMotion}
        />
      ))}
    </Canvas>
  );
}
