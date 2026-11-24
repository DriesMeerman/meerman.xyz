# Hexfall

`/thingies/hexfall` is an asteroid tower defense on a hex island that floats in space. You build modules outward from a core, rocks come in from every side, and what survives a level is forged into a weapon. Hexfall is a working title.

This is phase one: three building levels and the forge result. Phase two, a larger finale level that uses the three weapons, is not built yet.

## URL parameters

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| `seed` | integer | random | Fixes the rock pattern. The same seed and the same actions replay the same level. |
| `level` | `1`, `2`, `3` | `1` | Starts the run at that level. Weapons from skipped levels stay empty. |

The game stores nothing in the browser. A reload starts a new run.

## Rules

- The island is a radius 3 hex grid (37 hexes) with the Core on the centre hex. Every level starts on a fresh island.
- A module goes on free land next to any module already built. Building and selling work between waves and during them.
- A module is online when a chain of adjacent modules links it to the Core and it sits within 2 hex steps of the Core or of a linked Dynamo. Offline modules are drawn dim and do nothing.
- Selling pays back 60% of the cost, scaled by the module's remaining health. The Core cannot be sold.
- Currency comes from rocks that modules destroy and from a bonus when a wave is cleared (`20 + 10 × wave`). There is no passive income.
- Rocks spawn on a circle 13 world units from the Core, from all directions, and fly in a straight line toward a random module. The Core counts three times in that draw.
- A rock hits the first existing hex on its line. A module on that hex takes the damage first, and what is left over goes into the land. Land with no health left breaks off and falls. After that it cannot be built on, and rocks fly through the gap.
- Each rock has a damage budget. A rock with budget left after destroying a hex keeps flying. That is how the Monolith cuts a trench.
- You start each wave yourself. A level has four waves and the last one brings a Monolith.
- The level is lost when the Core is destroyed. Retrying gives the same level with a different rock pattern.
- The level is won when the fourth wave is cleared. The forge then turns the structure into a weapon.

## Numbers

All of these live in `data.js`, `levels.js` and `forge.js`. Ranges are in hex steps.

### Modules

| Module | Role | Cost | Health | Numbers |
|--------|------|------|--------|---------|
| Core | Lose it and the level ends | n/a | 200 | Powers 2 steps around it |
| Rivet | Gun | 40 | 60 | 8 damage, 2.5 shots/s, range 2.9, armor reduces each hit |
| Lance | Beam | 90 | 50 | 60 damage every 2.4 s, range 4.5, ignores armor, aims at the toughest rock |
| Mire | Slow field | 60 | 60 | Rocks within 2.2 steps move 45% slower, fields do not stack |
| Dynamo | Power | 50 | 80 | Powers 2 steps around it |
| Mender | Repair | 70 | 50 | 4 health/s to every module within 1 step |

### Rocks

| Rock | Health | Speed | Damage budget | Armor | Reward |
|------|--------|-------|---------------|-------|--------|
| Grit | 14 | 1.5 | 10 | 0 | 3 |
| Dart | 10 | 3.4 | 12 | 0 | 4 |
| Slag | 80 | 1.0 | 30 | 6 | 12 |
| Monolith | 520 | 0.55 | 160 | 3 | 50 |

Land has 20 health per hex. Armor is taken off every Rivet hit, down to a minimum of 1.

### Levels

| Level | Leans on | Start credits | Waves |
|-------|----------|---------------|-------|
| 1 | Grit | 160 | 14 grit, then 18 grit + 2 dart, then 28 grit with a burst from one side, then 30 grit + 4 dart + Monolith |
| 2 | Dart | 200 | 12 dart + 8 grit, then 24 dart with a burst from one side, then 26 dart + 16 grit + 2 slag, then 32 dart + 14 grit + Monolith |
| 3 | Slag | 240 | 5 slag + 10 grit, then 8 slag + 10 dart, then 13 slag + 20 grit, then 14 slag + 14 dart + 16 grit + 2 Monoliths |

Each wave spawns for 20 to 30 seconds. A level is about two minutes of waves plus the time spent building.

### Forge

`forgeWeapon(state)` is a pure function. Every surviving module counts, online or not.

| Stat | Formula | Cap |
|------|---------|-----|
| Damage | `6 + 5 × Rivets + 18 × Lances` | none |
| Fire rate | `0.4 + 0.1 × Rivets + 0.15 × Dynamos` per second | 3 |
| Slow | `1 - 0.8 ^ Mires` | 0.7 |
| Pierce | `2 × Lances` | none |
| Repair | `2 × Menders` per second | none |

## Balance check

`balance.test.mjs` plays every level on ten seeds with scripted build policies from `policy.js`, so the numbers above are measured. The run on 2026-11-24:

| Policy | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|
| Builds nothing | 0/10 wins | 0/10 wins | 0/10 wins |
| Generalist (mostly guns, one of everything else) | 10/10, 28 of 37 hexes left | 10/10, 25 left | 10/10, 13 left, 2.1 modules lost |
| Guns only | 10/10, 32 left | 10/10, 30 left | 8/10, 12 left, 5.7 modules lost |
| Beams first | 10/10, 31 left | 10/10, 26 left | 10/10, 29 left |

The targets the test holds: building nothing loses, a first build wins level one with the Core intact, the same build order loses land and modules on level three, and building for armor wins level three. To try a tuning change, edit the tables and run `npm run test:unit`.

## Code layout

Everything is under `src/lib/thingies/hexfall/`.

| File | What it holds |
|------|---------------|
| `hex.js` | Axial coordinates: neighbours, distance, rings, 60 degree rotation, hex to world and back with rounding |
| `rng.js` | Seeded generator (mulberry32) with its state on the object that owns it |
| `data.js` | Module and rock tables, island and economy constants |
| `levels.js` | Wave definitions |
| `network.js` | Link and power status |
| `sim.js` | Level state, placing and selling, `startWave`, and `step(state, dt)` |
| `forge.js` | `forgeWeapon`, `weaponStats`, `stampSilhouette` |
| `run.js` | Run state (seed, level, weapons) and URL parameters |
| `policy.js` | Scripted build policies and a headless `playLevel` |
| `scene.js` | The three.js scene. The only file that imports `three`. |
| `HexfallGame.svelte` | Frame loop, input, DOM HUD |
| `WeaponCard.svelte` | A weapon's silhouette and stats |

The files above `scene.js` touch neither the DOM nor three.js, and Node can import them directly.

`HexfallGame.svelte` loads `scene.js` with a dynamic import. Its `requestAnimationFrame` loop clamps the frame time to 0.1 s, advances the simulation in fixed steps of 1/60 s (two per frame at 2x), and passes the unspent remainder to the scene, which moves rocks and shots ahead by that much when drawing. The loop stops while the tab is hidden. The scene caps the pixel ratio at 2 and lowers it a step when frames stay slow, like the orb widget.

The scene reads colours from the lab tokens (`--lab-accent`, `--lab-hot`, the season tokens and the rest) with `getComputedStyle`, and a `MutationObserver` on the `html` class repaints it when the theme changes. With reduced motion the camera shake, falling debris, idle animation and star drift are off. Rocks and shots still move.

The route is `src/routes/thingies/hexfall/`. Its `load` returns `{ chrome: false }`, which makes the root layout leave out the menu and the particle background. Any page can use that flag.

## State on the root element

The `.hexfall` element carries the state as `data-` attributes for tests: `data-ready`, `data-status`, `data-screen`, `data-phase`, `data-level`, `data-wave`, `data-waves`, `data-currency`, `data-core-health`, `data-modules`, `data-land`, `data-speed`, `data-paused` and `data-seed`.

`data-hex-origin` is the client position of the Core hex, and `data-hex-q` and `data-hex-r` are the pixel offsets of one step along each axis. The projection is orthographic, so hex `(q, r)` sits at `origin + q × hex-q + r × hex-r`.

## Tests

```sh
npm run test:unit      # node --test specs next to the pure modules
npm run test:hexfall   # Playwright: e2e/hexfall.spec.ts in both projects
npm run check
```

The unit specs are `*.test.mjs` files. The Playwright spec starts Chromium with `--enable-unsafe-swiftshader`, because the headless browser has no GPU and does not fall back to software WebGL without it. `test:unit` is not wired into CI yet.

## Keyboard

`1` to `5` pick a module, `Esc` clears the pick, `Space` starts the wave, `P` pauses, `F` switches speed, and `Delete` sells the selected module. Placing a module needs a pointer.

## What phase two consumes

The run keeps one slot per level in `run.weapons`, `null` until that level is won. A weapon descriptor is plain JSON:

```js
{
  version: 1,
  level: 1,                       // 1 based level that forged it
  silhouette: [{ q: 0, r: 0 }],   // hex offsets relative to the core, core included
  cells: [{ q: 0, r: 0, type: 'core' }],
  counts: { rivet: 0, lance: 0, mire: 0, dynamo: 0, mender: 0 },
  size: 1,
  stats: { damage: 6, fireRate: 0.4, slow: 0, pierce: 0, repair: 0 }
}
```

`stampSilhouette(silhouette, origin, steps)` places a silhouette on a grid, turned in 60 degree steps. `forgeWeapon` only needs an object with `level` and a `modules` map, so a later layer can forge a weapon from a structure made of weapons.

Copy that the owner still has to write is marked in the interface with the literal text `[DRIES TO ADD SPICE]`: the intro blurb, the module descriptions and the result screens.
