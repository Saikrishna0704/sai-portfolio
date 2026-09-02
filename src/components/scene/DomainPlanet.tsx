"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  ShaderMaterial,
  SpriteMaterial,
  type Group,
  type Mesh,
  type Sprite,
} from "three";

import {
  createAtmosphereMaterial,
  createGlowTexture,
  type AtmosphereMaterial,
} from "@/scene/atmosphere";
import { createRingMaterial, type RingMaterial } from "@/scene/rings";
import { MOON_COLOR, type PlanetLayout } from "@/scene/layout";
import {
  moonFanRotation,
  PLANET_SPIN_SPEED,
  planetAngleAt,
} from "@/scene/motion";
import {
  createPlanetSurfaceMaterial,
  type PlanetSurfaceMaterial,
} from "@/scene/planetSurface";
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

/**
 * Shell width of the atmospheric rim, as a multiple of the body's radius.
 * Thin on purpose: a wide fresnel shell peaks at its own silhouette and reads
 * as a ring detached from the planet (see `atmosphere.ts`).
 */
const ATMOSPHERE_SCALE = 1.06;
/** Rim strength per emphasis level. The rim is the emphasis channel that does
 *  not rely on colour alone: the focused domain visibly breathes light. */
const ATMOSPHERE_ACTIVE = 1.5;
const ATMOSPHERE_RESTING = 0.65;
const ATMOSPHERE_DIMMED = 0.12;
/** The soft outer haze, as a multiple of the body's radius and per emphasis
 *  level. Far fainter than the rim: it carries mood, not edges. */
const HAZE_SCALE = 3.1;
const HAZE_ACTIVE = 0.5;
const HAZE_RESTING = 0.22;
const HAZE_DIMMED = 0.05;
/** Ring brightness per emphasis level. Rings carry the supporting
 *  technologies, so they lift with the domain that owns them. */
const RINGS_ACTIVE = 1;
const RINGS_RESTING = 0.62;
const RINGS_DIMMED = 0.12;
/** Brightness a moon takes when it is the selected project, or merely under
 *  the pointer. Above 1, so the body lifts out of the group rather than the
 *  rest having to recede for it. */
const MOON_SELECTED = 1.55;
const MOON_HOVERED = 1.22;
/** Moons are rock, not gas: the low end of the surface character axis. */
const MOON_CHARACTER = 0.12;
/** Damping rate for emphasis changes — quick, but never a switch flip. */
const EMPHASIS_LAMBDA = 6;

interface ProjectMoonProps {
  projectId: string;
  radius: number;
  /** Target brightness multiplier, damped rather than switched. */
  emphasis: number;
  reducedMotion: boolean;
}

/**
 * A project, as a moon.
 *
 * Its own component purely so each moon can hold a ref and damp its own
 * brightness in the frame loop. Doing that from the parent would need a ref
 * per moon and a lookup by id every frame, for no gain.
 *
 * Shares the planets' surface shader rather than the flat mapped material it
 * used to have, so a moon has the same soft terminator and real surface the
 * bodies it orbits do — at this size the old hard shadow line was the most
 * obviously synthetic thing left in the scene.
 */
function ProjectMoon({
  projectId,
  radius,
  emphasis,
  reducedMotion,
}: ProjectMoonProps) {
  const ref = useRef<Mesh>(null);

  const material = useMemo(() => {
    const seed = [...projectId].reduce(
      (total, character) => total * 31 + character.charCodeAt(0),
      11,
    );
    return createPlanetSurfaceMaterial(
      MOON_COLOR,
      MOON_CHARACTER,
      (seed % 977) / 97,
    );
  }, [projectId]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const current = ref.current?.material;
    if (!(current instanceof ShaderMaterial)) return;
    const dim = (current as PlanetSurfaceMaterial).uniforms.uDim;
    dim.value +=
      (emphasis - dim.value) *
      (reducedMotion ? 1 : 1 - Math.exp(-EMPHASIS_LAMBDA * delta));
  });

  return (
    <mesh ref={ref} material={material}>
      <sphereGeometry args={[radius, 32, 32]} />
    </mesh>
  );
}

interface DomainPlanetProps {
  planet: PlanetLayout;
  reducedMotion: boolean;
  activeDomainId: string | null;
  hover: Hover | null;
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
 * Ambient motion moves the group's *position* along its orbit, and turns the
 * moon fan by the same angle so it keeps pointing away from the star.
 *
 * Leaving the fan fixed was more faithful to real orbital mechanics, where a
 * moon's orbit does not co-rotate with its planet's revolution. It was worse
 * to look at: the fan slowly came to point wherever the planet had started, so
 * a project label eventually crossed the star and turned into dark text on a
 * bright surface. Legibility wins over accuracy here.
 */
export function DomainPlanet({
  planet,
  reducedMotion,
  activeDomainId,
  hover,
  selection,
  onSelect,
  onHover,
}: DomainPlanetProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const moonsRef = useRef<Group>(null);

  const isActive = activeDomainId === planet.domainId;
  const isDimmed = activeDomainId !== null && !isActive;
  /**
   * Selected, not merely hovered.
   *
   * Project labels are fixed-size DOM at a fixed offset, so whether they
   * collide depends entirely on how the moon fan happens to face the camera.
   * In a focused view that is settled by construction: the camera sits at
   * FOCUS_AZIMUTH_OFFSET, which puts the fan side-on and spreads the labels
   * apart. From the overview the camera is fixed while the planet travels, so
   * the same fan turns edge-on twice per orbit and every label in it stacks up
   * in the same few pixels. Hovering a planet therefore emphasises it without
   * printing its whole project list into the scene.
   */
  const isFocused =
    selection.kind !== "overview" && selection.domainId === planet.domainId;

  // Seeded from the domain id so each planet keeps the same face across
  // reloads, and two domains never share one.
  const surface = useMemo(() => {
    const seed = [...planet.domainId].reduce(
      (total, character) => total * 31 + character.charCodeAt(0),
      7,
    );
    return createPlanetSurfaceMaterial(
      planet.color,
      planet.character,
      // Kept small: the shader hashes on this, and a huge seed loses
      // precision in a mediump float and bands the noise.
      (seed % 977) / 97,
    );
  }, [planet.domainId, planet.color, planet.character]);

  useEffect(() => () => surface.dispose(), [surface]);

  const atmosphere = useMemo(
    () => createAtmosphereMaterial(planet.color, ATMOSPHERE_RESTING),
    [planet.color],
  );
  useEffect(() => () => atmosphere.dispose(), [atmosphere]);

  const hazeRef = useRef<Sprite>(null);
  const hazeTexture = useMemo(
    () => createGlowTexture(planet.color),
    [planet.color],
  );
  useEffect(() => () => hazeTexture?.dispose(), [hazeTexture]);

  const ringsRef = useRef<Mesh>(null);
  const ringMaterial = useMemo(() => {
    const rings = planet.rings;
    if (!rings) return null;
    return createRingMaterial(
      planet.color,
      rings.inner,
      rings.outer,
      rings.seed,
      RINGS_RESTING,
    );
  }, [planet.rings, planet.color]);
  useEffect(() => () => ringMaterial?.dispose(), [ringMaterial]);

  useFrame((state, delta) => {
    // Emphasis eases rather than switching, and it eases even when ambient
    // motion is off: reduced motion stills the orbits, it does not require
    // selection feedback to pop. Reached through the shell's ref so the frame
    // loop never writes into render-scoped values.
    const emphasisT = reducedMotion ? 1 : 1 - Math.exp(-EMPHASIS_LAMBDA * delta);

    const shellMaterial = atmosphereRef.current?.material;
    if (shellMaterial instanceof ShaderMaterial) {
      const targetStrength = isActive
        ? ATMOSPHERE_ACTIVE
        : isDimmed
          ? ATMOSPHERE_DIMMED
          : ATMOSPHERE_RESTING;
      const strength = (shellMaterial as AtmosphereMaterial).uniforms.uStrength;
      strength.value += (targetStrength - strength.value) * emphasisT;
    }

    const hazeMaterial = hazeRef.current?.material;
    if (hazeMaterial instanceof SpriteMaterial) {
      const targetHaze = isActive
        ? HAZE_ACTIVE
        : isDimmed
          ? HAZE_DIMMED
          : HAZE_RESTING;
      hazeMaterial.opacity += (targetHaze - hazeMaterial.opacity) * emphasisT;
    }

    const bodyMaterial = bodyRef.current?.material;
    if (bodyMaterial instanceof ShaderMaterial) {
      const dim = (bodyMaterial as PlanetSurfaceMaterial).uniforms.uDim;
      dim.value += ((isDimmed ? DIM_FACTOR : 1) - dim.value) * emphasisT;
    }

    const ringsMaterial = ringsRef.current?.material;
    if (ringsMaterial instanceof ShaderMaterial) {
      const targetRings = isActive
        ? RINGS_ACTIVE
        : isDimmed
          ? RINGS_DIMMED
          : RINGS_RESTING;
      const strength = (ringsMaterial as RingMaterial).uniforms.uStrength;
      strength.value += (targetRings - strength.value) * emphasisT;
    }

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

    // Negated: a three.js rotation about +Y sends a point at orbital angle a to
    // a - y, and the fan has to advance by the same amount the planet did.
    if (moonsRef.current) {
      moonsRef.current.rotation.y = -moonFanRotation(
        planet,
        elapsed,
        reducedMotion,
      );
    }

    // Legible now that surfaces carry longitudinal mottling. On the untextured
    // spheres this shipped with, the terminator never moved and the spin was
    // invisible.
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
      {/* Segments doubled: the shader's terminator and polar margin trace the
          silhouette, and a 32-segment sphere showed its facets along both. */}
      <mesh ref={bodyRef} material={surface}>
        <sphereGeometry args={[planet.radius, 64, 64]} />
      </mesh>

      {/* Atmospheric rim: the limb glow that makes the sphere read as a body
          with air around it, and the channel focus emphasis breathes through. */}
      <mesh ref={atmosphereRef} material={atmosphere} scale={ATMOSPHERE_SCALE}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
      </mesh>

      {/* Supporting technologies, as a ring system (PROJECT.md §3). Tilted off
          the orbital plane so it reads as an ellipse from the fixed viewing
          elevation. Drawn before the haze so the haze layers over its inner
          edge. */}
      {planet.rings && ringMaterial && (
        <mesh
          ref={ringsRef}
          material={ringMaterial}
          rotation={[Math.PI / 2 + planet.rings.tilt, 0, 0]}
        >
          <ringGeometry
            args={[planet.rings.inner, planet.rings.outer, 96]}
          />
        </mesh>
      )}

      {/* The haze beyond the limb — one soft additive quad, as with the star's
          halo. Opacity is the damped emphasis channel. */}
      {hazeTexture && (
        <sprite
          ref={hazeRef}
          scale={[
            planet.radius * HAZE_SCALE,
            planet.radius * HAZE_SCALE,
            1,
          ]}
        >
          <spriteMaterial
            map={hazeTexture}
            blending={AdditiveBlending}
            transparent
            opacity={HAZE_RESTING}
            depthWrite={false}
          />
        </sprite>
      )}

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
        active={isActive}
        onSelect={() => onSelect({ kind: "domain", domainId: planet.domainId })}
        onHover={(hovering) =>
          onHover(hovering ? { domainId: planet.domainId } : null)
        }
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

      {/* Rotates with the orbit so the fan keeps pointing outward, away from
          the star, however far round the planet has travelled. */}
      <group ref={moonsRef}>
        {planet.moons.map((moon) => {
          const isSelectedProject =
            selection.kind === "project" &&
            selection.projectId === moon.projectId;
          // One label at a time is always readable, whatever the phase.
          const isHoveredMoon = hover?.projectId === moon.projectId;

          return (
            <group key={moon.projectId} position={moon.position}>
              <ProjectMoon
                projectId={moon.projectId}
                radius={moon.radius}
                emphasis={
                  isSelectedProject
                    ? MOON_SELECTED
                    : isHoveredMoon
                      ? MOON_HOVERED
                      : isDimmed
                        ? DIM_FACTOR
                        : 1
                }
                reducedMotion={reducedMotion}
              />

              <mesh
                onPointerOver={(event) => {
                  event.stopPropagation();
                  onHover({
                    domainId: planet.domainId,
                    projectId: moon.projectId,
                  });
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
              {(isFocused || isHoveredMoon || isSelectedProject) && (
                <BodyLabel
                  text={moon.title}
                  position={moon.labelOffset}
                  variant="project"
                  dimmed={false}
                  active={isSelectedProject}
                  onSelect={() =>
                    onSelect({
                      kind: "project",
                      domainId: planet.domainId,
                      projectId: moon.projectId,
                    })
                  }
                  onHover={(hovering) =>
                    onHover(
                      hovering
                        ? {
                            domainId: planet.domainId,
                            projectId: moon.projectId,
                          }
                        : null,
                    )
                  }
                />
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}
