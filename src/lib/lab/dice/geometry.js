// Die shapes for the dice widget. Every die is reduced to a list of flat polygon faces, each with a
// normal, an "up" direction for its label, and the number it shows. The scene turns those into meshes.
import * as THREE from 'three';

/**
 * @typedef {object} DieFace
 * @property {THREE.Vector3[]} points polygon corners, counter-clockwise seen from outside
 * @property {THREE.Vector3} normal
 * @property {THREE.Vector3} up label up direction (in the face plane)
 * @property {THREE.Vector3} center
 * @property {number | null} value number printed on the face (null for blank coin rims)
 */

/**
 * @typedef {object} DieShape
 * @property {'solid' | 'coin'} kind coin dice print the result on their front cap
 * @property {string} name short technical name for the readout
 * @property {DieFace[]} faces
 */

/** Standard polyhedra keyed by side count. Everything else falls back to a trapezohedron or a coin. */
export const STANDARD_SIDES = [4, 6, 8, 10, 12, 20];

/**
 * Collapses a triangle soup into flat polygons by grouping coplanar triangles.
 * @param {THREE.BufferGeometry} geometry
 * @returns {{ points: THREE.Vector3[], normal: THREE.Vector3 }[]}
 */
function polygonsFrom(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = source.getAttribute('position');
  /** @type {{ normal: THREE.Vector3, offset: number, points: THREE.Vector3[] }[]} */
  const groups = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 3) {
    a.fromBufferAttribute(position, i);
    b.fromBufferAttribute(position, i + 1);
    c.fromBufferAttribute(position, i + 2);
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    if (!Number.isFinite(normal.x) || normal.lengthSq() < 0.5) continue;
    if (normal.dot(a) < 0) normal.negate();
    const offset = normal.dot(a);
    let group = groups.find((g) => g.normal.dot(normal) > 0.9995 && Math.abs(g.offset - offset) < 1e-3);
    if (!group) {
      group = { normal, offset, points: [] };
      groups.push(group);
    }
    for (const point of [a, b, c]) {
      if (!group.points.some((p) => p.distanceToSquared(point) < 1e-8)) group.points.push(point.clone());
    }
  }
  if (source !== geometry) source.dispose();
  return groups.map(({ normal, points }) => ({ normal, points: sortAround(points, normal) }));
}

/**
 * Orders polygon corners counter-clockwise around the normal.
 * @param {THREE.Vector3[]} points
 * @param {THREE.Vector3} normal
 */
function sortAround(points, normal) {
  const center = centroid(points);
  const axisX = new THREE.Vector3().subVectors(points[0], center).normalize();
  const axisY = new THREE.Vector3().crossVectors(normal, axisX);
  return [...points].sort((p, q) => {
    const dp = new THREE.Vector3().subVectors(p, center);
    const dq = new THREE.Vector3().subVectors(q, center);
    return Math.atan2(dp.dot(axisY), dp.dot(axisX)) - Math.atan2(dq.dot(axisY), dq.dot(axisX));
  });
}

/** @param {THREE.Vector3[]} points */
function centroid(points) {
  const sum = new THREE.Vector3();
  for (const point of points) sum.add(point);
  return sum.divideScalar(points.length);
}

/**
 * Picks the direction a label should read "up" on a face: toward the sharpest corner for triangles and
 * kites, toward an edge for squares and other regular faces.
 * @param {THREE.Vector3[]} points
 * @param {THREE.Vector3} center
 * @param {THREE.Vector3} [hint] point the label should point at (the apex of a kite)
 */
function labelUp(points, center, hint) {
  if (hint) return hint.clone().sub(center).normalize();
  const distances = points.map((p) => p.distanceTo(center));
  const max = Math.max(...distances);
  const min = Math.min(...distances);
  if (points.length === 3 || max - min > 1e-3) {
    return new THREE.Vector3().subVectors(points[distances.indexOf(max)], center).normalize();
  }
  if (points.length % 2 === 0) {
    const mid = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5);
    return mid.sub(center).normalize();
  }
  return new THREE.Vector3().subVectors(points[0], center).normalize();
}

/**
 * Scales a set of polygons so dice of different shapes look about the same size.
 * @param {{ points: THREE.Vector3[], normal: THREE.Vector3 }[]} polygons
 */
function normalise(polygons) {
  let outer = 0;
  let inner = Infinity;
  for (const { points, normal } of polygons) {
    for (const point of points) outer = Math.max(outer, point.length());
    inner = Math.min(inner, Math.abs(normal.dot(points[0])));
  }
  const scale = 2 / (outer + inner);
  for (const { points } of polygons) for (const point of points) point.multiplyScalar(scale);
}

/**
 * Gives opposite faces numbers that add up to sides + 1, like real dice, where the shape allows it.
 * @param {{ normal: THREE.Vector3 }[]} polygons
 * @param {number} sides
 */
function numberFaces(polygons, sides) {
  /** @type {(number | null)[]} */
  const values = polygons.map(() => null);
  let low = 1;
  let high = sides;
  const order = polygons.map((_, index) => index).sort((i, j) => polygons[j].normal.y - polygons[i].normal.y || polygons[i].normal.x - polygons[j].normal.x);
  for (const index of order) {
    if (values[index] !== null) continue;
    const opposite = polygons.findIndex((other, k) => k !== index && values[k] === null && other.normal.dot(polygons[index].normal) < -0.9995);
    if (opposite >= 0 && sides % 2 === 0) {
      values[index] = low++;
      values[opposite] = high--;
    } else {
      values[index] = low++;
    }
  }
  return values;
}

/**
 * Pentagonal (or n-gonal) trapezohedron: two apexes joined by kite faces. A d10 is the n = 5 case.
 * @param {number} n half the number of faces
 */
function trapezohedron(n) {
  const height = 1.05;
  const ring = height * (1 - Math.cos(Math.PI / n)) / (1 + Math.cos(Math.PI / n));
  const top = new THREE.Vector3(0, height, 0);
  const bottom = new THREE.Vector3(0, -height, 0);
  /** @param {number} angle @param {number} y */
  const at = (angle, y) => new THREE.Vector3(Math.cos(angle), y, -Math.sin(angle));
  const step = (Math.PI * 2) / n;
  /** @type {{ points: THREE.Vector3[], normal: THREE.Vector3, apex: THREE.Vector3 }[]} */
  const polygons = [];
  for (let k = 0; k < n; k++) {
    const upperA = at(k * step, ring);
    const upperB = at((k + 1) * step, ring);
    const lowerMid = at((k + 0.5) * step, -ring);
    polygons.push(kite([top, upperA, lowerMid, upperB], top));
    const lowerA = at((k + 0.5) * step, -ring);
    const lowerB = at((k + 1.5) * step, -ring);
    const upperMid = at((k + 1) * step, ring);
    polygons.push(kite([bottom, lowerB, upperMid, lowerA], bottom));
  }
  return polygons;
}

/**
 * @param {THREE.Vector3[]} points
 * @param {THREE.Vector3} apex
 */
function kite(points, apex) {
  let normal = new THREE.Vector3().subVectors(points[1], points[0]).cross(new THREE.Vector3().subVectors(points[3], points[0])).normalize();
  const center = centroid(points);
  if (normal.dot(center) < 0) {
    normal = normal.negate();
    points = [points[0], points[3], points[2], points[1]];
  }
  return { points: points.map((p) => p.clone()), normal, apex: apex.clone() };
}

/** A thick 12-sided coin. Its two caps print whatever number the scene asks for. */
function coin() {
  const segments = 14;
  const radius = 1.15;
  const depth = 0.22;
  /** @type {{ points: THREE.Vector3[], normal: THREE.Vector3, cap: number }[]} */
  const polygons = [];
  /** @param {number} k @param {number} z */
  const at = (k, z) => {
    const angle = (k / segments) * Math.PI * 2 + Math.PI / 2;
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  };
  const front = [];
  const back = [];
  for (let k = 0; k < segments; k++) {
    front.push(at(k, depth));
    back.unshift(at(k, -depth));
  }
  polygons.push({ points: front, normal: new THREE.Vector3(0, 0, 1), cap: 1 });
  polygons.push({ points: back, normal: new THREE.Vector3(0, 0, -1), cap: -1 });
  for (let k = 0; k < segments; k++) {
    const points = [at(k, -depth), at(k + 1, -depth), at(k + 1, depth), at(k, depth)];
    const center = centroid(points);
    polygons.push({ points, normal: new THREE.Vector3(center.x, center.y, 0).normalize(), cap: 0 });
  }
  return polygons;
}

const NAMES = /** @type {Record<number, string>} */ ({
  4: 'Tetra',
  6: 'Hexa',
  8: 'Octa',
  10: 'Trapezo',
  12: 'Dodeca',
  20: 'Icosa'
});

/**
 * Builds the faces for a die with the given number of sides.
 * @param {number} sides
 * @returns {DieShape}
 */
export function buildShape(sides) {
  if (sides > 20 || sides < 4 || (sides % 2 === 1)) {
    const polygons = coin();
    const faces = polygons.map(({ points, normal, cap }) => {
      const center = centroid(points);
      const up = cap === 0 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      return { points, normal, up, center, value: cap === 0 ? null : cap === 1 ? 1 : 2 };
    });
    return { kind: 'coin', name: sides === 2 ? 'Coin' : 'Counter', faces };
  }

  /** @type {{ points: THREE.Vector3[], normal: THREE.Vector3, apex?: THREE.Vector3 }[]} */
  let polygons;
  let geometry = null;
  if (sides === 4) geometry = new THREE.TetrahedronGeometry(1);
  else if (sides === 6) geometry = new THREE.BoxGeometry(1, 1, 1);
  else if (sides === 8) geometry = new THREE.OctahedronGeometry(1);
  else if (sides === 12) geometry = new THREE.DodecahedronGeometry(1);
  else if (sides === 20) geometry = new THREE.IcosahedronGeometry(1);
  if (geometry) {
    polygons = polygonsFrom(geometry);
    geometry.dispose();
  } else {
    polygons = trapezohedron(sides / 2);
  }
  normalise(polygons);
  const values = numberFaces(polygons, sides);
  const faces = polygons.map(({ points, normal, apex }, index) => {
    const center = centroid(points);
    const up = labelUp(points, center, apex ? points[0] : undefined);
    return { points, normal, up, center, value: values[index] };
  });
  return { kind: 'solid', name: NAMES[sides] ?? 'Trapezo', faces };
}
