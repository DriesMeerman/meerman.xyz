import test from 'node:test';
import assert from 'node:assert/strict';
import { HEX_STEP, hexKey, hexToWorld } from './hex.js';
import { FIXED_DT, LAND_HP, MODULES, ROCKS, SPAWN_RADIUS, waveBonus } from './data.js';
import { LEVELS } from './levels.js';
import { coreOf, createLevel, placeModule, placementError, sellModule, sellValue, slowAt, startWave, step } from './sim.js';

/** @typedef {import('./sim.js').LevelState} LevelState */

/**
 * Puts a rock in the level, flying from a point toward a hex centre.
 * @param {LevelState} state
 * @param {import('./data.js').RockType} type
 * @param {{ x: number, y: number }} from
 * @param {{ q: number, r: number }} toward
 * @param {Partial<import('./sim.js').Rock>} [overrides]
 */
function addRock(state, type, from, toward, overrides = {}) {
  const def = ROCKS[type];
  const target = hexToWorld(toward.q, toward.r);
  const length = Math.hypot(target.x - from.x, target.y - from.y);
  /** @type {import('./sim.js').Rock} */
  const rock = {
    id: state.nextId++,
    type,
    x: from.x,
    y: from.y,
    dx: (target.x - from.x) / length,
    dy: (target.y - from.y) / length,
    speed: def.speed,
    slow: 0,
    hp: def.hp,
    maxHp: def.hp,
    armor: def.armor,
    damage: def.damage,
    radius: def.radius,
    pending: 0,
    dead: false,
    ...overrides
  };
  state.rocks.push(rock);
  return rock;
}

/** @param {LevelState} state @param {number} seconds */
function run(state, seconds) {
  for (let i = 0; i < Math.round(seconds / FIXED_DT); i++) step(state, FIXED_DT);
}

/** A level in the wave phase with nothing queued, so injected rocks do not end the wave early. @param {number} [level] */
function waveLevel(level = 0) {
  const state = createLevel({ level, seed: 5 });
  state.phase = 'wave';
  state.wave = 1;
  state.queue = [{ time: 1e9, type: 'grit', angle: 0 }];
  state.credits = 1000;
  return state;
}

const EAST = { x: 9, y: 0 };

test('a fresh level is a radius 3 island with a core in the middle', () => {
  const state = createLevel({ level: 0, seed: 1 });
  assert.equal(state.land.size, 37);
  assert.equal(state.modules.size, 1);
  assert.equal(coreOf(state)?.type, 'core');
  assert.equal(coreOf(state)?.online, true);
  assert.equal(state.phase, 'build');
  assert.equal(state.wave, 0);
  assert.equal(state.credits, LEVELS[0].startCredits);
  assert.throws(() => createLevel({ level: 9 }), RangeError);
});

test('modules go on free land next to the structure and cost currency', () => {
  const state = createLevel({ level: 0, seed: 1 });
  assert.equal(placementError(state, 'rivet', 2, 0), 'not-adjacent');
  assert.equal(placementError(state, 'rivet', 0, 0), 'occupied');
  assert.equal(placementError(state, 'rivet', 4, 0), 'no-land');
  assert.equal(placementError(state, 'core', 1, 0), 'type');
  assert.equal(placementError(state, 'rivet', 1, 0), null);

  const before = state.credits;
  assert.equal(placeModule(state, 'rivet', 1, 0), true);
  assert.equal(state.credits, before - MODULES.rivet.cost);
  assert.equal(state.modules.get('1,0')?.online, true);
  assert.equal(placeModule(state, 'rivet', 1, 0), false);
  assert.equal(placementError(state, 'rivet', 2, 0), null);

  state.credits = MODULES.lance.cost - 1;
  assert.equal(placementError(state, 'lance', 2, 0), 'cost');
  assert.equal(placeModule(state, 'lance', 2, 0), false);
  assert.equal(state.credits, MODULES.lance.cost - 1);
});

test('selling pays back part of the cost, less for a damaged module, and never the core', () => {
  const state = createLevel({ level: 0, seed: 1 });
  placeModule(state, 'lance', 1, 0);
  const lance = /** @type {import('./sim.js').Module} */ (state.modules.get('1,0'));
  assert.equal(sellValue(lance), 54);
  lance.hp = lance.maxHp / 2;
  assert.equal(sellValue(lance), 27);
  const before = state.credits;
  assert.equal(sellModule(state, 1, 0), true);
  assert.equal(state.credits, before + 27);
  assert.equal(state.modules.has('1,0'), false);
  assert.equal(sellModule(state, 0, 0), false);
  assert.equal(sellModule(state, 2, 2), false);
});

test('a module cut off from the core goes offline until the chain is rebuilt', () => {
  const state = waveLevel();
  placeModule(state, 'rivet', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  assert.equal(state.modules.get('2,0')?.online, true);
  sellModule(state, 1, 0);
  assert.equal(state.modules.get('2,0')?.linked, false);
  assert.equal(state.modules.get('2,0')?.online, false);

  // Offline guns hold fire.
  addRock(state, 'grit', { x: hexToWorld(2, 0).x + 1.5, y: 3 }, { q: 2, r: 0 }, { speed: 0 });
  run(state, 2);
  assert.equal(state.shots.length, 0);
  assert.equal(state.rocks[0].hp, ROCKS.grit.hp);

  placeModule(state, 'mender', 1, 0);
  assert.equal(state.modules.get('2,0')?.online, true);
  run(state, 2);
  assert.equal(state.rocks.length, 0);
});

test('modules outside power range are offline until a Dynamo reaches them', () => {
  const state = waveLevel();
  placeModule(state, 'rivet', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  placeModule(state, 'rivet', 3, 0);
  assert.equal(state.modules.get('3,0')?.powered, false);
  assert.equal(state.modules.get('3,0')?.online, false);
  placeModule(state, 'dynamo', 2, 1);
  assert.equal(state.modules.get('3,0')?.online, true);
});

test('a rock hits the first existing hex on its line and bare land takes the damage', () => {
  const state = waveLevel();
  const rock = addRock(state, 'grit', EAST, { q: 0, r: 0 });
  run(state, 4);
  assert.equal(rock.dead, true);
  assert.equal(state.rocks.length, 0);
  assert.equal(state.land.get('3,0')?.hp, LAND_HP - ROCKS.grit.damage);
  assert.equal(state.land.get('2,0')?.hp, LAND_HP);
  assert.equal(coreOf(state)?.hp, MODULES.core.hp);
});

test('destroyed land breaks off, cannot be built on, and lets rocks through the gap', () => {
  const state = waveLevel();
  placeModule(state, 'rivet', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  for (const module of state.modules.values()) module.online = false; // keep the guns quiet for this test
  const version = state.landVersion;
  addRock(state, 'grit', EAST, { q: 0, r: 0 });
  addRock(state, 'grit', { x: 10, y: 0 }, { q: 0, r: 0 });
  run(state, 5);
  assert.equal(state.land.has('3,0'), false);
  assert.equal(state.landVersion, version + 1);
  assert.equal(state.stats.landLost, 1);
  assert.equal(placementError(state, 'rivet', 3, 0), 'no-land');
  assert.ok(state.events.some((event) => event.kind === 'landLost' && event.q === 3 && event.r === 0));

  // The next rock on the same line flies through the gap and reaches the module behind it.
  addRock(state, 'grit', EAST, { q: 0, r: 0 });
  for (const module of state.modules.values()) module.online = false;
  run(state, 5);
  assert.equal(state.modules.get('2,0')?.hp, MODULES.rivet.hp - ROCKS.grit.damage);
  assert.equal(state.land.get('2,0')?.hp, LAND_HP);
});

test('a module soaks up the hit for its hex, and what is left over goes into the land', () => {
  const state = waveLevel();
  placeModule(state, 'rivet', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  placeModule(state, 'rivet', 3, 0);
  const outer = /** @type {import('./sim.js').Module} */ (state.modules.get('3,0'));
  outer.hp = 4;
  for (const module of state.modules.values()) module.online = false;
  addRock(state, 'grit', EAST, { q: 0, r: 0 });
  run(state, 4);
  assert.equal(state.modules.has('3,0'), false);
  assert.equal(state.stats.modulesLost, 1);
  assert.equal(state.land.get('3,0')?.hp, LAND_HP - (ROCKS.grit.damage - 4));
  assert.ok(state.events.some((event) => event.kind === 'moduleLost' && event.q === 3));
});

test('the large rock ploughs through several hexes before it is spent', () => {
  const state = waveLevel();
  const rock = addRock(state, 'monolith', EAST, { q: 0, r: 0 }, { damage: 50, speed: 3 });
  run(state, 4);
  assert.equal(rock.dead, true);
  assert.equal(state.land.has('3,0'), false);
  assert.equal(state.land.has('2,0'), false);
  assert.equal(state.land.get('1,0')?.hp, LAND_HP - 10);
  assert.equal(coreOf(state)?.hp, MODULES.core.hp);
});

test('guns shoot rocks in range, and a kill pays its reward', () => {
  const state = waveLevel();
  placeModule(state, 'rivet', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  const credits = state.credits;
  addRock(state, 'grit', EAST, { q: 1, r: 0 });
  run(state, 6);
  assert.equal(state.rocks.length, 0);
  assert.equal(state.stats.kills, 1);
  assert.equal(state.credits, credits + ROCKS.grit.reward);
  assert.equal(state.land.get('3,0')?.hp, LAND_HP);
  assert.ok(state.events.some((event) => event.kind === 'rockDead'));
});

test('armor blunts guns and beams ignore it', () => {
  const gunned = waveLevel();
  placeModule(gunned, 'rivet', 1, 0);
  const a = addRock(gunned, 'slag', { x: hexToWorld(1, 0).x + 2, y: 0.9 }, { q: 1, r: 0 }, { speed: 0 });
  run(gunned, 2);
  const gunDamage = ROCKS.slag.hp - a.hp;
  // 2 seconds of fire at one shot per 0.4 s, each doing 8 - 6 armor = 2.
  assert.ok(gunDamage > 0 && gunDamage <= 12, `gun did ${gunDamage}`);

  const beamed = waveLevel();
  placeModule(beamed, 'lance', 1, 0);
  const b = addRock(beamed, 'slag', { x: hexToWorld(1, 0).x + 2, y: 0.9 }, { q: 1, r: 0 }, { speed: 0 });
  run(beamed, 1);
  assert.equal(b.hp, ROCKS.slag.hp - MODULES.lance.damage);
  assert.ok(beamed.events.some((event) => event.kind === 'beam'));
});

test('a slow field slows rocks inside its radius', () => {
  const state = waveLevel();
  placeModule(state, 'mire', 1, 0);
  const centre = hexToWorld(1, 0);
  assert.equal(slowAt(state, centre.x + 1, centre.y), MODULES.mire.slow);
  assert.equal(slowAt(state, centre.x + (MODULES.mire.range ?? 0) * HEX_STEP + 0.1, centre.y), 0);

  // Clear the bare land so the test rocks fly over open space.
  for (const key of [...state.land.keys()]) if (!state.modules.has(key)) state.land.delete(key);
  const far = { x: 0, y: -12 };
  const free = addRock(state, 'grit', far, { q: 0, r: -9 }, { dx: 1, dy: 0 });
  const slowed = addRock(state, 'grit', { x: centre.x, y: centre.y + 3.2 }, { q: 1, r: 0 }, { dx: 1, dy: 0 });
  const startX = slowed.x;
  run(state, 0.5);
  assert.ok(Math.abs(free.x - ROCKS.grit.speed * 0.5) < 1e-6);
  assert.ok(Math.abs(slowed.x - startX - ROCKS.grit.speed * (1 - (MODULES.mire.slow ?? 0)) * 0.5) < 1e-6);
});

test('a repairer heals modules next to it over time', () => {
  const state = waveLevel();
  placeModule(state, 'mender', 1, 0);
  placeModule(state, 'rivet', 2, 0);
  placeModule(state, 'rivet', -1, 0);
  const core = /** @type {import('./sim.js').Module} */ (coreOf(state));
  const near = /** @type {import('./sim.js').Module} */ (state.modules.get('2,0'));
  const far = /** @type {import('./sim.js').Module} */ (state.modules.get('-1,0'));
  core.hp = 100;
  near.hp = 10;
  far.hp = 10;
  run(state, 2);
  assert.ok(Math.abs(core.hp - (100 + (MODULES.mender.heal ?? 0) * 2)) < 1e-6);
  assert.ok(Math.abs(near.hp - (10 + (MODULES.mender.heal ?? 0) * 2)) < 1e-6);
  assert.equal(far.hp, 10);
  run(state, 60);
  assert.equal(near.hp, near.maxHp);
});

test('a wave spawns the rocks its definition lists, on the spawn ring, flying inward', () => {
  const state = createLevel({ level: 0, seed: 11 });
  assert.equal(startWave(state), true);
  assert.equal(startWave(state), false);
  assert.equal(state.phase, 'wave');
  assert.equal(state.wave, 1);
  const expected = LEVELS[0].waves[0].groups.reduce((sum, group) => sum + group.count, 0);
  assert.equal(state.queue.length, expected);
  for (let i = 1; i < state.queue.length; i++) assert.ok(state.queue[i].time >= state.queue[i - 1].time);

  step(state, FIXED_DT);
  assert.equal(state.rocks.length, 1);
  const rock = state.rocks[0];
  assert.ok(Math.abs(Math.hypot(rock.x, rock.y) - SPAWN_RADIUS) < 0.1);
  assert.ok(rock.x * rock.dx + rock.y * rock.dy < 0, 'the rock flies toward the island');
  assert.ok(Math.abs(Math.hypot(rock.dx, rock.dy) - 1) < 1e-9);
});

test('rocks come from all sides', () => {
  const state = createLevel({ level: 0, seed: 3 });
  startWave(state);
  const sextants = new Set(state.queue.map((spawn) => Math.floor((((spawn.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 3))));
  assert.ok(sextants.size >= 5, `only ${sextants.size} of 6 directions`);
});

test('the same seed replays the same level, another seed does not', () => {
  /** @param {number} seed */
  const play = (seed) => {
    const state = createLevel({ level: 1, seed });
    placeModule(state, 'rivet', 1, 0);
    placeModule(state, 'rivet', -1, 0);
    startWave(state);
    const queue = JSON.stringify(state.queue);
    run(state, 20);
    return { queue, snapshot: JSON.stringify({ rocks: state.rocks, land: [...state.land], modules: [...state.modules], credits: state.credits, rng: state.rng }) };
  };
  const a = play(42);
  const b = play(42);
  const c = play(43);
  assert.equal(a.queue, b.queue);
  assert.equal(a.snapshot, b.snapshot);
  assert.notEqual(a.queue, c.queue);
  assert.notEqual(createLevel({ level: 0, seed: 42, attempt: 1 }).rng, createLevel({ level: 0, seed: 42 }).rng);
});

test('clearing a wave pays a bonus and returns to building', () => {
  const state = createLevel({ level: 0, seed: 1 });
  startWave(state);
  state.queue = [];
  const credits = state.credits;
  step(state, FIXED_DT);
  assert.equal(state.phase, 'build');
  assert.equal(state.credits, credits + waveBonus(1));
  assert.ok(state.events.some((event) => event.kind === 'waveCleared' && event.wave === 1));
});

test('there is no income while nothing happens', () => {
  const state = createLevel({ level: 0, seed: 1 });
  const credits = state.credits;
  run(state, 30);
  assert.equal(state.credits, credits);
  assert.equal(state.phase, 'build');
});

test('the level is won when the last wave is cleared', () => {
  const state = createLevel({ level: 0, seed: 1 });
  for (let wave = 1; wave <= state.waveCount; wave++) {
    assert.equal(startWave(state), true);
    state.queue = [];
    step(state, FIXED_DT);
  }
  assert.equal(state.phase, 'won');
  assert.equal(startWave(state), false);
  assert.equal(placeModule(state, 'rivet', 1, 0), false);
  const time = state.time;
  step(state, FIXED_DT);
  assert.equal(state.time, time);
});

test('the level is lost when the core is destroyed', () => {
  const state = waveLevel();
  state.land.delete('3,0');
  state.land.delete('2,0');
  state.land.delete('1,0');
  const core = /** @type {import('./sim.js').Module} */ (coreOf(state));
  core.hp = 5;
  addRock(state, 'grit', EAST, { q: 0, r: 0 }, { speed: 4 });
  run(state, 4);
  assert.equal(state.phase, 'lost');
  assert.equal(coreOf(state), undefined);
  assert.ok(state.events.some((event) => event.kind === 'lost'));
  const time = state.time;
  step(state, FIXED_DT);
  assert.equal(state.time, time);
  assert.equal(sellModule(state, 1, 0), false);
});

test('a rock that misses everything is dropped without a reward', () => {
  const state = waveLevel();
  const credits = state.credits;
  addRock(state, 'dart', { x: -12, y: 9 }, { q: 0, r: 0 }, { dx: 1, dy: 0, speed: 20 });
  run(state, 3);
  assert.equal(state.rocks.length, 0);
  assert.equal(state.credits, credits);
  assert.equal(state.stats.kills, 0);
});
