import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS, HEX_STEP, disk, hexCorners, hexDistance, hexKey, hexRound, hexToWorld, neighbors, parseKey, ring, rotateHex, worldToHex } from './hex.js';

test('keys round trip', () => {
  assert.deepEqual(parseKey(hexKey(-2, 3)), { q: -2, r: 3 });
});

test('a hex has six distinct neighbours, each one step away', () => {
  const around = neighbors(2, -1);
  assert.equal(new Set(around.map((hex) => hexKey(hex.q, hex.r))).size, 6);
  for (const hex of around) assert.equal(hexDistance(hex, { q: 2, r: -1 }), 1);
});

test('neighbour centres are one hex step apart in world units', () => {
  const origin = hexToWorld(0, 0);
  for (const d of DIRECTIONS) {
    const p = hexToWorld(d.q, d.r);
    assert.ok(Math.abs(Math.hypot(p.x - origin.x, p.y - origin.y) - HEX_STEP) < 1e-9);
  }
});

test('distance counts hex steps', () => {
  assert.equal(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 }), 0);
  assert.equal(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 }), 3);
  assert.equal(hexDistance({ q: -2, r: 1 }, { q: 2, r: 1 }), 4);
  assert.equal(hexDistance({ q: 1, r: 1 }, { q: -1, r: -1 }), 4);
});

test('rings and disks have the expected sizes', () => {
  assert.equal(ring({ q: 0, r: 0 }, 0).length, 1);
  for (let n = 1; n <= 4; n++) {
    const hexes = ring({ q: 1, r: -2 }, n);
    assert.equal(hexes.length, 6 * n);
    assert.equal(new Set(hexes.map((hex) => hexKey(hex.q, hex.r))).size, 6 * n);
    for (const hex of hexes) assert.equal(hexDistance(hex, { q: 1, r: -2 }), n);
  }
  assert.equal(disk(3).length, 37);
  assert.deepEqual(disk(3)[0], { q: 0, r: 0 });
});

test('hex to world and back returns the same hex', () => {
  for (const hex of disk(6)) {
    const p = hexToWorld(hex.q, hex.r);
    assert.deepEqual(worldToHex(p.x, p.y), hex);
  }
});

test('points near a centre round to that hex, points past an edge to the neighbour', () => {
  const centre = hexToWorld(2, -1);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    assert.deepEqual(worldToHex(centre.x + Math.cos(angle) * 0.8, centre.y + Math.sin(angle) * 0.8), { q: 2, r: -1 });
  }
  // The edge shared with the q+1 neighbour sits half a step to the right.
  assert.deepEqual(worldToHex(centre.x + HEX_STEP / 2 + 0.01, centre.y), { q: 3, r: -1 });
  assert.deepEqual(worldToHex(centre.x + HEX_STEP / 2 - 0.01, centre.y), { q: 2, r: -1 });
});

test('rounding keeps q + r + s at zero', () => {
  assert.deepEqual(hexRound(0.4, 0.4), { q: 0, r: 1 });
  assert.deepEqual(hexRound(-0.1, 0.2), { q: 0, r: 0 });
  assert.deepEqual(hexRound(2.6, -1.2), { q: 3, r: -1 });
});

test('rotation turns in 60 degree steps and comes back after six', () => {
  const hex = { q: 2, r: -1 };
  assert.deepEqual(rotateHex(hex, 0), hex);
  assert.deepEqual(rotateHex(hex, 6), hex);
  assert.deepEqual(rotateHex(rotateHex(hex, 2), -2), hex);
  assert.deepEqual(rotateHex({ q: 1, r: 0 }, 1), { q: 0, r: 1 });
  assert.deepEqual(rotateHex({ q: 1, r: 0 }, 3), { q: -1, r: 0 });

  const before = hexToWorld(hex.q, hex.r);
  const turned = rotateHex(hex, 1);
  const after = hexToWorld(turned.q, turned.r);
  const angle = Math.atan2(after.y, after.x) - Math.atan2(before.y, before.x);
  const wrapped = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  assert.ok(Math.abs(wrapped - Math.PI / 3) < 1e-9);
  assert.ok(Math.abs(Math.hypot(after.x, after.y) - Math.hypot(before.x, before.y)) < 1e-9);
});

test('rotation keeps distances between hexes', () => {
  const a = { q: 2, r: 1 };
  const b = { q: -1, r: 3 };
  for (let steps = 0; steps < 6; steps++) assert.equal(hexDistance(rotateHex(a, steps), rotateHex(b, steps)), hexDistance(a, b));
});

test('corners sit one hex size from the centre', () => {
  const centre = hexToWorld(1, 1);
  const corners = hexCorners(1, 1);
  assert.equal(corners.length, 6);
  for (const corner of corners) assert.ok(Math.abs(Math.hypot(corner.x - centre.x, corner.y - centre.y) - 1) < 1e-9);
});
