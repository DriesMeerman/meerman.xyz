<script>
  import { onMount } from 'svelte';
  import { dayOfYear, daysInYear } from '../time.js';
  import { paletteNamed } from './palettes.js';

  /** @type {import('../registry.js').WidgetProps} */
  let { options, clock, embedded } = $props();

  const palette = $derived(paletteNamed(options.palette));
  const density = $derived(/** @type {'low' | 'medium' | 'high'} */ (['low', 'medium', 'high'].includes(options.density) ? options.density : 'medium'));
  const spin = $derived.by(() => {
    const value = Number(options.spin);
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 5) : 1;
  });
  const linked = $derived(options.link === 'on');
  const dayPhase = $derived(dayOfYear(clock.now) / daysInYear(clock.now.getFullYear()));

  /** @type {HTMLDivElement} */
  let stage;
  /** @type {HTMLCanvasElement} */
  let canvas;

  let status = $state(/** @type {'booting' | 'live' | 'failed'} */ ('booting'));
  let stats = $state({ particles: 0, flux: 0, nodes: 0 });
  let reducedMotion = $state(false);
  let dragging = $state(false);

  /** @type {ReturnType<typeof import('./scene.js').createOrbScene> | null} */
  let scene = null;

  const particlesLabel = $derived(stats.particles >= 1000 ? `${(stats.particles / 1000).toFixed(stats.particles >= 10000 ? 0 : 1)}K` : String(stats.particles));
  const spinLabel = $derived(`${spin.toFixed(spin % 1 ? 1 : 0)}x`);

  // Live option changes (the embed builder preview) reach the scene without a rebuild of the canvas.
  $effect(() => {
    scene?.configure({ palette, density, spin, dayPhase, reducedMotion });
  });

  onMount(() => {
    let disposed = false;
    let frame = 0;
    let onScreen = true;
    let hidden = document.hidden;
    /** @type {ReturnType<typeof import('./link.js').openLink> | null} */
    let link = null;
    /** @type {ReturnType<typeof setInterval> | undefined} */
    let linkTimer;
    /** @type {ReturnType<typeof setInterval> | undefined} */
    let statsTimer;
    let lastPublished = '';
    /** @type {import('./link.js').LinkPeer[]} */
    let peers = [];

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = motionQuery.matches;
    const onMotion = () => (reducedMotion = motionQuery.matches);
    motionQuery.addEventListener('change', onMotion);

    const now = () => (Date.now() % 86_400_000) / 1000;

    const loop = () => {
      frame = 0;
      if (disposed || !scene) return;
      scene.render(now());
      if (onScreen && !hidden) frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!frame && scene && onScreen && !hidden && !disposed) frame = requestAnimationFrame(loop);
    };

    /** Where this orb's centre sits on the physical screen, so other windows can place it. */
    const screenCentre = () => {
      const rect = canvas.getBoundingClientRect();
      const chromeX = (window.outerWidth - window.innerWidth) / 2;
      const chromeY = window.outerHeight - window.innerHeight;
      return { cx: window.screenX + chromeX + rect.left + rect.width / 2, cy: window.screenY + chromeY + rect.top + rect.height / 2 };
    };

    const pushPeers = () => {
      if (!scene) return;
      const me = screenCentre();
      scene.setPeers(peers.map((peer) => ({ id: peer.id, dx: peer.cx - me.cx, dy: peer.cy - me.cy, ppu: peer.ppu, palette: peer.palette, spin: peer.spin, rot: peer.rot })));
      stats.nodes = peers.length;
    };

    const publish = () => {
      if (!scene || !link) return;
      const me = screenCentre();
      const rot = /** @type {[number, number]} */ ([Math.round(scene.rot[0] * 100) / 100, Math.round(scene.rot[1] * 100) / 100]);
      const state = { cx: Math.round(me.cx), cy: Math.round(me.cy), ppu: Math.round(scene.ppu * 10) / 10, palette, spin, rot };
      const key = JSON.stringify(state);
      if (key === lastPublished) return;
      lastPublished = key;
      link.publish(state);
      pushPeers();
    };

    const resize = () => {
      if (!scene) return;
      const rect = stage.getBoundingClientRect();
      scene.resize(rect.width, rect.height, window.devicePixelRatio || 1);
      wake();
    };

    const observer = new ResizeObserver(resize);
    const visibility = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      wake();
    });
    const onVisibility = () => {
      hidden = document.hidden;
      wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    import('./scene.js')
      .then(({ createOrbScene }) => {
        if (disposed) return;
        scene = createOrbScene(canvas, { palette, density, spin, reducedMotion, dayPhase });
        resize();
        observer.observe(stage);
        visibility.observe(stage);
        status = 'live';
        statsTimer = setInterval(() => {
          if (!scene) return;
          const t = now();
          stats.particles = scene.particles;
          stats.flux = Math.min(1, 0.52 + 0.22 * Math.sin(t * 0.13) + 0.1 * Math.sin(t * 0.41) + scene.pointerStrength * 0.3);
        }, 250);
        if (linked) {
          import('./link.js').then(({ openLink }) => {
            if (disposed) return;
            link = openLink((list) => {
              peers = list;
              pushPeers();
            });
            publish();
            linkTimer = setInterval(publish, 120);
          });
        }
        wake();
      })
      .catch((error) => {
        console.warn('Orb could not start', error);
        status = 'failed';
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearInterval(statsTimer);
      clearInterval(linkTimer);
      link?.close();
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotion);
      scene?.dispose();
      scene = null;
    };
  });

  /** @type {{ x: number, y: number } | null} */
  let lastDrag = null;

  /** @param {PointerEvent} event */
  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (!scene) return;
    const point = pointerPosition(event);
    scene.setPointer(point);
    if (dragging && lastDrag) {
      scene.drag(point.x - lastDrag.x, point.y - lastDrag.y);
      lastDrag = point;
    }
  }

  /** @param {PointerEvent} event */
  function onPointerDown(event) {
    if (!scene || event.button !== 0) return;
    dragging = true;
    lastDrag = pointerPosition(event);
    stage.setPointerCapture(event.pointerId);
  }

  /** @param {PointerEvent} event */
  function onPointerUp(event) {
    dragging = false;
    lastDrag = null;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  }

  function onPointerLeave() {
    if (!dragging) scene?.setPointer(null);
  }
</script>

<div
  class="orb"
  class:embedded
  class:dragging
  bind:this={stage}
  role="img"
  aria-label="A rotating sphere of glowing particles flowing in filaments around a bright core"
  onpointermove={onPointerMove}
  onpointerdown={onPointerDown}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onpointerleave={onPointerLeave}
>
  <div class="lens" aria-hidden="true"></div>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>

  {#if status !== 'live'}
    <p class="state">{status === 'failed' ? 'WebGL unavailable' : 'Charging'}</p>
  {/if}

  <dl class="readout" aria-hidden="true">
    <div><dt>Particles</dt><dd>{particlesLabel}</dd></div>
    <div><dt>Flux</dt><dd>{stats.flux.toFixed(2)}</dd></div>
    <div><dt>Spin</dt><dd>{spinLabel}</dd></div>
    {#if linked}
      <div><dt>Link</dt><dd class:live={stats.nodes > 0}>{stats.nodes > 0 ? `${stats.nodes} ${stats.nodes === 1 ? 'node' : 'nodes'}` : 'alone'}</dd></div>
    {/if}
  </dl>
  <span class="tag" aria-hidden="true">{palette} / {density}{reducedMotion ? ' / still' : ''}</span>
</div>

<style>
  .orb {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 8rem;
    overflow: hidden;
    border-radius: .6rem;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .orb.dragging { cursor: grabbing; }

  /* In light mode the panel is pale, so the orb sits on a dark viewport that reads like a screen.
     In dark mode the same element is just a faint vignette. */
  .lens {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(ellipse 70% 70% at 50% 50%, #0d2430 0%, #071318 62%, #040c10 100%);
    box-shadow: inset 0 0 0 1px #6fd3dc2e, inset 0 0 60px #000000a8;
  }
  :global(.dark) .lens {
    background: radial-gradient(ellipse 70% 70% at 50% 50%, #0a1d2766 0%, #04101700 70%);
    box-shadow: none;
  }

  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .state {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--lab-muted);
    font-family: var(--lab-meta-font);
    font-size: .62rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    pointer-events: none;
  }

  .readout {
    position: absolute;
    left: .75rem;
    bottom: .65rem;
    display: grid;
    gap: .15rem;
    margin: 0;
    color: #8fb0ba;
    font-family: var(--lab-meta-font);
    font-size: .56rem;
    line-height: 1.3;
    letter-spacing: .12em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .readout div { display: flex; gap: .6rem; }
  .readout dt { min-width: 5.2em; opacity: .7; }
  .readout dd { margin: 0; color: #9beef3; text-shadow: 0 0 10px #6ff1f566; }
  .readout dd.live { color: #ff9ccb; text-shadow: 0 0 10px #ff6fae80; }

  .tag {
    position: absolute;
    right: .75rem;
    top: .6rem;
    color: #8fb0ba99;
    font-family: var(--lab-meta-font);
    font-size: .54rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    pointer-events: none;
  }

  @container (max-width: 330px) {
    .readout div:nth-child(n + 3), .tag { display: none; }
    .readout { font-size: .5rem; }
  }
  @container (max-width: 250px) {
    .readout { display: none; }
  }
</style>
