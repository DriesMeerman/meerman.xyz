<script>
  // A forged weapon: its silhouette drawn as small hexes, and its stats.
  import { hexCorners } from './hex.js';
  import { MODULES } from './data.js';
  import { weaponTypes } from './forge.js';

  /** @type {{ weapon: import('./forge.js').WeaponDescriptor | null, label: string }} */
  let { weapon, label } = $props();

  const shape = $derived.by(() => {
    if (!weapon) return null;
    const cells = weapon.cells.map((cell) => {
      const corners = hexCorners(cell.q, cell.r, 0.92);
      return { type: cell.type, corners, points: corners.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ') };
    });
    const xs = cells.flatMap((cell) => cell.corners.map((p) => p.x));
    const ys = cells.flatMap((cell) => cell.corners.map((p) => p.y));
    const pad = 0.4;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    // A floor on the box keeps a one hex weapon from filling the whole card.
    const width = Math.max(Math.max(...xs) + pad - minX, 7);
    const height = Math.max(Math.max(...ys) + pad - minY, 6);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { cells, viewBox: `${cx - width / 2} ${cy - height / 2} ${width} ${height}` };
  });

  const stats = $derived(
    weapon
      ? [
          ['Damage', String(weapon.stats.damage)],
          ['Rate', `${weapon.stats.fireRate.toFixed(2)}/s`],
          ['Slow', `${Math.round(weapon.stats.slow * 100)}%`],
          ['Pierce', String(weapon.stats.pierce)],
          ['Repair', `${weapon.stats.repair}/s`],
          ['Hexes', String(weapon.size)]
        ]
      : []
  );
  const legend = $derived(weapon ? weaponTypes(weapon).map((type) => ({ type, name: MODULES[type].name, count: weapon.counts[/** @type {keyof typeof weapon.counts} */ (type)] })) : []);
</script>

<article class="weapon" class:empty={!weapon} data-weapon-level={weapon?.level ?? ''}>
  <h3>{label}</h3>
  {#if weapon && shape}
    <svg viewBox={shape.viewBox} role="img" aria-label="Weapon shape, {weapon.size} hexes">
      {#each shape.cells as cell, i (i)}
        <polygon points={cell.points} class="cell type-{cell.type}" />
      {/each}
    </svg>
    <dl>
      {#each stats as [name, value] (name)}
        <div><dt>{name}</dt><dd>{value}</dd></div>
      {/each}
    </dl>
    {#if legend.length}
      <ul class="legend">
        {#each legend as item (item.type)}
          <li><span class="dot type-{item.type}" aria-hidden="true"></span>{item.count} {item.name}</li>
        {/each}
      </ul>
    {/if}
  {:else}
    <p class="none">Not forged</p>
  {/if}
</article>

<style>
  .weapon { display: flex; flex-direction: column; gap: .6rem; min-width: 0; padding: .75rem; border: 1px solid var(--lab-line); border-radius: .5rem; background: var(--lab-inset); }
  h3 { color: var(--lab-accent); font-family: var(--lab-meta-font); font-size: .62rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
  svg { width: 100%; height: auto; max-height: 9.5rem; }
  .cell { stroke: var(--lab-line-strong); stroke-width: .06; stroke-linejoin: round; fill: var(--lab-accent); }
  .type-core { fill: var(--lab-ink); background: var(--lab-ink); }
  .type-rivet { fill: var(--lab-accent); background: var(--lab-accent); }
  .type-lance { fill: var(--lab-season-autumn); background: var(--lab-season-autumn); }
  .type-mire { fill: var(--lab-season-winter); background: var(--lab-season-winter); }
  .type-dynamo { fill: var(--lab-season-summer); background: var(--lab-season-summer); }
  .type-mender { fill: var(--lab-season-spring); background: var(--lab-season-spring); }
  dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .45rem .6rem; }
  dt { color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .56rem; letter-spacing: .12em; text-transform: uppercase; }
  dd { color: var(--lab-ink); font-family: var(--lab-display-font); font-size: .95rem; line-height: 1.3; font-variant-numeric: tabular-nums; }
  .legend { display: flex; flex-wrap: wrap; gap: .25rem .7rem; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .6rem; letter-spacing: .06em; }
  .legend li { display: inline-flex; align-items: center; gap: .3rem; }
  .dot { width: .5rem; height: .5rem; border-radius: 2px; }
  .none { margin: auto 0; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .7rem; }
  .empty { opacity: .7; }
</style>
