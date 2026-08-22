import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";

import landTopology from "world-atlas/land-110m.json";

/**
 * Earth's surface, drawn rather than photographed.
 *
 * Real coastlines from the Natural Earth 110m land outline, rendered as
 * vectors onto a canvas at load. The rest of this project generates every
 * surface at runtime — the star's halo, each planet's mottling — and shipping
 * a satellite photo for one body would have been the only bitmap in the
 * repository. Vectors also suit the direction PROJECT.md §8 asks for: this
 * reads as a chart of the world rather than a picture of it.
 */
const WIDTH = 2048;
const HEIGHT = 1024;

/**
 * Where the sphere's texture seam starts, in radians.
 *
 * Puts u=0 at longitude 180, so the seam falls in the Pacific and the texture
 * can be drawn as an ordinary west-to-east map. It also puts +Z, the point
 * facing the camera at rest, on the prime meridian.
 */
export const SPHERE_PHI_START = -Math.PI / 2;

const OCEAN_TOP = "#0a1020";
const OCEAN_BOTTOM = "#060a13";
const LAND_FILL = "#1b2536";
const COAST = "rgba(185, 212, 255, 0.55)";
const GRATICULE = "rgba(185, 212, 255, 0.09)";
const EQUATOR = "rgba(185, 212, 255, 0.16)";

/** Degrees between graticule lines. */
const GRID_STEP = 15;

/**
 * Plain equirectangular projection: longitude runs west to east, left to right.
 *
 * This is only correct in company with `SPHERE_PHI_START` below. Left to its
 * default, three.js SphereGeometry starts its texture seam at a longitude that
 * makes this mapping come out mirrored, and a mirrored Earth is not obviously
 * wrong at a glance — the markers still land on the right continents, because
 * they are mirrored with it. Sri Lanka sitting west of India is what gives it
 * away. Shifting the seam is what makes plain left-to-right longitude true.
 */
function projectX(lon: number): number {
  return ((lon + 180) / 360) * WIDTH;
}

function projectY(lat: number): number {
  return ((90 - lat) / 180) * HEIGHT;
}

/**
 * Traces one ring, breaking the path wherever it crosses the antimeridian.
 *
 * A ring that wraps past 180 degrees would otherwise be drawn as a line
 * straight back across the whole map, painting a bar through the Pacific.
 */
function traceRing(context: CanvasRenderingContext2D, ring: Position[]): void {
  let previousLon: number | null = null;

  ring.forEach((point, index) => {
    const lon = point[0] ?? 0;
    const lat = point[1] ?? 0;
    const wrapped = previousLon !== null && Math.abs(lon - previousLon) > 180;

    if (index === 0 || wrapped) context.moveTo(projectX(lon), projectY(lat));
    else context.lineTo(projectX(lon), projectY(lat));

    previousLon = lon;
  });
}

function drawLand(context: CanvasRenderingContext2D): void {
  // The topology's own type is wider than the file's contents; casting through
  // unknown is the narrowest way to hand it to topojson-client.
  const topology = landTopology as unknown as Topology;
  const land = topology.objects.land;
  if (!land) return;

  // `feature` returns a FeatureCollection for a GeometryCollection and a bare
  // Feature otherwise. land-110m wraps its single MultiPolygon in a collection,
  // so both shapes have to be unwrapped rather than assumed.
  const result = feature(topology, land) as
    | Feature<Polygon | MultiPolygon>
    | FeatureCollection<Polygon | MultiPolygon>;

  const features =
    result.type === "FeatureCollection" ? result.features : [result];

  const polygons: Position[][][] = [];
  for (const item of features) {
    const geometry = item.geometry;
    if (!geometry) continue;
    if (geometry.type === "MultiPolygon") polygons.push(...geometry.coordinates);
    else polygons.push(geometry.coordinates);
  }

  context.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) traceRing(context, ring);
  }

  context.fillStyle = LAND_FILL;
  context.fill("evenodd");

  context.strokeStyle = COAST;
  context.lineWidth = 1.4;
  context.lineJoin = "round";
  context.stroke();
}

function drawGraticule(context: CanvasRenderingContext2D): void {
  context.lineWidth = 1;

  for (let lat = -90 + GRID_STEP; lat < 90; lat += GRID_STEP) {
    const y = projectY(lat);
    context.strokeStyle = lat === 0 ? EQUATOR : GRATICULE;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WIDTH, y);
    context.stroke();
  }

  context.strokeStyle = GRATICULE;
  for (let lon = -180; lon < 180; lon += GRID_STEP) {
    const x = projectX(lon);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, HEIGHT);
    context.stroke();
  }
}

export function createGlobeTexture(): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const ocean = context.createLinearGradient(0, 0, 0, HEIGHT);
  ocean.addColorStop(0, OCEAN_BOTTOM);
  ocean.addColorStop(0.5, OCEAN_TOP);
  ocean.addColorStop(1, OCEAN_BOTTOM);
  context.fillStyle = ocean;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  drawGraticule(context);
  drawLand(context);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // The globe is only ever seen at one size, so mipmaps buy nothing and the
  // coastlines stay crisper without them.
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  return texture;
}

/**
 * A point on the unit sphere.
 *
 * Longitude 0 lies on +Z, facing the camera, and longitude increases towards
 * +X, which is screen right. That handedness is the whole point: get it the
 * other way round and the planet is a mirror image of itself.
 */
export function toVector(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  return [
    Math.cos(phi) * Math.sin(theta),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(theta),
  ];
}

/**
 * Rotation that brings a longitude round to face the camera on +Z.
 *
 * Longitude only. Tilting by latitude as well would centre the target in the
 * disc, but it rolls the planet over: at Buffalo's 42.9 degrees the north pole
 * ends up pitched almost halfway towards the viewer, and the whole globe reads
 * as knocked askew. A planet's axis points where it points. Spinning about it
 * and letting a place sit at its own latitude is both correct and what a globe
 * is expected to do.
 */
export function yawFor(lon: number): number {
  return (-lon * Math.PI) / 180;
}
