<script>
  // Hexfall: the page component. It owns the run, the fixed step loop and the DOM HUD. The rules live
  // in sim.js and the drawing in scene.js, which is loaded on demand so three.js stays off other pages.
  import '$lib/lab/lab.css';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { darkMode, toggleDarkMode } from '$lib/state.svelte.js';
  import HudPanel from '$lib/lab/HudPanel.svelte';
  import WeaponCard from './WeaponCard.svelte';
  import { hexKey } from './hex.js';
  import { BUILDABLE, FIXED_DT, MODULES, POWER_RANGE } from './data.js';
  import { LEVELS } from './levels.js';
  import { forgeWeapon } from './forge.js';
  import { advance, createRun, parseRunParams, recordWeapon, retry } from './run.js';
  import { coreOf, createLevel, placeModule, placementError, sellModule, sellValue, startWave, step } from './sim.js';

  /** @typedef {import('./data.js').ModuleType} ModuleType */
  /** @typedef {'intro' | 'play' | 'won' | 'lost' | 'final'} Screen */

  const SPICE = '[DRIES TO ADD SPICE]';
  const MAX_STEPS_PER_FRAME = 10;
  const END_DELAY = 0.9; // seconds the last hit stays on screen before the result panel opens

  const params = parseRunParams(page.url.searchParams);
  let run = createRun(params.seed, params.level);
  let sim = createLevel({ level: run.level, seed: run.seed, attempt: run.attempt });

  let screen = $state(/** @type {Screen} */ ('intro'));
  let status = $state(/** @type {'booting' | 'live' | 'failed'} */ ('booting'));
  let hud = $state({ ready: false, level: 1, wave: 0, waveCount: 4, credits: 0, coreHp: 0, coreMax: 1, phase: 'build', modules: 1, land: 0, rocks: 0 });
  let weapons = $state.raw(run.weapons.slice());
  let picked = $state(/** @type {ModuleType | null} */ (null));
  let selected = $state.raw(/** @type {{ q: number, r: number } | null} */ (null));
  let info = $state({ type: /** @type {ModuleType} */ ('core'), hp: 0, maxHp: 1, linked: true, powered: true, refund: 0 });
  let speed = $state(1);
  let paused = $state(false);
  let notice = $state('');
  let anchors = $state({ origin: '', q: '', r: '' });
  let seed = $state(run.seed);
  let topHeight = $state(96); // px the top bar takes, so dialogs open below it

  /** @type {HTMLDivElement} */
  let root;
  /** @type {HTMLCanvasElement} */
  let canvas;
  /** @type {HTMLElement} */
  let topEl;
  /** @type {HTMLElement} */
  let dockEl;
  /** @type {ReturnType<typeof import('./scene.js').createHexfallScene> | null} */
  let scene = $state.raw(null);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let noticeTimer;
  /** Starts the frame loop again after something stopped it. Set in onMount. */
  let wake = () => {};

  const levelName = $derived(LEVELS[hud.level - 1]?.name ?? '');
  const lastLevel = $derived(hud.level >= LEVELS.length);
  const coreShare = $derived(Math.max(0, Math.min(1, hud.coreHp / hud.coreMax)));
  const canStart = $derived(screen === 'play' && hud.phase === 'build');
  const waveLabel = $derived(hud.phase === 'build' ? `Start wave ${Math.min(hud.wave + 1, hud.waveCount)}` : `Wave ${hud.wave}: ${hud.rocks} left`);
  const selectedStatus = $derived(!info.linked ? 'Offline: not linked to the core' : !info.powered ? 'Offline: no power in reach' : 'Online');

  /** One line of numbers per module type. @param {ModuleType} type */
  function statLine(type) {
    const def = MODULES[type];
    if (def.damage && def.cooldown) return `Damage ${def.damage} · ${(1 / def.cooldown).toFixed(1)}/s · Range ${def.range}${def.pierce ? ' · Ignores armor' : ''}`;
    if (def.slow) return `Slows ${Math.round(def.slow * 100)}% · Radius ${def.range}`;
    if (def.heal) return `Repairs ${def.heal}/s · Reach ${def.range}`;
    return `Powers modules within ${POWER_RANGE} hexes`;
  }

  /** Reach in hex steps to draw around a module of this type. @param {ModuleType} type */
  const reachOf = (type) => (MODULES[type].source ? POWER_RANGE : (MODULES[type].range ?? 0));

  const REASONS = /** @type {Record<string, string>} */ ({
    cost: 'Not enough credits',
    'not-adjacent': 'Build next to your structure',
    'no-land': 'No land there',
    occupied: 'Hex is taken'
  });

  /** @param {string} text */
  function say(text) {
    notice = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = ''), 1800);
  }

  function readColors() {
    const style = getComputedStyle(root);
    const get = (/** @type {string} */ name) => style.getPropertyValue(name).trim();
    return {
      accent: get('--lab-accent'),
      hot: get('--lab-hot'),
      ink: get('--lab-ink'),
      muted: get('--lab-muted'),
      line: get('--lab-line-strong'),
      inset: get('--lab-inset'),
      spring: get('--lab-season-spring'),
      summer: get('--lab-season-summer'),
      autumn: get('--lab-season-autumn'),
      winter: get('--lab-season-winter'),
      dark: document.documentElement.classList.contains('dark')
    };
  }

  /** Copies the numbers the HUD shows out of the simulation. Unchanged values cost nothing. */
  function syncHud() {
    const core = coreOf(sim);
    hud.level = sim.level + 1;
    hud.wave = sim.wave;
    hud.waveCount = sim.waveCount;
    hud.credits = sim.credits;
    hud.coreHp = core ? Math.ceil(core.hp) : 0;
    hud.coreMax = MODULES.core.hp;
    hud.phase = sim.phase;
    hud.modules = sim.modules.size;
    hud.land = sim.land.size;
    hud.rocks = sim.rocks.length + sim.queue.length;
    if (selected) {
      const module = sim.modules.get(hexKey(selected.q, selected.r));
      if (!module) {
        selected = null;
      } else {
        info.type = module.type;
        info.hp = Math.ceil(module.hp);
        info.maxHp = module.maxHp;
        info.linked = module.linked;
        info.powered = module.powered;
        info.refund = sellValue(module);
      }
    }
  }

  function beginLevel() {
    sim = createLevel({ level: run.level, seed: run.seed, attempt: run.attempt });
    picked = null;
    selected = null;
    paused = false;
    notice = '';
    syncHud();
    screen = 'play';
    wake();
  }

  function nextLevel() {
    if (advance(run)) beginLevel();
    else screen = 'final';
  }

  function retryLevel() {
    retry(run);
    beginLevel();
  }

  function newRun() {
    run = createRun(params.seeded ? params.seed : Math.floor(Math.random() * 0xffffffff), 0);
    weapons = run.weapons.slice();
    seed = run.seed;
    beginLevel();
  }

  function onStartWave() {
    if (canStart && startWave(sim)) syncHud();
  }

  /** @param {ModuleType} type */
  function pick(type) {
    picked = picked === type ? null : type;
    selected = null;
    scene?.setCursor(null);
  }

  function sellSelected() {
    if (!selected) return;
    if (sellModule(sim, selected.q, selected.r)) {
      selected = null;
      syncHud();
    }
  }

  /** @param {PointerEvent | MouseEvent} event */
  function hexAt(event) {
    if (!scene) return null;
    const rect = canvas.getBoundingClientRect();
    return scene.pick(event.clientX - rect.left, event.clientY - rect.top);
  }

  /** @param {PointerEvent} event */
  function onPointerMove(event) {
    if (!scene || screen !== 'play' || event.pointerType === 'touch') return;
    const hex = hexAt(event);
    if (!hex || !picked || !sim.land.has(hexKey(hex.q, hex.r))) return scene.setCursor(null);
    scene.setCursor({ q: hex.q, r: hex.r, ok: placementError(sim, picked, hex.q, hex.r) === null, range: reachOf(picked) });
  }

  /** @param {MouseEvent} event */
  function onCanvasClick(event) {
    if (!scene || screen !== 'play') return;
    const hex = hexAt(event);
    if (!hex) return;
    const module = sim.modules.get(hexKey(hex.q, hex.r));
    if (module) {
      // Tapping a module always selects it, also while a palette item is active.
      picked = null;
      selected = { q: hex.q, r: hex.r };
      scene.setCursor(null);
      syncHud();
      return;
    }
    selected = null;
    if (!picked) return;
    const error = placementError(sim, picked, hex.q, hex.r);
    if (error) {
      if (sim.land.has(hexKey(hex.q, hex.r))) scene.setCursor({ q: hex.q, r: hex.r, ok: false, range: 0 });
      say(REASONS[error] ?? 'Cannot build there');
      return;
    }
    placeModule(sim, picked, hex.q, hex.r);
    scene.setCursor(null);
    syncHud();
  }

  /** @param {KeyboardEvent} event */
  function onKey(event) {
    if (screen !== 'play' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target instanceof HTMLElement && ['BUTTON', 'A', 'INPUT'].includes(event.target.tagName) && (event.key === ' ' || event.key === 'Enter')) return;
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && BUILDABLE[index]) pick(BUILDABLE[index]);
    else if (event.key === 'Escape') {
      picked = null;
      selected = null;
      scene?.setCursor(null);
    } else if (event.key === ' ') {
      event.preventDefault();
      onStartWave();
    } else if (event.key === 'p' || event.key === 'P') paused = !paused;
    else if (event.key === 'f' || event.key === 'F') speed = speed === 1 ? 2 : 1;
    else if ((event.key === 'Delete' || event.key === 'Backspace') && selected) sellSelected();
  }

  $effect(() => {
    scene?.setBuildType(screen === 'play' ? picked : null);
  });
  $effect(() => {
    const type = info.type;
    scene?.setSelection(selected && screen === 'play' ? { q: selected.q, r: selected.r, range: reachOf(type) } : null);
  });

  /** Moves focus to a dialog's main button when it opens. @param {HTMLElement} node */
  function focusFirst(node) {
    node.focus({ preventScroll: true });
  }

  onMount(() => {
    let disposed = false;
    let frame = 0;
    let last = 0;
    let backlog = 0; // simulated seconds owed to the fixed step
    let endTimer = 0;
    let hidden = document.hidden;
    /** @type {(() => void)[]} */
    const cleanups = [];

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 820px)');

    /** Opens the result or the retry panel a moment after the level ends. @param {number} dt */
    const watchEnd = (dt) => {
      if (screen !== 'play' || (sim.phase !== 'won' && sim.phase !== 'lost')) return void (endTimer = 0);
      endTimer += dt;
      if (endTimer < END_DELAY) return;
      endTimer = 0;
      picked = null;
      selected = null;
      scene?.setCursor(null);
      if (sim.phase === 'won') {
        recordWeapon(run, forgeWeapon(sim));
        weapons = run.weapons.slice();
        screen = 'won';
      } else {
        screen = 'lost';
      }
    };

    /** @param {number} timestamp */
    const loop = (timestamp) => {
      frame = 0;
      if (disposed || !scene) return;
      const now = timestamp / 1000;
      const dt = last ? Math.min(0.1, now - last) : FIXED_DT;
      last = now;

      if (screen === 'play' && !paused) {
        backlog += dt * speed;
        let steps = 0;
        while (backlog >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
          step(sim, FIXED_DT);
          backlog -= FIXED_DT;
          steps++;
        }
        if (steps === MAX_STEPS_PER_FRAME) backlog = 0; // too far behind: drop the debt instead of spiralling
      }

      scene.render(sim, dt, screen === 'play' && !paused ? backlog : 0);
      sim.events.length = 0;
      syncHud();
      watchEnd(dt);
      hud.ready = true;
      if (!hidden) frame = requestAnimationFrame(loop);
    };

    wake = () => {
      if (frame || disposed || hidden || !scene) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      if (!scene) return;
      const rect = root.getBoundingClientRect();
      const top = topEl.getBoundingClientRect();
      const dock = dockEl.getBoundingClientRect();
      const insets = wide.matches
        ? { top: top.bottom - rect.top, right: rect.right - dock.left, bottom: 0, left: 0 }
        : { top: top.bottom - rect.top, right: 0, bottom: rect.bottom - dock.top, left: 0 };
      scene.resize(rect.width, rect.height, window.devicePixelRatio || 1, insets);
      topHeight = Math.round(top.bottom - rect.top);
      // Screen positions of three hexes. The projection is linear, so tests can find any hex from these.
      const o = scene.hexToCanvas(0, 0);
      const q = scene.hexToCanvas(1, 0);
      const r = scene.hexToCanvas(0, 1);
      const pair = (/** @type {number} */ x, /** @type {number} */ y) => `${x.toFixed(1)},${y.toFixed(1)}`;
      anchors = { origin: pair(o.x + rect.left, o.y + rect.top), q: pair(q.x - o.x, q.y - o.y), r: pair(r.x - o.x, r.y - o.y) };
      wake();
    };

    const onVisibility = () => {
      hidden = document.hidden;
      // Coming back from a hidden tab must not replay the time away.
      last = 0;
      wake();
    };
    document.addEventListener('visibilitychange', onVisibility);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

    syncHud();

    import('./scene.js')
      .then(({ createHexfallScene }) => {
        if (disposed) return;
        const created = createHexfallScene(canvas, { colors: readColors(), reducedMotion: motion.matches });
        scene = created;
        cleanups.push(() => created.dispose());

        const onMotion = () => created.setReducedMotion(motion.matches);
        motion.addEventListener('change', onMotion);
        cleanups.push(() => motion.removeEventListener('change', onMotion));

        // Repaint when the theme class on <html> changes.
        const themeObserver = new MutationObserver(() => created.setColors(readColors()));
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        cleanups.push(() => themeObserver.disconnect());

        const observer = new ResizeObserver(resize);
        for (const element of [root, topEl, dockEl]) observer.observe(element);
        cleanups.push(() => observer.disconnect());
        wide.addEventListener('change', resize);
        cleanups.push(() => wide.removeEventListener('change', resize));

        resize();
        status = 'live';
        wake();
      })
      .catch((error) => {
        console.warn('Hexfall could not start', error);
        status = 'failed';
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(noticeTimer);
      for (const cleanup of cleanups.reverse()) cleanup();
      scene = null;
      wake = () => {};
    };
  });
</script>

<svelte:window onkeydown={onKey} />

<div
  class="hexfall profile-theme lab-theme"
  bind:this={root}
  data-ready={hud.ready}
  data-status={status}
  data-screen={screen}
  data-phase={hud.phase}
  data-level={hud.level}
  data-wave={hud.wave}
  data-waves={hud.waveCount}
  data-currency={hud.credits}
  data-core-health={hud.coreHp}
  data-modules={hud.modules}
  data-land={hud.land}
  data-speed={speed}
  data-paused={paused}
  data-seed={seed}
  data-hex-origin={anchors.origin}
  data-hex-q={anchors.q}
  data-hex-r={anchors.r}
  style:--hx-top="{topHeight}px"
>
  <canvas
    bind:this={canvas}
    class:building={picked !== null}
    aria-label="Hexfall island"
    onpointermove={onPointerMove}
    onpointerleave={() => scene?.setCursor(null)}
    onclick={onCanvasClick}
  ></canvas>

  <div class="hud-layer">
    <header class="top" bind:this={topEl}>
      <a class="chip back" href="/thingies"><span aria-hidden="true">←</span> Thingies</a>
      <h1>Hexfall</h1>
      <button type="button" class="chip theme" onclick={toggleDarkMode} aria-label="Switch to {darkMode.current ? 'light' : 'dark'} mode">{darkMode.current ? 'Light' : 'Dark'}</button>
      <dl class="stats">
        <div><dt>Level</dt><dd>{hud.level}<small>/{LEVELS.length}</small></dd></div>
        <div><dt>Wave</dt><dd data-testid="wave">{hud.wave}<small>/{hud.waveCount}</small></dd></div>
        <div><dt>Credits</dt><dd data-testid="credits">{hud.credits}</dd></div>
        <div class="core" class:low={coreShare < 0.35}>
          <dt>Core</dt>
          <dd>
            <span class="meter" role="meter" aria-label="Core health" aria-valuemin="0" aria-valuemax={hud.coreMax} aria-valuenow={hud.coreHp}><span style:width="{coreShare * 100}%"></span></span>
            <span data-testid="core">{hud.coreHp}</span>
          </dd>
        </div>
      </dl>
    </header>

    <aside class="dock" bind:this={dockEl} aria-label="Build and wave controls">
      <div class="controls">
        <button type="button" class="btn primary start" onclick={onStartWave} disabled={!canStart} data-testid="start-wave">{waveLabel}</button>
        <button type="button" class="btn" onclick={() => (paused = !paused)} aria-pressed={paused} data-testid="pause">{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" class="btn" onclick={() => (speed = speed === 1 ? 2 : 1)} aria-pressed={speed === 2} aria-label="Speed {speed}x" data-testid="speed">{speed}x</button>
      </div>

      <div class="palette" role="group" aria-label="Modules">
        {#each BUILDABLE as type, i (type)}
          {@const def = MODULES[type]}
          <button
            type="button"
            class="pick"
            class:active={picked === type}
            class:poor={hud.credits < def.cost}
            aria-pressed={picked === type}
            aria-keyshortcuts={String(i + 1)}
            data-module={type}
            onclick={() => pick(type)}
          >
            <span class="swatch type-{type}" aria-hidden="true"></span>
            <span class="name">{def.name}</span>
            <span class="role">{def.role}</span>
            <span class="cost">{def.cost}</span>
          </button>
        {/each}
      </div>

      <div class="detail" aria-live="polite">
        {#if notice}
          <p class="notice">{notice}</p>
        {:else if selected}
          <div class="detail-text">
            <p class="detail-title"><span class="swatch type-{info.type}" aria-hidden="true"></span>{MODULES[info.type].name} <span class="hp">{info.hp}/{info.maxHp}</span></p>
            <p class="detail-line" class:warn={!info.linked || !info.powered}>{selectedStatus}</p>
          </div>
          {#if info.type !== 'core'}
            <button type="button" class="btn sell" onclick={sellSelected} data-testid="sell">Sell +{info.refund}</button>
          {/if}
        {:else if picked}
          <div class="detail-text">
            <p class="detail-title"><span class="swatch type-{picked}" aria-hidden="true"></span>{MODULES[picked].name} <span class="hp">{MODULES[picked].hp} HP</span></p>
            <p class="detail-line">{statLine(picked)}</p>
            <p class="detail-line spice">{SPICE}</p>
          </div>
        {:else}
          <p class="detail-line">Pick a module, then a marked hex.</p>
        {/if}
      </div>
    </aside>

    {#if paused && screen === 'play'}
      <p class="paused" aria-live="polite">Paused</p>
    {/if}
  </div>

  {#if status === 'failed'}
    <div class="veil">
      <div class="dialog small"><HudPanel label="Hexfall" code="ERR"><p class="body">This needs WebGL, and it is not available in this browser.</p><a class="btn" href="/thingies">Back to Thingies</a></HudPanel></div>
    </div>
  {:else if screen === 'intro'}
    <div class="veil clear">
      <div class="dialog small" role="dialog" aria-modal="true" aria-labelledby="hexfall-title">
        <HudPanel label="Thingies" code="HX" status={status === 'live' ? 'Ready' : 'Loading'}>
          <h2 id="hexfall-title" class="title">Hexfall</h2>
          <p class="body spice">{SPICE}</p>
          <ul class="rules">
            <li>Build modules next to your core.</li>
            <li>Rocks break modules and land. Lose the core, lose the level.</li>
            <li>What survives a level is forged into a weapon.</li>
          </ul>
          <button type="button" class="btn primary" onclick={beginLevel} disabled={status !== 'live'} data-testid="begin" use:focusFirst>Start</button>
        </HudPanel>
      </div>
    </div>
  {:else if screen === 'won'}
    <div class="veil">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="hexfall-won">
        <HudPanel label="Forge" code="L{hud.level}" status="Cleared">
          <h2 id="hexfall-won" class="title">{levelName} cleared</h2>
          <p class="body spice">{SPICE}</p>
          <div class="cards one"><WeaponCard weapon={weapons[hud.level - 1]} label="Weapon {hud.level}" /></div>
          <button type="button" class="btn primary" onclick={nextLevel} data-testid="next" use:focusFirst>{lastLevel ? 'Show all weapons' : `Start level ${hud.level + 1}`}</button>
        </HudPanel>
      </div>
    </div>
  {:else if screen === 'lost'}
    <div class="veil">
      <div class="dialog small" role="dialog" aria-modal="true" aria-labelledby="hexfall-lost">
        <HudPanel label="Core destroyed" code="L{hud.level}" status="Wave {hud.wave}">
          <h2 id="hexfall-lost" class="title hot">Core destroyed</h2>
          <p class="body spice">{SPICE}</p>
          <button type="button" class="btn primary" onclick={retryLevel} data-testid="retry" use:focusFirst>Retry level {hud.level}</button>
        </HudPanel>
      </div>
    </div>
  {:else if screen === 'final'}
    <div class="veil">
      <div class="dialog wide" role="dialog" aria-modal="true" aria-labelledby="hexfall-final">
        <HudPanel label="Forge" code="END" status="{weapons.filter(Boolean).length} forged">
          <h2 id="hexfall-final" class="title">Three weapons</h2>
          <p class="body spice">{SPICE}</p>
          <div class="cards">
            {#each weapons as weapon, i (i)}
              <WeaponCard {weapon} label="Weapon {i + 1}" />
            {/each}
          </div>
          <p class="body" data-testid="finale-note">The finale is not built yet.</p>
          <div class="row">
            <button type="button" class="btn primary" onclick={newRun} data-testid="new-run" use:focusFirst>New run</button>
            <a class="btn" href="/thingies">Back to Thingies</a>
          </div>
        </HudPanel>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Full screen, in place of the site chrome. The backdrop is the lab's control-room gradient, with a
     paler version for light mode. */
  .hexfall {
    --hx-backdrop: radial-gradient(ellipse 120% 900px at 50% -10%, #f6fbfb 0%, #e2eeef 60%, #d3e2e5 100%) no-repeat #d3e2e5;
    --hx-gap: .6rem;
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--hx-backdrop);
    color: var(--lab-ink);
    font-family: var(--lab-meta-font);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }
  :global(.dark) .hexfall { --hx-backdrop: radial-gradient(ellipse 120% 900px at 50% -10%, #17313b 0%, #0c171d 60%, #070d11 100%) no-repeat #070d11; }
  :global(html body:has(.hexfall)) { background: #d3e2e5; overflow: hidden; overscroll-behavior: none; }
  :global(html.dark body:has(.hexfall)) { background: #070d11; }

  canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; outline: none; }
  canvas.building { cursor: crosshair; }

  .hud-layer { position: absolute; inset: 0; display: grid; grid-template-rows: auto 1fr auto; gap: var(--hx-gap); padding: var(--hx-gap); padding-bottom: max(var(--hx-gap), env(safe-area-inset-bottom)); pointer-events: none; }
  .hud-layer > * { pointer-events: auto; }

  /* Shared panel look, after HudPanel: thin line, faint grid, blurred glass. */
  .top, .dock {
    border: 1px solid var(--lab-line);
    border-radius: var(--lab-radius);
    background:
      linear-gradient(var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      linear-gradient(90deg, var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      var(--lab-surface);
    box-shadow: var(--lab-glow), inset 0 1px 0 #ffffff14;
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
  }

  /* The top bar stays above the dialogs, so the way back and the theme switch always work. */
  .top { position: relative; z-index: 3; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .35rem .6rem; padding: .4rem .5rem; }
  h1 { min-width: 0; color: var(--lab-ink); font-family: var(--lab-display-font); font-size: 1rem; letter-spacing: .04em; line-height: 1; text-align: center; }
  .chip, .btn, .pick {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    border: 1px solid var(--lab-line);
    border-radius: .4rem;
    color: var(--lab-ink);
    background: var(--lab-inset);
    font-family: var(--lab-meta-font);
    font-size: .68rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    transition: color .15s, border-color .15s, box-shadow .15s, background-color .15s;
  }
  .chip { gap: .35rem; min-width: 44px; padding: 0 .7rem; }
  .btn { padding: 0 .9rem; }
  .chip:hover, .btn:hover:not(:disabled), .pick:hover { border-color: var(--lab-line-strong); }
  .chip:focus-visible, .btn:focus-visible, .pick:focus-visible { outline: 2px solid var(--lab-accent); outline-offset: 2px; }
  .btn.primary { color: var(--lab-accent); border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent-soft), var(--lab-glow); text-shadow: var(--lab-text-glow); }
  .btn:disabled { color: var(--lab-muted); border-color: var(--lab-line); box-shadow: none; text-shadow: none; cursor: default; }
  .btn[aria-pressed='true'] { color: var(--lab-accent); border-color: var(--lab-accent); }

  .stats { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, auto) minmax(0, 1fr); gap: .25rem .9rem; align-items: end; padding: 0 .25rem .1rem; }
  dt { color: var(--lab-muted); font-size: .56rem; letter-spacing: .14em; text-transform: uppercase; }
  dd { display: flex; align-items: center; gap: .4rem; color: var(--lab-ink); font-family: var(--lab-display-font); font-size: 1.05rem; line-height: 1.25; font-variant-numeric: tabular-nums; text-shadow: var(--lab-text-glow); }
  dd small { color: var(--lab-muted); font-size: .7em; text-shadow: none; }
  .meter { flex: 1; min-width: 2.5rem; height: .5rem; border: 1px solid var(--lab-line-strong); border-radius: 2px; background: var(--lab-inset); overflow: hidden; }
  .meter span { display: block; height: 100%; background: var(--lab-accent); transition: width .2s; }
  .core.low .meter span { background: var(--lab-hot); }
  .core.low dd { color: var(--lab-hot); text-shadow: none; }

  .dock { grid-row: 3; display: flex; flex-direction: column; gap: .5rem; padding: .5rem; }
  .controls { order: 3; display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: .4rem; }
  .start { white-space: nowrap; }
  .palette { order: 2; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .3rem; }
  .pick { position: relative; flex-direction: column; gap: .15rem; min-height: 56px; padding: .35rem .15rem; letter-spacing: .04em; }
  .pick .name { font-size: .62rem; }
  .pick .role { display: none; color: var(--lab-muted); font-size: .56rem; text-transform: none; letter-spacing: .02em; }
  .pick .cost { color: var(--lab-accent); font-family: var(--lab-display-font); font-size: .8rem; line-height: 1; font-variant-numeric: tabular-nums; }
  .pick.poor .cost { color: var(--lab-hot); }
  .pick.active { border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent), var(--lab-glow); }
  .swatch { flex: none; width: .65rem; height: .65rem; border-radius: 2px; background: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-line); }
  .type-core { background: var(--lab-ink); }
  .type-rivet { background: var(--lab-accent); }
  .type-lance { background: var(--lab-season-autumn); }
  .type-mire { background: var(--lab-season-winter); }
  .type-dynamo { background: var(--lab-season-summer); }
  .type-mender { background: var(--lab-season-spring); }

  /* A fixed height keeps the dock, and with it the camera fit, from jumping as the text changes. */
  .detail { order: 1; display: flex; align-items: center; gap: .5rem; height: 3.6rem; padding: 0 .25rem; overflow: hidden; }
  .detail-text { flex: 1; min-width: 0; }
  .detail-title { display: flex; align-items: center; gap: .4rem; color: var(--lab-ink); font-family: var(--lab-display-font); font-size: .8rem; line-height: 1.3; }
  .detail-title .hp { margin-left: auto; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .62rem; }
  .detail-line { color: var(--lab-muted); font-size: .62rem; line-height: 1.45; letter-spacing: .03em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .detail-line.warn, .notice { color: var(--lab-hot); }
  .notice { font-size: .7rem; letter-spacing: .06em; }
  .spice { color: var(--lab-muted); font-style: italic; }
  .sell { color: var(--lab-hot); border-color: var(--lab-hot); white-space: nowrap; }

  .paused { grid-row: 2; place-self: center; padding: .4rem 1rem; border: 1px solid var(--lab-line-strong); border-radius: .4rem; background: var(--lab-surface); color: var(--lab-accent); font-family: var(--lab-display-font); font-size: 1.1rem; letter-spacing: .1em; pointer-events: none; }

  .veil { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; padding: calc(var(--hx-top) + 1rem) 1rem 1rem; overflow-y: auto; background: #d3e2e5b3; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
  :global(.dark) .veil { background: #070d11b8; }
  .veil.clear { background: #d3e2e566; backdrop-filter: none; -webkit-backdrop-filter: none; }
  :global(.dark) .veil.clear { background: #070d1166; }
  .dialog { width: min(100%, 26rem); }
  .dialog.small { width: min(100%, 22rem); }
  .dialog.wide { width: min(100%, 52rem); }
  .dialog :global(.hud-body) { display: flex; flex-direction: column; gap: .8rem; }
  .title { color: var(--lab-ink); font-family: var(--lab-display-font); font-size: clamp(1.4rem, 5vw, 2rem); line-height: 1.1; text-shadow: var(--lab-text-glow); }
  .title.hot { color: var(--lab-hot); text-shadow: none; }
  .body { color: var(--lab-muted); font-size: .74rem; line-height: 1.6; }
  .rules { display: grid; gap: .3rem; color: var(--lab-ink); font-size: .7rem; line-height: 1.5; list-style: none; }
  .rules li { padding-left: .9rem; text-indent: -.9rem; }
  .rules li::before { content: '+ '; color: var(--lab-accent); }
  .cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: .6rem; }
  .row { display: flex; flex-wrap: wrap; gap: .5rem; }
  .row .btn { flex: 1; }

  @media (min-width: 640px) {
    .cards:not(.one) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }

  /* Wide screens: the dock becomes a column on the right, with the stats on one row. */
  @media (min-width: 820px) {
    .hexfall { --hx-gap: .9rem; }
    .hud-layer { grid-template-columns: 1fr 17.5rem; grid-template-rows: auto 1fr; }
    .top { grid-column: 1 / -1; grid-template-columns: auto auto 1fr auto; gap: 1rem; padding: .5rem .7rem; }
    h1 { font-size: 1.15rem; text-align: left; }
    .theme { order: 4; }
    .stats { grid-column: auto; grid-template-columns: repeat(3, auto) minmax(8rem, 16rem); gap: 1.6rem; justify-content: start; padding: 0 0 0 .6rem; }
    .dock { grid-column: 2; grid-row: 2; align-self: start; max-height: 100%; overflow-y: auto; gap: .7rem; padding: .7rem; }
    .controls { order: 1; }
    .palette { order: 2; grid-template-columns: minmax(0, 1fr); }
    .detail { order: 3; height: 5.6rem; align-items: flex-start; flex-wrap: wrap; padding-top: .3rem; }
    .detail-line { white-space: normal; }
    .pick { flex-direction: row; justify-content: flex-start; gap: .6rem; min-height: 48px; padding: .4rem .7rem; }
    .pick .name { font-size: .7rem; }
    .pick .role { display: inline; }
    .pick .cost { margin-left: auto; font-size: .9rem; }
    .paused { grid-column: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .chip, .btn, .pick, .meter span { transition: none; }
  }
</style>
