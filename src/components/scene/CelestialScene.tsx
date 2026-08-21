"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

// WebGL has no server-side equivalent; keep it out of the SSR pass entirely.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

/**
 * Boundary around the WebGL layer.
 *
 * PROJECT.md §9: critical information must never depend on the 3D scene. If
 * WebGL is unavailable or the canvas throws, the scene silently disappears and
 * the DOM shell carries on unaffected.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function CelestialScene() {
  return (
    <SceneBoundary>
      <SceneCanvas />
    </SceneBoundary>
  );
}
