import test from 'node:test';
import assert from 'node:assert/strict';
import { hexKey } from './hex.js';
import { computeNetwork, hasLinkAt, hasPowerAt, linkedKeys } from './network.js';

/** @param {[import('./data.js').ModuleType, number, number][]} list */
const build = (list) => new Map(list.map(([type, q, r]) => [hexKey(q, r), { type, q, r }]));

test('modules touching a chain back to the core are linked', () => {
  const modules = build([['core', 0, 0], ['rivet', 1, 0], ['rivet', 2, 0], ['rivet', -2, 0]]);
  const linked = linkedKeys(modules);
  assert.ok(linked.has('0,0') && linked.has('1,0') && linked.has('2,0'));
  assert.ok(!linked.has('-2,0'));
});

test('the core powers modules up to two steps away', () => {
  const modules = build([['core', 0, 0], ['rivet', 1, 0], ['rivet', 2, 0], ['rivet', 3, 0]]);
  const network = computeNetwork(modules);
  assert.deepEqual(network.get('1,0'), { linked: true, powered: true, online: true });
  assert.deepEqual(network.get('2,0'), { linked: true, powered: true, online: true });
  assert.deepEqual(network.get('3,0'), { linked: true, powered: false, online: false });
});

test('a linked Dynamo extends power by two steps', () => {
  const modules = build([['core', 0, 0], ['rivet', 1, 0], ['dynamo', 2, 0], ['rivet', 3, 0], ['rivet', 4, 0], ['rivet', 5, 0]]);
  const network = computeNetwork(modules);
  assert.equal(network.get('2,0')?.online, true);
  assert.equal(network.get('3,0')?.online, true);
  assert.equal(network.get('4,0')?.online, true);
  assert.equal(network.get('5,0')?.online, false);
});

test('losing the link takes a module and its Dynamo offline', () => {
  const modules = build([['core', 0, 0], ['rivet', 1, 0], ['dynamo', 2, 0], ['rivet', 3, 0], ['rivet', 4, 0]]);
  modules.delete('1,0');
  const network = computeNetwork(modules);
  assert.deepEqual(network.get('2,0'), { linked: false, powered: false, online: false });
  // Still within two steps of the core, but with no chain back to it.
  assert.deepEqual(network.get('3,0'), { linked: false, powered: false, online: false });
  assert.equal(network.get('4,0')?.online, false);

  modules.set('1,0', { type: 'mender', q: 1, r: 0 });
  const restored = computeNetwork(modules);
  for (const key of ['1,0', '2,0', '3,0', '4,0']) assert.equal(restored.get(key)?.online, true, key);
});

test('an unlinked module in core range has power but stays offline', () => {
  const modules = build([['core', 0, 0], ['rivet', 2, -1]]);
  assert.deepEqual(computeNetwork(modules).get('2,-1'), { linked: false, powered: true, online: false });
});

test('build preview helpers', () => {
  const modules = build([['core', 0, 0], ['rivet', 1, 0], ['rivet', 2, 0]]);
  assert.equal(hasPowerAt(modules, 2, -1), true);
  assert.equal(hasPowerAt(modules, 3, 0), false);
  assert.equal(hasLinkAt(modules, 3, 0), true);
  assert.equal(hasLinkAt(modules, -2, 0), false);
});
