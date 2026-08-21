"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import { minorBodyById } from "@/data/relationships";
import { asteroids } from "@/scene/layout";
import { beltRotationAt } from "@/scene/motion";
import type { Selection } from "@/state/selection";

import { BodyLabel } from "./BodyLabel";

/** Generous invisible target: an asteroid is a few pixels across at overview. */
const TARGET_RADIUS = 0.75;

const ASTEROID_COLOR = "#8c8f97";

interface AsteroidBeltProps {
  selection: Selection;
  reducedMotion: boolean;
  hoveredId: string | null;
  onSelect: (next: Selection) => void;
  onHover: (id: string | null) => void;
}

/**
 * Side projects and archived work, scattered in a belt beyond the domains
 * (PROJECT.md §3).
 *
 * The whole belt rotates as one rather than each rock orbiting independently,
 * which keeps their positions fixed relative to each other. That matters for
 * the same reason it did for moons: labels are placed from static geometry.
 *
 * Labels appear only for the body under the pointer or in focus. Three
 * permanent labels out at the edge would be three more things competing with
 * the domains, and these are deliberately the least important bodies here.
 */
export function AsteroidBelt({
  selection,
  reducedMotion,
  hoveredId,
  onSelect,
  onHover,
}: AsteroidBeltProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slower than any planet: the belt is the backdrop of the system. Shared
    // with the camera so the two agree on where a rock is.
    groupRef.current.rotation.y = beltRotationAt(
      state.clock.elapsedTime,
      reducedMotion,
    );
  });

  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid) => {
        const body = minorBodyById(asteroid.id);
        if (!body) return null;

        const isSelected =
          selection.kind === "asteroid" && selection.asteroidId === asteroid.id;
        const isShowingLabel = isSelected || hoveredId === asteroid.id;

        return (
          <group key={asteroid.id} position={asteroid.position}>
            {/* Low-poly on purpose: a rock, not a planet. */}
            <mesh>
              <icosahedronGeometry args={[asteroid.radius, 0]} />
              <meshStandardMaterial
                color={ASTEROID_COLOR}
                roughness={0.95}
                metalness={0}
                emissive={ASTEROID_COLOR}
                emissiveIntensity={isSelected ? 0.55 : 0}
              />
            </mesh>

            <mesh
              onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                onHover(asteroid.id);
              }}
              onPointerOut={() => onHover(null)}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                onSelect({ kind: "asteroid", asteroidId: asteroid.id });
              }}
            >
              <sphereGeometry args={[TARGET_RADIUS, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {isShowingLabel && (
              <BodyLabel
                text={body.title}
                position={[0, asteroid.radius + 0.5, 0]}
                variant="project"
                dimmed={false}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
