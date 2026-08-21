"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

import { MOON_COLOR, type PlanetLayout } from "@/scene/layout";
import { PLANET_SPIN_SPEED, orbitAngularSpeed } from "@/scene/motion";

import { BodyLabel } from "./BodyLabel";
import { OrbitGuide } from "./OrbitGuide";

interface DomainPlanetProps {
  planet: PlanetLayout;
  reducedMotion: boolean;
}

/**
 * A work domain and the projects that belong to it (PROJECT.md §3 —
 * planets are domains, moons are the projects orbiting them).
 *
 * Every planet renders from the same component, so a new domain in the data
 * needs no new scene code.
 *
 * Ambient motion moves the group's *position* along its orbit and leaves the
 * moon offsets untouched. That is how a real system behaves — a moon's orbit
 * does not co-rotate with its planet's revolution — and it is also what keeps
 * the labels honest: the Phase 2 rules pick each label's side from where the
 * moons sit, so a moon that swung around its planet would leave every one of
 * those choices stale and start colliding.
 */
export function DomainPlanet({ planet, reducedMotion }: DomainPlanetProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);

  const angularSpeed = useMemo(
    () => orbitAngularSpeed(planet.orbitRadius),
    [planet.orbitRadius],
  );

  useFrame((state) => {
    if (reducedMotion) return;

    // Absolute elapsed time, never an accumulated delta: no drift, and a
    // dropped frame cannot leave the planet permanently behind.
    const elapsed = state.clock.elapsedTime;
    const angle = planet.orbitAngle + elapsed * angularSpeed;

    // set() rather than a new Vector3 — this runs every frame.
    groupRef.current?.position.set(
      Math.cos(angle) * planet.orbitRadius,
      0,
      Math.sin(angle) * planet.orbitRadius,
    );

    // Currently imperceptible: an untextured sphere lit from a fixed point
    // looks identical at every rotation, because the terminator does not move.
    // The spin becomes visible once planet surfaces gain variation — deferred
    // to the Phase 11 materials pass rather than widening a motion phase.
    if (bodyRef.current) {
      bodyRef.current.rotation.y = elapsed * PLANET_SPIN_SPEED;
    }
  });

  return (
    <group ref={groupRef} position={planet.position}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      <BodyLabel
        text={planet.name}
        position={planet.labelOffset}
        variant="domain"
      />

      {/* Only guide a moon orbit when something actually travels it. */}
      {planet.moons.length > 0 && (
        <OrbitGuide radius={planet.moonOrbitRadius} opacity={0.1} segments={72} />
      )}

      {planet.moons.map((moon) => (
        <group key={moon.projectId} position={moon.position}>
          <mesh>
            <sphereGeometry args={[moon.radius, 20, 20]} />
            <meshStandardMaterial
              color={MOON_COLOR}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
          <BodyLabel
            text={moon.title}
            position={moon.labelOffset}
            variant="project"
          />
        </group>
      ))}
    </group>
  );
}
