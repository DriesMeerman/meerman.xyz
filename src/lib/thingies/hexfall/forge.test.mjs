import test from 'node:test';
import assert from 'node:assert/strict';
import { hexKey, hexDistance } from './hex.js';
import { FORGE, emptyCounts, forgeWeapon, hexSet, stampSilhouette, weaponStats, weaponTypes } from './forge.js';

/** @param {[import('./data.js').ModuleType, number, number, number?][]} list */
const structure = (list, level = 0) => ({ level, modules: new Map(list.map(([type, q, r, hp = 10]) => [hexKey(q, r), { type, q, r, hp }])) });

test('a core alone forges a one hex weapon with base stats', () => {
  const weapon = forgeWeapon(structure([['core', 0, 0]]));
  assert.deepEqual(weapon.silhouette, [{ q: 0, r: 0 }]);
  assert.equal(weapon.size, 1);
  assert.deepEqual(weapon.counts, emptyCounts());
  assert.deepEqual(weapon.stats, { damage: FORGE.baseDamage, fireRate: FORGE.baseFireRate, slow: 0, pierce: 0, repair: 0 });
});

test('the silhouette is the surviving structure relative to the core', () => {
  const weapon = forgeWeapon(structure([['core', 0, 0], ['rivet', 1, 0], ['lance', 1, -1], ['mire', -1, 1], ['rivet', 2, 0, 0]], 1));
  assert.equal(weapon.level, 2);
  assert.deepEqual(weapon.silhouette, [{ q: 1, r: -1 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: -1, r: 1 }]);
  assert.deepEqual(weapon.cells.map((cell) => cell.type), ['lance', 'core', 'rivet', 'mire']);
  // The module with no health left is not part of the weapon.
  assert.deepEqual(weapon.counts, { rivet: 1, lance: 1, mire: 1, dynamo: 0, mender: 0 });
  assert.deepEqual(weaponTypes(weapon), ['rivet', 'lance', 'mire']);
});

test('stats follow the module mix', () => {
  const guns = weaponStats({ rivet: 4, lance: 0, mire: 0, dynamo: 0, mender: 0 });
  const beams = weaponStats({ rivet: 0, lance: 4, mire: 0, dynamo: 0, mender: 0 });
  const fields = weaponStats({ rivet: 0, lance: 0, mire: 3, dynamo: 2, mender: 1 });
  assert.ok(beams.damage > guns.damage);
  assert.ok(guns.fireRate > beams.fireRate);
  assert.equal(beams.pierce, 8);
  assert.equal(guns.slow, 0);
  assert.equal(fields.slow, 0.49);
  assert.equal(fields.repair, 2);
  assert.equal(fields.fireRate, 0.7);
});

test('slow and fire rate are capped', () => {
  const stats = weaponStats({ rivet: 40, lance: 0, mire: 40, dynamo: 40, mender: 0 });
  assert.equal(stats.slow, FORGE.maxSlow);
  assert.equal(stats.fireRate, FORGE.maxFireRate);
});

test('forging is pure and gives plain JSON data', () => {
  const state = structure([['core', 0, 0], ['rivet', 0, 1], ['dynamo', 0, 2]]);
  const before = JSON.stringify([...state.modules]);
  const first = forgeWeapon(state);
  const second = forgeWeapon(state);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify([...state.modules]), before);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first);
});

test('a silhouette can be stamped anywhere, turned in 60 degree steps', () => {
  const silhouette = [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 0, r: 1 }];
  const origin = { q: 4, r: -2 };
  assert.deepEqual(stampSilhouette(silhouette, origin), [{ q: 4, r: -2 }, { q: 5, r: -2 }, { q: 6, r: -2 }, { q: 4, r: -1 }]);
  for (let steps = 0; steps < 6; steps++) {
    const stamped = stampSilhouette(silhouette, origin, steps);
    assert.equal(hexSet(stamped).size, silhouette.length);
    assert.deepEqual(stamped[0], origin);
    stamped.forEach((hex, i) => assert.equal(hexDistance(hex, origin), hexDistance(silhouette[i], { q: 0, r: 0 })));
  }
  assert.deepEqual(stampSilhouette(silhouette, origin, 6), stampSilhouette(silhouette, origin, 0));
  assert.notDeepEqual(stampSilhouette(silhouette, origin, 1), stampSilhouette(silhouette, origin, 0));
});
