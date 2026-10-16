<script>
  // Rotating side quest line: auto-advances, pauses on hover or focus, and decrypts each new quest into view.
  import { onMount } from 'svelte';

  /** @type {{ quests: string[], seed: number, speed: number, delay?: number, label: string }} */
  let { quests, seed, speed, delay = 0, label } = $props();

  const GLYPHS = '01<>/\\=+*#%_[]{}ABCDEFXYZ';

  let offset = $state(0);
  let hovered = $state(false);
  let focused = $state(false);
  let reduced = $state(false);
  let shown = $state('');

  const count = $derived(quests.length);
  const index = $derived(count ? (((seed + offset) % count) + count) % count : 0);
  const target = $derived(quests[index] ?? '');
  const paused = $derived(hovered || focused);

  onMount(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => (reduced = query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  });

  // Auto-advance. Reading `offset` restarts the timer after a manual step too.
  $effect(() => {
    if (paused || count < 2) return;
    const wait = Math.max(2, speed) * 1000 + (offset === 0 ? delay : 0);
    const timer = setTimeout(() => offset++, wait);
    return () => clearTimeout(timer);
  });

  // Scramble the text from noise into the new quest, left to right.
  $effect(() => {
    const text = target;
    if (reduced || typeof requestAnimationFrame === 'undefined') {
      shown = text;
      return;
    }
    const duration = 650;
    const begin = performance.now();
    let frame = 0;
    const step = (/** @type {number} */ t) => {
      const p = Math.min(1, (t - begin) / duration);
      const settled = Math.floor(p * text.length);
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      shown = out;
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div
  class="ticker"
  role="group"
  aria-label="{label} side quests"
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocusin={() => (focused = true)}
  onfocusout={() => (focused = false)}
>
  <span class="tag">QUEST {String(index + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}</span>
  <p class="quest" title={target}>
    <span class="sr-only">{target}</span>
    <span aria-hidden="true">{shown || target}</span>
  </p>
  <span class="nav">
    <button type="button" aria-label="Previous {label.toLowerCase()} quest" onclick={() => offset--}>&lsaquo;</button>
    <button type="button" aria-label="Next {label.toLowerCase()} quest" onclick={() => offset++}>&rsaquo;</button>
  </span>
  {#if !paused && !reduced && count > 1}
    {#key offset}
      <span class="timer" style:animation-duration="{Math.max(2, speed) * 1000 + (offset === 0 ? delay : 0)}ms" aria-hidden="true"></span>
    {/key}
  {/if}
</div>

<style>
  .ticker {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'tag nav' 'quest quest';
    align-items: center;
    gap: .2rem .5rem;
    padding: .35rem 0 .1rem;
    border-top: 1px dashed var(--lab-line);
    font-family: var(--lab-meta-font);
    overflow: hidden;
  }
  .tag { grid-area: tag; color: var(--c); font-size: .55rem; letter-spacing: .12em; white-space: nowrap; }
  .quest {
    margin: 0;
    min-width: 0;
    color: var(--lab-ink);
    font-size: .66rem;
    line-height: 1.35;
    letter-spacing: .02em;
    grid-area: quest;
    display: -webkit-box;
    min-height: 2.7em;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .nav { grid-area: nav; display: inline-flex; gap: 2px; }
  button {
    display: grid;
    place-items: center;
    width: 1.15rem;
    height: 1.15rem;
    padding: 0;
    border: 1px solid var(--lab-line);
    border-radius: .25rem;
    background: transparent;
    color: var(--lab-muted);
    font: inherit;
    font-size: .8rem;
    line-height: 1;
    cursor: pointer;
  }
  button:hover, button:focus-visible { color: var(--c); border-color: var(--c); outline: none; }
  .timer {
    position: absolute;
    left: 0;
    top: -1px;
    height: 1px;
    width: 100%;
    background: var(--c);
    opacity: .55;
    transform-origin: left;
    animation: drain linear forwards;
  }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  @media (max-height: 420px) {
    .quest { min-height: 0; -webkit-line-clamp: 1; line-clamp: 1; }
  }
  @media (max-height: 380px) {
    .ticker { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'quest'; padding-top: .3rem; }
    .tag, .nav { display: none; }
    .quest { min-height: 0; -webkit-line-clamp: 1; line-clamp: 1; }
  }

  @keyframes drain { from { transform: scaleX(0); } to { transform: scaleX(1); } }
</style>
