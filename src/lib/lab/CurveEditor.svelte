<script>
  /**
   * Five-point intensity curve, edited like a CSS `linear()` easing: drag a point, or focus it and use the arrow keys.
   * The first and last points stay at the start and end; the others keep their order.
   * @type {{
   *   points: import('$lib/effects/matrix-rain/field.js').CurvePoint[],
   *   seconds: number,
   *   run?: number,
   *   onchange: (points: import('$lib/effects/matrix-rain/field.js').CurvePoint[]) => void,
   *   oncommit: () => void
   * }}
   */
  let { points, seconds, run = 0, onchange, oncommit } = $props();

  const GAP = 2;
  /** @type {HTMLDivElement} */
  let plot;
  let dragging = $state(-1);

  const line = $derived(points.map(([x, y]) => `${x},${100 - y}`).join(' '));
  const area = $derived(`0,100 ${line} 100,100`);

  /** @param {number} index @param {number} x @param {number} y */
  function move(index, x, y) {
    const last = points.length - 1;
    const min = index === 0 ? 0 : index === last ? 100 : points[index - 1][0] + GAP;
    const max = index === 0 ? 0 : index === last ? 100 : points[index + 1][0] - GAP;
    const next = points.map((point) => /** @type {typeof point} */ ([...point]));
    next[index] = [Math.round(Math.min(max, Math.max(min, x))), Math.round(Math.min(100, Math.max(0, y)))];
    onchange(next);
  }

  /** @param {PointerEvent} event @param {number} index */
  function grab(event, index) {
    dragging = index;
    /** @type {HTMLElement} */ (event.currentTarget).setPointerCapture(event.pointerId);
  }

  /** @param {PointerEvent} event */
  function drag(event) {
    if (dragging < 0) return;
    const rect = plot.getBoundingClientRect();
    move(dragging, ((event.clientX - rect.left) / rect.width) * 100, (1 - (event.clientY - rect.top) / rect.height) * 100);
  }

  function release() {
    if (dragging < 0) return;
    dragging = -1;
    oncommit();
  }

  /** @param {KeyboardEvent} event @param {number} index */
  function nudge(event, index) {
    const step = event.shiftKey ? 10 : 2;
    const [x, y] = points[index];
    const moves = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    const delta = moves[/** @type {keyof typeof moves} */ (event.key)];
    if (!delta) return;
    event.preventDefault();
    move(index, x + delta[0], y + delta[1]);
    oncommit();
  }
</script>

<div class="curve">
  <span class="axis y-top" aria-hidden="true">100%</span>
  <span class="axis y-bottom" aria-hidden="true">0%</span>
  <div class="plot" bind:this={plot}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="25" x2="100" y2="25" /><line x1="0" y1="50" x2="100" y2="50" /><line x1="0" y1="75" x2="100" y2="75" />
      <line x1="25" y1="0" x2="25" y2="100" /><line x1="50" y1="0" x2="50" y2="100" /><line x1="75" y1="0" x2="75" y2="100" />
      <polygon class="area" points={area} />
      <polyline class="stroke" points={line} />
    </svg>
    {#key run}
      {#if run > 0}<span class="playhead" style:animation-duration="{seconds}s" aria-hidden="true"></span>{/if}
    {/key}
    {#each points as [x, y], index (index)}
      <button
        type="button"
        class="handle"
        class:fixed={index === 0 || index === points.length - 1}
        class:active={dragging === index}
        style:left="{x}%"
        style:top="{100 - y}%"
        aria-label="Point {index + 1}: {Math.round((x / 100) * seconds * 10) / 10} seconds, {y}% intensity"
        onpointerdown={(event) => grab(event, index)}
        onpointermove={drag}
        onpointerup={release}
        onpointercancel={release}
        onkeydown={(event) => nudge(event, index)}
      ></button>
    {/each}
  </div>
  <span class="axis x-start" aria-hidden="true">0s</span>
  <span class="axis x-end" aria-hidden="true">{seconds}s</span>
</div>

<style>
  .curve { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto auto; gap: .2rem .5rem; }
  .axis { color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .55rem; letter-spacing: .08em; }
  .y-top { grid-row: 1 / 2; grid-column: 1; align-self: start; }
  .y-bottom { grid-row: 3; grid-column: 1; align-self: end; }
  .x-start { grid-row: 4; grid-column: 2; }
  .x-end { grid-row: 4; grid-column: 2; justify-self: end; }

  .plot {
    position: relative;
    grid-row: 1 / 4;
    grid-column: 2;
    height: 9rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    background: var(--lab-inset);
    touch-action: none;
  }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  line { stroke: var(--lab-grid); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .area { fill: var(--lab-accent-soft); }
  .stroke { fill: none; stroke: var(--lab-accent); stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linejoin: round; }

  .handle {
    position: absolute;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    padding: 0;
    border: 1.5px solid var(--lab-accent);
    border-radius: 50%;
    background: var(--lab-inset);
    cursor: grab;
    touch-action: none;
    transition: transform .15s, box-shadow .15s;
  }
  .handle.fixed { cursor: ns-resize; }
  .handle:hover, .handle.active { transform: scale(1.25); box-shadow: 0 0 0 3px var(--lab-accent-soft); }
  .handle.active { cursor: grabbing; background: var(--lab-accent); }
  .handle:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 3px; }

  .playhead { position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--lab-hot); opacity: .7; pointer-events: none; animation: sweep linear forwards; }
  @keyframes sweep { to { left: 100%; } }
  @media (prefers-reduced-motion: reduce) { .playhead { display: none; } .handle { transition: none; } }
</style>
