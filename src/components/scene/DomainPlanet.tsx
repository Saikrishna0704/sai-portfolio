"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Group, type Mesh } from "three";

import { MOON_COLOR, type PlanetLayout } from "@/scene/layout";
import { PLANET_SPIN_SPEED, planetAngleAt } from "@/scene/motion";
import type { Hover, Selection } from "@/state/selection";

import { BodyLabel } from "./BodyLabel";
import { OrbitGuide } from "./OrbitGuide";

/**
 * Invisible spheres wider than the bodies they wrap, so a body can be pointed
 * at without pixel-hunting. A moon is only a few pixels across once the system
 * is framed, which is far below a usable target.
 *
 * Sized to stay inside the moon ring: a planet's target plus a moon's target
 * is less than the ring radius, so they never fight over the same pointer.
 */
const PLANET_TARGET_RADIUS = 1;
const MOON_TARGET_RADIUS = 0.8;

/** How far a receding body's colour is pulled down when another is in focus. */
const DIM_FACTOR = 0.3;

interface DomainPlanetProps {
  planet: PlanetLayout;
  reducedMotion: boolean;
  activeDomainId: string | null;
  selection: Selection;
  onSelect: (next: Selection) => void;
  onHover: (next: Hover | null) => void;
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
export function DomainPlanet({
  planet,
  reducedMotion,
  activeDomainId,
  selection,
  onSelect,
  onHover,
}: DomainPlanetProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);

  const isActive = activeDomainId === planet.domainId;
  const isDimmed = activeDomainId !== null && !isActive;

  // Recede by darkening rather than by going transparent: a see-through planet
  // shows the starfield through itself and reads as broken, not as background.
  const planetColor = useMemo(
    () =>
      isDimmed
        ? new Color(planet.color).multiplyScalar(DIM_FACTOR)
        : new Color(planet.color),
    [planet.color, isDimmed],
  );
  const moonColor = useMemo(
    () =>
      isDimmed
        ? new Color(MOON_COLOR).multiplyScalar(DIM_FACTOR)
        : new Color(MOON_COLOR),
    [isDimmed],
  );

  useFrame((state) => {
    if (reducedMotion) return;

    // Absolute elapsed time, never an accumulated delta: no drift, and a
    // dropped frame cannot leave the planet permanently behind.
    const elapsed = state.clock.elapsedTime;
    const angle = planetAngleAt(planet, elapsed, reducedMotion);

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

  const handlePlanetOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover({ domainId: planet.domainId });
  };

  const handlePlanetSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect({ kind: "domain", domainId: planet.domainId });
  };

  return (
    <group ref={groupRef} position={planet.position}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          color={planetColor}
          roughness={0.85}
          metalness={0}
          emissive={planetColor}
          emissiveIntensity={isActive ? 0.32 : 0}
        />
      </mesh>

      {/* Pointer target. Opacity 0 rather than visible={false}, so it is
          reliably raycast while drawing nothing. */}
      <mesh
        onPointerOver={handlePlanetOver}
        onPointerOut={() => onHover(null)}
        onClick={handlePlanetSelect}
      >
        <sphereGeometry args={[PLANET_TARGET_RADIUS, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <BodyLabel
        text={planet.name}
        position={planet.labelOffset}
        variant="domain"
        dimmed={isDimmed}
      />

      {/* Only guide a moon orbit when something actually travels it. */}
      {planet.moons.length > 0 && (
        <OrbitGuide
          radius={planet.moonOrbitRadius}
          opacity={isActive ? 0.28 : isDimmed ? 0.04 : 0.1}
          segments={72}
        />
      )}

      {planet.moons.map((moon) => {
        const isSelectedProject =
          selection.kind === "project" && selection.projectId === moon.projectId;

        return (
          <group key={moon.projectId} position={moon.position}>
            <mesh>
              <sphereGeometry args={[moon.radius, 20, 20]} />
              <meshStandardMaterial
                color={moonColor}
                roughness={0.9}
                metalness={0}
                emissive={moonColor}
                emissiveIntensity={isSelectedProject ? 0.5 : 0}
              />
            </mesh>

            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                onHover({ domainId: planet.domainId, projectId: moon.projectId });
              }}
              onPointerOut={() => onHover(null)}
              onClick={(event) => {
                event.stopPropagation();
                onSelect({
                  kind: "project",
                  domainId: planet.domainId,
                  projectId: moon.projectId,
                });
              }}
            >
              <sphereGeometry args={[MOON_TARGET_RADIUS, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Progressive disclosure: project labels appear only for the
                domain in focus. Showing every project at once is what made the
                Phase 2 stress test unreadable, and PROJECT.md §4 asks the
                overview for minimal labels. */}
            {isActive && (
              <BodyLabel
                text={moon.title}
                position={moon.labelOffset}
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
