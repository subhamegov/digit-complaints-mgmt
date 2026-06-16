/**
 * Synthetic Bangalore boundary hierarchy for the Civic Operations Hub map.
 *
 * The complaint dataset (TEST_USER_COMPLAINTS / COMPLAINTS) is themed —
 * its `ward` field carries Locality/Zone-level names (e.g. "Heritage City")
 * and its `locality` field carries the actual Ward-level neighbourhood
 * (e.g. "Mall Road"). We re-use those strings so the map reconciles with
 * every other widget; only the polygon geometry is synthesised to tile
 * Bangalore's BBMP extent.
 *
 * Hierarchy used by the map:
 *   City        — Bangalore (the full BBMP bounding box)
 *   Locality    — dataset.ward (4 zones tiling the city in a 2x2 grid)
 *   Ward        — dataset.locality (3 wards inside each locality)
 *   Pin         — individual complaint, deterministic lat/lng inside its ward
 */

export type LatLng = [number, number]; // [lat, lng]
export type Polygon = LatLng[];

export interface BoundaryPolygon {
  code: string;
  name: string;
  /** Parent locality code, only for ward-level polygons. */
  parentCode?: string;
  polygon: Polygon;
  /** Centroid for marker placement and zoom targets. */
  center: LatLng;
}

// Bangalore bounding box (approx BBMP extent).
export const BANGALORE_CENTER: LatLng = [12.9716, 77.5946];
export const BANGALORE_BOUNDS: [LatLng, LatLng] = [
  [12.86, 77.48],
  [13.12, 77.78],
];

/** 4 localities (= DIGIT "Zones") in a 2x2 grid that tiles Bangalore. */
const LOCALITY_BOXES: { code: string; name: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
  { code: "LOC_HERITAGE",  name: "Heritage City",      minLat: 12.99, maxLat: 13.12, minLng: 77.48, maxLng: 77.63 },
  { code: "LOC_FINANCIAL", name: "Financial District", minLat: 12.99, maxLat: 13.12, minLng: 77.63, maxLng: 77.78 },
  { code: "LOC_TOWN",      name: "Town Square",        minLat: 12.86, maxLat: 12.99, minLng: 77.48, maxLng: 77.63 },
  { code: "LOC_EAST",      name: "East Village",       minLat: 12.86, maxLat: 12.99, minLng: 77.63, maxLng: 77.78 },
];

/** Per-locality ward subdivisions — 3 wards each, names from the seed dataset. */
const WARDS_PER_LOCALITY: Record<string, string[]> = {
  "Heritage City":      ["Mall Road", "Civil Lines", "Hall Bazaar"],
  "Financial District": ["Crown Plaza", "Trade Centre", "Lawrence Avenue"],
  "Town Square":        ["Clock Tower", "Old Market", "Park Lane"],
  "East Village":       ["Riverside", "Green Park", "New Colony"],
};

/**
 * Build an organic-looking polygon inside a bounding box.
 * Samples an ellipse fitted to the box at N angular steps, then perturbs
 * each radius with seeded multi-octave noise so the outline reads as a
 * real administrative boundary rather than graph paper.
 */
function organicPolygon(
  seed: string,
  minLat: number, maxLat: number, minLng: number, maxLng: number,
  steps = 28,
  noiseAmp = 0.22,
): Polygon {
  const rand = mulberry32(hashString(seed));
  const cLat = (minLat + maxLat) / 2;
  const cLng = (minLng + maxLng) / 2;
  // Half-extents — ellipse inscribed in the box, slightly enlarged so
  // adjacent polygons touch / overlap and the seams disappear.
  const rLat = (maxLat - minLat) / 2 * 1.05;
  const rLng = (maxLng - minLng) / 2 * 1.05;

  // Pre-roll a small noise table; smoothed across neighbours so the
  // boundary varies gently instead of zig-zagging.
  const raw = Array.from({ length: steps }, () => rand());
  const smooth = raw.map((_, i) => {
    const a = raw[(i - 1 + steps) % steps];
    const b = raw[i];
    const c = raw[(i + 1) % steps];
    return (a + b * 2 + c) / 4;
  });

  const points: Polygon = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const n = 1 + (smooth[i] - 0.5) * noiseAmp * 2;
    const lat = cLat + Math.sin(theta) * rLat * n;
    const lng = cLng + Math.cos(theta) * rLng * n;
    points.push([lat, lng]);
  }
  return points;
}

function centerOf(minLat: number, maxLat: number, minLng: number, maxLng: number): LatLng {
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

export const LOCALITY_POLYGONS: BoundaryPolygon[] = LOCALITY_BOXES.map((b) => ({
  code: b.code,
  name: b.name,
  polygon: organicPolygon(b.code, b.minLat, b.maxLat, b.minLng, b.maxLng, 32, 0.18),
  center: centerOf(b.minLat, b.maxLat, b.minLng, b.maxLng),
}));

export const WARD_POLYGONS: BoundaryPolygon[] = LOCALITY_BOXES.flatMap((loc) => {
  const wards = WARDS_PER_LOCALITY[loc.name] ?? [];
  const stripW = (loc.maxLng - loc.minLng) / wards.length;
  return wards.map((wardName, i) => {
    const minLng = loc.minLng + stripW * i;
    const maxLng = loc.minLng + stripW * (i + 1);
    return {
      code: `${loc.code}__${wardName.replace(/\s+/g, "_").toUpperCase()}`,
      name: wardName,
      parentCode: loc.code,
      polygon: organicPolygon(loc.code + wardName, loc.minLat, loc.maxLat, minLng, maxLng, 24, 0.16),
      center: centerOf(loc.minLat, loc.maxLat, minLng, maxLng),
    };
  });
});

/** Lookup helpers used to bucket dataset complaints into map polygons. */
export const LOCALITY_BY_WARD_FIELD: Record<string, BoundaryPolygon> = Object.fromEntries(
  LOCALITY_POLYGONS.map((p) => [p.name, p]),
);
export const WARD_BY_LOCALITY_FIELD: Record<string, BoundaryPolygon> = Object.fromEntries(
  WARD_POLYGONS.map((p) => [p.name, p]),
);

/**
 * Deterministic lat/lng inside a ward polygon for a given complaint id.
 * Same id → same pin, on every render.
 */
export function pinForComplaint(complaintId: string, ward: BoundaryPolygon): LatLng {
  const rand = mulberry32(hashString(complaintId));
  // ward polygons are roughly rectangular; use their bounding box.
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of ward.polygon) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  // pad inwards so pins don't sit on the boundary.
  const padLat = (maxLat - minLat) * 0.12;
  const padLng = (maxLng - minLng) * 0.12;
  const lat = (minLat + padLat) + rand() * (maxLat - minLat - 2 * padLat);
  const lng = (minLng + padLng) + rand() * (maxLng - minLng - 2 * padLng);
  return [lat, lng];
}

/* ---------------- deterministic PRNG helpers ---------------- */

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
