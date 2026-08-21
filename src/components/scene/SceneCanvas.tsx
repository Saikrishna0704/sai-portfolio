"use client";

import { Canvas } from "@react-three/fiber";

import { planets } from "@/scene/layout";

import { CameraRig } from "./CameraRig";
import { CentralStar } from "./CentralStar";
import { DomainPlanet } from "./DomainPlanet";
import { OrbitGuide } from "./OrbitGuide";
import { Starfield } from "./Starfield";

/**
 * Phase 1: the static universe.
 *
 * The star, domain planets, project moons and orbit guides are all in place,
 * composed from `@/scene/layout` rather than positioned by hand. Nothing moves
 * yet — orbital and ambient motion belong to Phase 3, selection to Phase 4.
 *
 * The canvas is transparent so the page's CSS ground is the single source of
 * the background colour.
 *
 * The frame loop runs continuously rather than on demand. Phase 0 chose
 * `frameloop="demand"` to avoid redrawing a still scene, but that was a
 * speculative saving: it makes every HTML label position depend on something
 * invalidating after each resize, and Phase 3's ambient motion needs the loop
 * running regardless. Back to the R3F default until there is a measured reason
 * not to be.
 */
export default function SceneCanvas() {
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

      <Starfield />
      <CentralStar />

      {planets.map((planet) => (
        <OrbitGuide key={`orbit-${planet.domainId}`} radius={planet.orbitRadius} />
      ))}

      {planets.map((planet) => (
        <DomainPlanet key={planet.domainId} planet={planet} />
      ))}
    </Canvas>
  );
}
