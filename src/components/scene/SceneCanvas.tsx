"use client";

import { Canvas } from "@react-three/fiber";

/**
 * Phase 0: an empty scene.
 *
 * Only the frame, camera and lighting rig are established here — no celestial
 * bodies, no starfield, no motion. Those arrive in later phases.
 *
 * The canvas is transparent so the page's CSS ground is the single source of
 * the background colour, and `frameloop="demand"` keeps a still scene from
 * burning frames on low-powered devices.
 */
export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.5, 14], fov: 45, near: 0.1, far: 400 }}
    >
      <ambientLight intensity={0.15} />
      {/* Origin is reserved for the central star (Phase 1); its light lives here. */}
      <pointLight position={[0, 0, 0]} intensity={40} distance={0} decay={2} />
    </Canvas>
  );
}
