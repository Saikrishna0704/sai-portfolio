"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

interface OrbitGuideProps {
  radius: number;
  /** Thin and faint by default; moon orbits are fainter still. */
  opacity?: number;
  segments?: number;
}

/**
 * A single thin circle in the XZ plane marking an orbit (PROJECT.md §8 —
 * "thin orbit/relationship lines", restrained rather than decorative).
 */
export function OrbitGuide({
  radius,
  opacity = 0.16,
  segments = 128,
}: OrbitGuideProps) {
  const points = useMemo(() => {
    const result: [number, number, number][] = [];
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      result.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return result;
  }, [radius, segments]);

  return (
    <Line
      points={points}
      color="#8fa3c0"
      lineWidth={1}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}
