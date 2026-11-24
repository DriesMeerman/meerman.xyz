// The Hexfall simulation. Plain data in, plain data out: no DOM, no three.js, no wall clock.
// The page calls step() with a fixed dt; tests call it the same way, so a seed replays exactly.
import { DIRECTIONS, HEX_STEP, disk, hexDistance, hexKey, hexToWorld, worldToHex } from './hex.js';
import { BUILDABLE, DESPAWN_RADIUS, ISLAND_RADIUS, LAND_HP, MODULES, ROCKS, SELL_REFUND, SPAWN_RADIUS, waveBonus } from './data.js';
import { LEVELS } from './levels.js';
import { computeNetwork } from './network.js';
import { mixSeed, random } from './rng.js';

/** @typedef {import('./data.js').ModuleType} ModuleType */
/** @typedef {import('./data.js').RockType} RockType */

/** @typedef {{ q: number, r: number, hp: number, maxHp: number }} Land */

/**
 * @typedef {object} Module
 * @property {number} id
 * @property {ModuleType} type
 * @property {number} q
 * @property {number} r
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} cooldown seconds until the next shot
 * @property {boolean} linked chain of modules back to the core
 * @property {boolean} powered within reach of the core or a linked Dynamo
 * @property {boolean} online linked and powered
 * @property {number} aim last firing direction in radians, for drawing
 */

/**
 * @typedef {object} Rock
 * @property {number} id
 * @property {RockType} type
 * @property {number} x
 * @property {number} y
 * @property {number} dx unit direction
 * @property {number} dy
 * @property {number} speed world units per second before slowing
 * @property {number} slow share of speed removed this step
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} armor
 * @property {number} damage damage left to deal before the rock breaks up
 * @property {number} radius
 * @property {number} pending damage from shots already in flight
 * @property {boolean} dead
 */

/**
 * @typedef {object} Shot
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {number} dx unit direction of the last move, for drawing
 * @property {number} dy
 * @property {number} speed
 * @property {number} damage
 * @property {number} targetId
 * @property {boolean} dead
 */

/** @typedef {{ time: number, type: RockType, angle: number }} Spawn */

/**
 * Things that happened during a step, for the renderer and the HUD. The owner of the state empties
 * the list after reading it; the simulation only appends.
 * @typedef {(
 *   | { kind: 'built' | 'sold' | 'moduleLost' | 'landLost', q: number, r: number, type?: ModuleType }
 *   | { kind: 'impact', q: number, r: number, x: number, y: number, on: 'module' | 'land', amount: number }
 *   | { kind: 'beam', x1: number, y1: number, x2: number, y2: number }
 *   | { kind: 'rockHit', id: number, x: number, y: number, rock: RockType }
 *   | { kind: 'rockDead' | 'rockSpent', x: number, y: number, rock: RockType }
 *   | { kind: 'waveStarted' | 'waveCleared' | 'won' | 'lost', wave: number }
 * )} SimEvent
 */

/** @typedef {'build' | 'wave' | 'won' | 'lost'} Phase */

/**
 * @typedef {object} LevelState
 * @property {number} level index into LEVELS
 * @property {number} seed
 * @property {number} rng generator state, see rng.js
 * @property {number} time seconds simulated
 * @property {number} waveTime seconds since the current wave started
 * @property {Phase} phase
 * @property {number} wave waves started so far
 * @property {number} waveCount
 * @property {number} credits
 * @property {Map<string, Land>} land existing hexes; a missing key is a gap
 * @property {Map<string, Module>} modules
 * @property {Rock[]} rocks
 * @property {Shot[]} shots
 * @property {Spawn[]} queue rocks still to spawn this wave, soonest first
 * @property {SimEvent[]} events
 * @property {number} nextId
 * @property {number} landVersion bumped when a hex breaks off
 * @property {number} moduleVersion bumped when modules are added, removed, or change status
 * @property {{ kills: number, earned: number, landLost: number, modulesLost: number, built: number }} stats
 */

/**
 * A fresh island with a core on the centre hex.
 * @param {{ level?: number, seed?: number, attempt?: number }} [options]
 * @returns {LevelState}
 */
export function createLevel({ level = 0, seed = 1, attempt = 0 } = {}) {
  const def = LEVELS[level];
  if (!def) throw new RangeError(`Unknown level ${level}`);
  /** @type {LevelState} */
  const state = {
    level,
    seed,
    rng: mixSeed(seed, level, attempt),
    time: 0,
    waveTime: 0,
    phase: 'build',
    wave: 0,
    waveCount: def.waves.length,
    credits: def.startCredits,
    land: new Map(),
    modules: new Map(),
    rocks: [],
    shots: [],
    queue: [],
    events: [],
    nextId: 1,
    landVersion: 0,
    moduleVersion: 0,
    stats: { kills: 0, earned: 0, landLost: 0, modulesLost: 0, built: 0 }
  };
  for (const hex of disk(ISLAND_RADIUS)) state.land.set(hexKey(hex.q, hex.r), { q: hex.q, r: hex.r, hp: LAND_HP, maxHp: LAND_HP });
  addModule(state, 'core', 0, 0);
  refreshNetwork(state);
  return state;
}

/** @param {LevelState} state @returns {Module | undefined} */
export const coreOf = (state) => state.modules.get(hexKey(0, 0));

/** @param {LevelState} state @param {ModuleType} type @param {number} q @param {number} r */
function addModule(state, type, q, r) {
  const def = MODULES[type];
  /** @type {Module} */
  const module = { id: state.nextId++, type, q, r, hp: def.hp, maxHp: def.hp, cooldown: 0, linked: false, powered: false, online: false, aim: 0 };
  state.modules.set(hexKey(q, r), module);
  return module;
}

/** Recomputes link, power and online flags after the structure changed. @param {LevelState} state */
export function refreshNetwork(state) {
  const network = computeNetwork(state.modules);
  for (const [key, module] of state.modules) {
    const status = /** @type {import('./network.js').NetworkStatus} */ (network.get(key));
    module.linked = status.linked;
    module.powered = status.powered;
    module.online = status.online;
  }
  state.moduleVersion++;
}

/**
 * Why a module cannot go on this hex, or null when it can.
 * @param {LevelState} state
 * @param {ModuleType} type
 * @param {number} q
 * @param {number} r
 * @returns {'phase' | 'type' | 'no-land' | 'occupied' | 'not-adjacent' | 'cost' | null}
 */
export function placementError(state, type, q, r) {
  if (state.phase !== 'build' && state.phase !== 'wave') return 'phase';
  if (!BUILDABLE.includes(type)) return 'type';
  const key = hexKey(q, r);
  if (!state.land.has(key)) return 'no-land';
  if (state.modules.has(key)) return 'occupied';
  if (!DIRECTIONS.some((d) => state.modules.has(hexKey(q + d.q, r + d.r)))) return 'not-adjacent';
  if (state.credits < MODULES[type].cost) return 'cost';
  return null;
}

/**
 * Builds a module. Returns false and changes nothing when the placement is not allowed.
 * @param {LevelState} state
 * @param {ModuleType} type
 * @param {number} q
 * @param {number} r
 */
export function placeModule(state, type, q, r) {
  if (placementError(state, type, q, r)) return false;
  state.credits -= MODULES[type].cost;
  const module = addModule(state, type, q, r);
  // A new weapon needs a moment before its first shot, so placing mid wave is not an instant kill.
  module.cooldown = Math.min(MODULES[type].cooldown ?? 0, 0.5);
  state.stats.built++;
  refreshNetwork(state);
  state.events.push({ kind: 'built', q, r, type });
  return true;
}

/** Currency a module pays back when sold now. @param {Module} module */
export function sellValue(module) {
  return Math.floor(MODULES[module.type].cost * SELL_REFUND * (module.hp / module.maxHp));
}

/**
 * Sells the module on a hex. The core cannot be sold.
 * @param {LevelState} state
 * @param {number} q
 * @param {number} r
 */
export function sellModule(state, q, r) {
  if (state.phase !== 'build' && state.phase !== 'wave') return false;
  const key = hexKey(q, r);
  const module = state.modules.get(key);
  if (!module || module.type === 'core') return false;
  state.credits += sellValue(module);
  state.modules.delete(key);
  refreshNetwork(state);
  state.events.push({ kind: 'sold', q, r, type: module.type });
  return true;
}

/**
 * Queues the next wave. Only works between waves.
 * @param {LevelState} state
 */
export function startWave(state) {
  if (state.phase !== 'build' || state.wave >= state.waveCount) return false;
  const wave = LEVELS[state.level].waves[state.wave];
  const bearing = random(state) * Math.PI * 2;
  /** @type {Spawn[]} */
  const queue = [];
  for (const group of wave.groups) {
    for (let i = 0; i < group.count; i++) {
      const roll = random(state);
      const angle = group.arc === undefined ? roll * Math.PI * 2 : bearing + (roll - 0.5) * group.arc;
      queue.push({ time: group.start + i * group.interval, type: group.type, angle });
    }
  }
  queue.sort((a, b) => a.time - b.time);
  state.queue = queue;
  state.wave++;
  state.waveTime = 0;
  state.phase = 'wave';
  state.events.push({ kind: 'waveStarted', wave: state.wave });
  return true;
}

/** @param {LevelState} state @param {Spawn} spawn */
function spawnRock(state, spawn) {
  const def = ROCKS[spawn.type];
  const x = Math.cos(spawn.angle) * SPAWN_RADIUS;
  const y = Math.sin(spawn.angle) * SPAWN_RADIUS;

  // Aim at the structure: the core counts three times, every other module once. The large rock
  // always goes straight for the core.
  let target = { x: 0, y: 0 };
  if (spawn.type !== 'monolith') {
    const modules = [...state.modules.values()];
    let pick = random(state) * (modules.length + 2);
    let chosen = modules[0];
    for (const module of modules) {
      pick -= module.type === 'core' ? 3 : 1;
      if (pick < 0) {
        chosen = module;
        break;
      }
    }
    const centre = hexToWorld(chosen.q, chosen.r);
    const angle = random(state) * Math.PI * 2;
    const offset = random(state) * 0.5;
    target = { x: centre.x + Math.cos(angle) * offset, y: centre.y + Math.sin(angle) * offset };
  }
  const length = Math.hypot(target.x - x, target.y - y) || 1;
  state.rocks.push({
    id: state.nextId++,
    type: spawn.type,
    x,
    y,
    dx: (target.x - x) / length,
    dy: (target.y - y) / length,
    speed: def.speed,
    slow: 0,
    hp: def.hp,
    maxHp: def.hp,
    armor: def.armor,
    damage: def.damage,
    radius: def.radius,
    pending: 0,
    dead: false
  });
}

/**
 * @param {LevelState} state
 * @param {Rock} rock
 * @param {number} amount damage after armor
 */
function damageRock(state, rock, amount) {
  if (rock.dead) return;
  rock.hp -= amount;
  if (rock.hp > 0) {
    state.events.push({ kind: 'rockHit', id: rock.id, x: rock.x, y: rock.y, rock: rock.type });
    return;
  }
  rock.dead = true;
  const reward = ROCKS[rock.type].reward;
  state.credits += reward;
  state.stats.earned += reward;
  state.stats.kills++;
  state.events.push({ kind: 'rockDead', x: rock.x, y: rock.y, rock: rock.type });
}

/** Damage one hit does after armor. @param {import('./data.js').ModuleDef} def @param {Rock} rock */
function hitDamage(def, rock) {
  const base = def.damage ?? 0;
  return def.pierce ? base : Math.max(1, base - rock.armor);
}

/** @param {LevelState} state @param {number} dt */
function updateModules(state, dt) {
  for (const module of state.modules.values()) {
    const def = MODULES[module.type];
    if (module.cooldown > 0) module.cooldown = Math.max(0, module.cooldown - dt);
    if (!module.online) continue;

    if (def.heal) {
      for (const other of state.modules.values()) {
        if (other === module || other.hp >= other.maxHp) continue;
        if (hexDistance(module, other) <= (def.range ?? 1)) other.hp = Math.min(other.maxHp, other.hp + def.heal * dt);
      }
    }

    if (!def.damage || module.cooldown > 0) continue;
    const origin = hexToWorld(module.q, module.r);
    const reach = (def.range ?? 0) * HEX_STEP;
    /** @type {Rock | null} */
    let target = null;
    let best = -Infinity;
    for (const rock of state.rocks) {
      if (rock.dead || rock.hp - rock.pending <= 0) continue;
      const distance = Math.hypot(rock.x - origin.x, rock.y - origin.y);
      if (distance > reach + rock.radius) continue;
      // Beams go for the toughest rock in reach, guns for the nearest.
      const score = def.pierce ? rock.armor * 1000 + rock.hp : -distance;
      if (score > best) {
        best = score;
        target = rock;
      }
    }
    if (!target) continue;

    module.cooldown = def.cooldown ?? 1;
    module.aim = Math.atan2(target.y - origin.y, target.x - origin.x);
    const amount = hitDamage(def, target);
    if (def.shotSpeed) {
      target.pending += amount;
      state.shots.push({ id: state.nextId++, x: origin.x, y: origin.y, dx: Math.cos(module.aim), dy: Math.sin(module.aim), speed: def.shotSpeed, damage: amount, targetId: target.id, dead: false });
    } else {
      state.events.push({ kind: 'beam', x1: origin.x, y1: origin.y, x2: target.x, y2: target.y });
      damageRock(state, target, amount);
    }
  }
}

/** @param {LevelState} state @param {number} dt */
function updateShots(state, dt) {
  if (!state.shots.length) return;
  /** @type {Map<number, Rock>} */
  const byId = new Map();
  for (const rock of state.rocks) if (!rock.dead) byId.set(rock.id, rock);
  for (const shot of state.shots) {
    const target = byId.get(shot.targetId);
    if (!target || target.dead) {
      shot.dead = true;
      continue;
    }
    const distance = Math.hypot(target.x - shot.x, target.y - shot.y);
    const travel = shot.speed * dt;
    if (distance <= travel + target.radius) {
      shot.dead = true;
      target.pending = Math.max(0, target.pending - shot.damage);
      damageRock(state, target, shot.damage);
      continue;
    }
    shot.dx = (target.x - shot.x) / distance;
    shot.dy = (target.y - shot.y) / distance;
    shot.x += shot.dx * travel;
    shot.y += shot.dy * travel;
  }
}

/** The strongest slow field covering a point, 0 when there is none. @param {LevelState} state @param {number} x @param {number} y */
export function slowAt(state, x, y) {
  let slow = 0;
  for (const module of state.modules.values()) {
    const def = MODULES[module.type];
    if (!def.slow || !module.online || def.slow <= slow) continue;
    const centre = hexToWorld(module.q, module.r);
    if (Math.hypot(x - centre.x, y - centre.y) <= (def.range ?? 0) * HEX_STEP) slow = def.slow;
  }
  return slow;
}

/**
 * A rock reached an existing hex. The module on it soaks up damage first, then the land. A rock
 * with damage left after the hex is gone keeps flying through the gap.
 * @param {LevelState} state
 * @param {Rock} rock
 * @param {Land} land
 * @returns {boolean} true when the structure changed
 */
function impact(state, rock, land) {
  const key = hexKey(land.q, land.r);
  let changed = false;
  const module = state.modules.get(key);
  if (module) {
    const dealt = Math.min(rock.damage, module.hp);
    module.hp -= dealt;
    rock.damage -= dealt;
    state.events.push({ kind: 'impact', q: land.q, r: land.r, x: rock.x, y: rock.y, on: 'module', amount: dealt });
    if (module.hp <= 0) {
      state.modules.delete(key);
      state.stats.modulesLost++;
      changed = true;
      state.events.push({ kind: 'moduleLost', q: land.q, r: land.r, type: module.type });
      if (module.type === 'core') {
        state.phase = 'lost';
        state.events.push({ kind: 'lost', wave: state.wave });
      }
    }
  }
  if (rock.damage > 0 && !state.modules.has(key)) {
    const dealt = Math.min(rock.damage, land.hp);
    land.hp -= dealt;
    rock.damage -= dealt;
    state.events.push({ kind: 'impact', q: land.q, r: land.r, x: rock.x, y: rock.y, on: 'land', amount: dealt });
    if (land.hp <= 0) {
      state.land.delete(key);
      state.landVersion++;
      state.stats.landLost++;
      state.events.push({ kind: 'landLost', q: land.q, r: land.r });
    }
  }
  if (rock.damage <= 0) {
    rock.dead = true;
    state.events.push({ kind: 'rockSpent', x: rock.x, y: rock.y, rock: rock.type });
  }
  return changed;
}

/** @param {LevelState} state @param {number} dt @returns {boolean} true when the structure changed */
function updateRocks(state, dt) {
  let changed = false;
  for (const rock of state.rocks) {
    if (rock.dead) continue;
    rock.slow = slowAt(state, rock.x, rock.y);
    const travel = rock.speed * (1 - rock.slow) * dt;
    rock.x += rock.dx * travel;
    rock.y += rock.dy * travel;
    const hex = worldToHex(rock.x, rock.y);
    const land = state.land.get(hexKey(hex.q, hex.r));
    if (land) {
      if (impact(state, rock, land)) changed = true;
      if (state.phase === 'lost') return changed;
    } else if (rock.x * rock.x + rock.y * rock.y > DESPAWN_RADIUS * DESPAWN_RADIUS) {
      rock.dead = true;
    }
  }
  return changed;
}

/**
 * Advances the level by `dt` seconds. Call it with FIXED_DT.
 * @param {LevelState} state
 * @param {number} dt
 */
export function step(state, dt) {
  if (state.phase === 'won' || state.phase === 'lost') return;
  state.time += dt;

  if (state.phase === 'wave') {
    state.waveTime += dt;
    while (state.queue.length && state.queue[0].time <= state.waveTime) {
      spawnRock(state, /** @type {Spawn} */ (state.queue.shift()));
    }
  }

  updateModules(state, dt);
  updateShots(state, dt);
  const changed = updateRocks(state, dt);

  if (state.rocks.some((rock) => rock.dead)) state.rocks = state.rocks.filter((rock) => !rock.dead);
  if (state.shots.some((shot) => shot.dead)) state.shots = state.shots.filter((shot) => !shot.dead);
  if (changed) refreshNetwork(state);
  if (state.phase !== 'wave') return;

  if (!state.queue.length && !state.rocks.length) {
    state.credits += waveBonus(state.wave);
    state.stats.earned += waveBonus(state.wave);
    state.shots = [];
    state.events.push({ kind: 'waveCleared', wave: state.wave });
    if (state.wave >= state.waveCount) {
      state.phase = 'won';
      state.events.push({ kind: 'won', wave: state.wave });
    } else {
      state.phase = 'build';
    }
  }
}
