// Balance check. Scripted build policies play every level on a set of seeds, so the numbers in
// data.js and levels.js are measured instead of guessed. If a tuning change breaks one of these,
// either the change went too far or the target below needs a deliberate update.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from './levels.js';
import { POLICIES, playLevel } from './policy.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** @type {Map<string, import('./policy.js').LevelResult[]>} */
const cache = new Map();

/** @param {keyof typeof POLICIES} policy @param {number} level */
function results(policy, level) {
  const key = `${policy}:${level}`;
  let list = cache.get(key);
  if (!list) {
    list = SEEDS.map((seed) => playLevel(level, seed, POLICIES[policy]));
    cache.set(key, list);
  }
  return list;
}

/** @param {import('./policy.js').LevelResult[]} list @param {(result: import('./policy.js').LevelResult) => number} pick */
const mean = (list, pick) => list.reduce((sum, result) => sum + pick(result), 0) / list.length;
/** @param {import('./policy.js').LevelResult[]} list */
const wins = (list) => list.filter((result) => result.won).length;

test('building nothing loses every level', () => {
  for (let level = 0; level < LEVELS.length; level++) assert.equal(wins(results('idle', level)), 0, `level ${level + 1}`);
});

test('a sensible first build wins level one with the core intact', () => {
  const list = results('generalist', 0);
  assert.equal(wins(list), SEEDS.length);
  assert.ok(mean(list, (r) => r.coreHp) >= 0.9, `core ${mean(list, (r) => r.coreHp)}`);
  assert.ok(mean(list, (r) => r.landLeft) >= 18, `land ${mean(list, (r) => r.landLeft)}`);
});

test('the same build order still wins level two most of the time', () => {
  assert.ok(wins(results('generalist', 1)) >= SEEDS.length * 0.8);
});

test('level three puts that build under pressure', () => {
  const first = results('generalist', 0);
  const third = results('generalist', 2);
  assert.ok(mean(third, (r) => r.landLeft) <= mean(first, (r) => r.landLeft) - 5, `land ${mean(third, (r) => r.landLeft)} vs ${mean(first, (r) => r.landLeft)}`);
  assert.ok(mean(third, (r) => r.modulesLost) >= mean(first, (r) => r.modulesLost) + 1, `modules lost ${mean(third, (r) => r.modulesLost)}`);
  assert.ok(mean(third, (r) => r.coreHp) < 1);
});

test('level three can be won by building for armor', () => {
  const lancer = results('lancer', 2);
  const rivets = results('rivets', 2);
  assert.ok(wins(lancer) >= SEEDS.length * 0.8, `lancer wins ${wins(lancer)}`);
  assert.ok(wins(lancer) > wins(rivets), `lancer ${wins(lancer)} vs rivets ${wins(rivets)}`);
  assert.ok(mean(lancer, (r) => r.landLeft) > mean(rivets, (r) => r.landLeft));
});

test('a level takes two to three minutes of waves', () => {
  for (let level = 0; level < LEVELS.length; level++) {
    const seconds = mean(results('generalist', level).filter((r) => r.won), (r) => r.time);
    assert.ok(seconds >= 95 && seconds <= 190, `level ${level + 1} took ${seconds.toFixed(0)} s`);
  }
});

test('each level has four waves and ends with the large rock', () => {
  for (const level of LEVELS) {
    assert.equal(level.waves.length, 4);
    assert.ok(level.waves[3].groups.some((group) => group.type === 'monolith'));
    const counts = new Map();
    for (const wave of level.waves) for (const group of wave.groups) counts.set(group.type, (counts.get(group.type) ?? 0) + group.count * (group.type === 'slag' ? 4 : 1));
    counts.delete('monolith');
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    assert.equal(top, level.leansOn, `${level.id} leans on ${top}`);
  }
});

test('winning builds forge different weapons on different levels', () => {
  const first = results('generalist', 0)[0].weapon;
  const third = results('lancer', 2)[0].weapon;
  assert.ok(first && third);
  assert.notDeepEqual(first.stats, third.stats);
  assert.ok(third.stats.pierce > first.stats.pierce);
  assert.ok(first.size > 1 && third.size > 1);
});
