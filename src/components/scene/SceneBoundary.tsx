"use client";

import { Component, type ReactNode } from "react";

/**
 * Boundary around a WebGL layer.
 *
 * PROJECT.md §9: critical information must never depend on the 3D scene. If
 * WebGL is unavailable or a canvas throws, that layer silently disappears and
 * the DOM around it carries on unaffected.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
