"use client";

import { MOON_COLOR, type PlanetLayout } from "@/scene/layout";

import { BodyLabel } from "./BodyLabel";
import { OrbitGuide } from "./OrbitGuide";

interface DomainPlanetProps {
  planet: PlanetLayout;
}

/**
 * A work domain and the projects that belong to it (PROJECT.md §3 —
 * planets are domains, moons are the projects orbiting them).
 *
 * Every planet renders from the same component, so a new domain in the data
 * needs no new scene code.
 */
export function DomainPlanet({ planet }: DomainPlanetProps) {
  return (
    <group position={planet.position}>
      <mesh>
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
