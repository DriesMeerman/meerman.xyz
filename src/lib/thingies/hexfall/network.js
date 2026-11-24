// Connectivity and power. A module is online when a chain of adjacent modules links it to the core
// and it sits within POWER_RANGE hex steps of the core or of a linked Dynamo.
import { DIRECTIONS, hexDistance, hexKey } from './hex.js';
import { MODULES, POWER_RANGE } from './data.js';

/** @typedef {{ type: import('./data.js').ModuleType, q: number, r: number }} NetworkNode */
/** @typedef {{ linked: boolean, powered: boolean, online: boolean }} NetworkStatus */

/**
 * Keys of every module reachable from the core through adjacent modules.
 * @param {ReadonlyMap<string, NetworkNode>} modules
 * @returns {Set<string>}
 */
export function linkedKeys(modules) {
  /** @type {Set<string>} */
  const linked = new Set();
  const start = [...modules.values()].find((module) => module.type === 'core');
  if (!start) return linked;
  const queue = [start];
  linked.add(hexKey(start.q, start.r));
  while (queue.length) {
    const current = /** @type {NetworkNode} */ (queue.pop());
    for (const d of DIRECTIONS) {
      const key = hexKey(current.q + d.q, current.r + d.r);
      const next = modules.get(key);
      if (next && !linked.has(key)) {
        linked.add(key);
        queue.push(next);
      }
    }
  }
  return linked;
}

/**
 * The linked modules that give out power: the core and every linked Dynamo.
 * @param {ReadonlyMap<string, NetworkNode>} modules
 * @param {Set<string>} [linked]
 * @returns {NetworkNode[]}
 */
export function powerSources(modules, linked = linkedKeys(modules)) {
  return [...modules.entries()].filter(([key, module]) => linked.has(key) && MODULES[module.type].source).map(([, module]) => module);
}

/**
 * Link, power and online status for every module.
 * @param {ReadonlyMap<string, NetworkNode>} modules
 * @returns {Map<string, NetworkStatus>}
 */
export function computeNetwork(modules) {
  const linked = linkedKeys(modules);
  const sources = powerSources(modules, linked);
  /** @type {Map<string, NetworkStatus>} */
  const out = new Map();
  for (const [key, module] of modules) {
    const isLinked = linked.has(key);
    // A source powers itself, but only while it is linked.
    const powered = MODULES[module.type].source ? isLinked : sources.some((source) => hexDistance(source, module) <= POWER_RANGE);
    out.set(key, { linked: isLinked, powered, online: isLinked && powered });
  }
  return out;
}

/**
 * Whether a hex is in reach of a linked power source. Used for the build preview.
 * @param {ReadonlyMap<string, NetworkNode>} modules
 * @param {number} q
 * @param {number} r
 */
export function hasPowerAt(modules, q, r) {
  return powerSources(modules).some((source) => hexDistance(source, { q, r }) <= POWER_RANGE);
}

/**
 * Whether a module placed on this hex would touch a linked module.
 * @param {ReadonlyMap<string, NetworkNode>} modules
 * @param {number} q
 * @param {number} r
 */
export function hasLinkAt(modules, q, r) {
  const linked = linkedKeys(modules);
  return DIRECTIONS.some((d) => linked.has(hexKey(q + d.q, r + d.r)));
}
