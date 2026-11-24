import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, createRun, parseRunParams, recordWeapon, retry } from './run.js';
import { forgeWeapon } from './forge.js';
import { createLevel } from './sim.js';

test('a run keeps one weapon slot per level', () => {
  const run = createRun(7);
  assert.deepEqual(run.weapons, [null, null, null]);
  for (let level = 0; level < 3; level++) {
    assert.equal(run.level, level);
    recordWeapon(run, forgeWeapon(createLevel({ level, seed: run.seed })));
    assert.equal(run.complete, level === 2);
    assert.equal(advance(run), level < 2);
  }
  assert.deepEqual(run.weapons.map((weapon) => weapon?.level), [1, 2, 3]);
});

test('retry bumps the attempt and advancing resets it', () => {
  const run = createRun(7);
  retry(run);
  retry(run);
  assert.equal(run.attempt, 2);
  advance(run);
  assert.equal(run.attempt, 0);
});

test('URL parameters', () => {
  const fallback = () => 99;
  assert.deepEqual(parseRunParams(new URLSearchParams('seed=42&level=3'), fallback), { seed: 42, level: 2, seeded: true });
  assert.deepEqual(parseRunParams(new URLSearchParams(''), fallback), { seed: 99, level: 0, seeded: false });
  assert.deepEqual(parseRunParams(new URLSearchParams('seed=abc&level=9'), fallback), { seed: 99, level: 2, seeded: false });
  assert.deepEqual(parseRunParams(new URLSearchParams('seed=&level=0'), fallback), { seed: 99, level: 0, seeded: false });
  assert.equal(parseRunParams(new URLSearchParams('seed=-1'), fallback).seed, 4294967295);
});
