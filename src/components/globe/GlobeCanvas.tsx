"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, Group, SRGBColorSpace } from "three";

import {
  createGlobeTexture,
  SPHERE_PHI_START,
  toVector,
  yawFor,
} from "@/scene/globeTexture";

/** Marker colour: sodium amber, the colour a city is from orbit. */
const MARKER = "#e8a34b";
/** Just clear of the surface, so the marker never z-fights the coastline it
 *  sits on and the sphere still hides it when it is round the far side. */
const SURFACE_LIFT = 1.008;
const MARKER_RADIUS = 0.019;
/** Damping rate for the turn. Slow enough to read as a planet rotating. */
const LAMBDA = 1.9;
/**
 * How far round the globe starts before turning to the target, in radians.
 *
 * The point of a globe is watching it come round to somewhere. Opening one
 * already facing its destination throws that away, so it begins with the place
 * over the horizon and turns until it faces you.
 */
const APPROACH_OFFSET = 2.1;
const GLOW_TEXTURE_SIZE = 256;

/** Wraps to [-PI, PI] so the globe always turns the short way. */
function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** A soft radial falloff for the atmosphere, drawn once, as the star's is. */
function useAtmosphereTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = GLOW_TEXTURE_SIZE;
    canvas.height = GLOW_TEXTURE_SIZE;

    const context = canvas.getContext("2d");
    if (!context) return null;

    const centre = GLOW_TEXTURE_SIZE / 2;
    const gradient = context.createRadialGradient(
      centre,
      centre,
      centre * 0.46,
      centre,
      centre,
      centre,
    );
    gradient.addColorStop(0, "rgba(120, 170, 255, 0.34)");
    gradient.addColorStop(0.55, "rgba(120, 170, 255, 0.09)");
    gradient.addColorStop(1, "rgba(120, 170, 255, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE);

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    return canvasTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

interface GlobeProps {
  lat: number;
  lon: number;
  reducedMotion: boolean;
}

function Globe({ lat, lon, reducedMotion }: GlobeProps) {
  const surface = useMemo(() => createGlobeTexture(), []);
  useEffect(() => () => surface?.dispose(), [surface]);

  const atmosphere = useAtmosphereTexture();

  // One axis. The globe spins about its pole and never tips, so north stays
  // at the top of the screen exactly as it does on a desk globe.
  const yawRef = useRef<Group>(null);
  const started = useRef(false);

  const marker = useMemo(
    () =>
      toVector(lat, lon).map((value) => value * SURFACE_LIFT) as [
        number,
        number,
        number,
      ],
    [lat, lon],
  );

  const targetYaw = useMemo(() => yawFor(lon), [lon]);

  useFrame((_, delta) => {
    const yawGroup = yawRef.current;
    if (!yawGroup) return;

    if (!started.current) {
      started.current = true;
      // Reduced motion arrives already facing the place; otherwise it starts
      // with the place over the horizon and turns to meet the viewer.
      yawGroup.rotation.y = reducedMotion
        ? targetYaw
        : targetYaw - APPROACH_OFFSET;
      return;
    }

    if (reducedMotion) return;

    const t = 1 - Math.exp(-LAMBDA * delta);
    yawGroup.rotation.y += wrapAngle(targetYaw - yawGroup.rotation.y) * t;
  });

  return (
    <>
      {atmosphere && (
        <sprite scale={[2.9, 2.9, 1]} position={[0, 0, -0.2]}>
          <spriteMaterial
            map={atmosphere}
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </sprite>
      )}

      <group ref={yawRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 48, SPHERE_PHI_START]} />
          {/* Unlit on purpose. A terminator would be more truthful and would
                also drop the marker into the dark half for most of the turn,
                and this globe exists to say where something is. */}
          <meshBasicMaterial map={surface ?? undefined} />
        </mesh>

        <mesh position={marker}>
          <sphereGeometry args={[MARKER_RADIUS, 16, 16]} />
          <meshBasicMaterial color={MARKER} />
        </mesh>
      </group>
    </>
  );
}

interface GlobeCanvasProps {
  lat: number;
  lon: number;
  reducedMotion: boolean;
}

/**
 * Earth, as the one literal body in the portfolio.
 *
 * Every other object in this project stands in for something abstract: the
 * star is a person, a planet is a field of work. Here the sphere is the actual
 * planet and the marker is a real coordinate, which is why it never appears
 * among the domain planets. It belongs to the entry that happened there.
 */
export default function GlobeCanvas({
  lat,
  lon,
  reducedMotion,
}: GlobeCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 32, near: 0.1, far: 10, position: [0, 0, 3.6] }}
    >
      <Globe lat={lat} lon={lon} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
