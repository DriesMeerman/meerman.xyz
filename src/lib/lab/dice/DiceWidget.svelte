<script>
  // Holographic dice roller. The die lives in a lazily loaded three.js scene; this component owns the
  // session state (in memory only), the guess flow, and the options panel.
  import { onMount } from 'svelte';
  import { rollFair, sidesFromOptions, clampSides } from './random.js';

  /** @type {import('../registry.js').WidgetProps} */
  let { options, embedded } = $props();

  const PRESETS = [4, 6, 8, 10, 12, 20, 100];
  const NAMES = /** @type {Record<number, string>} */ ({ 4: 'Tetra', 6: 'Hexa', 8: 'Octa', 10: 'Trapezo', 12: 'Dodeca', 20: 'Icosa' });

  /** @typedef {{ id: number, value: number, sides: number, guess: number | null }} Throw */

  // Writable deriveds: the URL sets the starting point, the panel can override it in memory.
  let sides = $derived(sidesFromOptions(options));
  let guessMode = $derived(options.guess === 'on');
  const showPanel = $derived(options.panel !== 'off');

  let phase = $state(/** @type {'ready' | 'rolling' | 'landed'} */ ('ready'));
  let result = $state(/** @type {number | null} */ (null));
  let guess = $state(1);
  let locked = $state(false);
  let outcome = $state(/** @type {'hit' | 'miss' | null} */ (null));
  let history = $state(/** @type {Throw[]} */ ([]));
  let throwCount = $state(0);
  let customInput = $state('');
  let flash = $state(0);

  /** @type {HTMLSpanElement | undefined} */
  let host = $state();
  /** @type {HTMLDivElement | undefined} */
  let root = $state();
  /** @type {Awaited<ReturnType<typeof import('./scene.js').createDiceScene>> | null} */
  let scene = $state.raw(null);
  let failed = $state(false);

  const name = $derived(NAMES[sides] ?? (sides % 2 === 0 && sides <= 20 && sides >= 4 ? 'Trapezo' : sides === 2 ? 'Coin' : 'Counter'));
  const isPreset = $derived(PRESETS.includes(sides));
  const status = $derived(
    phase === 'rolling' ? 'Rolling' : phase === 'landed' ? (outcome === 'hit' ? 'Hit' : outcome === 'miss' ? 'Miss' : 'Result') : guessMode && !locked ? 'Guess' : locked ? 'Locked' : 'Ready'
  );
  const action = $derived(phase === 'rolling' ? 'Rolling' : guessMode && !locked ? `Lock ${guess}` : 'Throw');
  const recent = $derived(history.slice(0, 5));
  const sum = $derived(recent.reduce((total, entry) => total + entry.value, 0));
  const hits = $derived(history.filter((entry) => entry.guess !== null && entry.guess === entry.value).length);
  const guessed = $derived(history.filter((entry) => entry.guess !== null).length);
  const announcement = $derived(
    phase === 'landed' && result !== null
      ? `Rolled ${result} on a d${sides}.${outcome ? ` ${outcome === 'hit' ? 'Hit' : 'Miss'}, you guessed ${guess}. Odds 1 in ${sides}.` : ''}`
      : ''
  );

  // Keep the guess inside the die's range when the die changes.
  $effect(() => {
    if (guess > sides) guess = sides;
  });

  function readColors() {
    const style = getComputedStyle(root ?? document.documentElement);
    const font = document.fonts?.check('48px "Bruno Ace"') ? '"Bruno Ace", sans-serif' : 'ui-monospace, Menlo, monospace';
    return {
      accent: style.getPropertyValue('--lab-accent').trim() || '#6ff1f5',
      hot: style.getPropertyValue('--lab-hot').trim() || '#ff6fae',
      ink: style.getPropertyValue('--lab-ink').trim() || '#17303b',
      dark: document.documentElement.classList.contains('dark'),
      font
    };
  }

  onMount(() => {
    let cancelled = false;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    /** @type {(() => void)[]} */
    const cleanups = [];

    (async () => {
      try {
        await document.fonts?.load('48px "Bruno Ace"', '0123456789').catch(() => {});
        const { createDiceScene } = await import('./scene.js');
        if (cancelled || !host) return;
        const created = createDiceScene(host, { colors: readColors(), reducedMotion: motion.matches });
        scene = created;
        cleanups.push(() => created.dispose());

        const onMotion = () => created.setReducedMotion(motion.matches);
        motion.addEventListener('change', onMotion);
        cleanups.push(() => motion.removeEventListener('change', onMotion));

        // Repaint when the site toggles dark mode on <html>.
        const themeObserver = new MutationObserver(() => created.setColors(readColors()));
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        cleanups.push(() => themeObserver.disconnect());

        // Stop rendering while offscreen.
        const visibility = new IntersectionObserver(([entry]) => created.setActive(entry.isIntersecting));
        if (root) visibility.observe(root);
        cleanups.push(() => visibility.disconnect());
      } catch {
        failed = true;
      }
    })();

    return () => {
      cancelled = true;
      for (const cleanup of cleanups.reverse()) cleanup();
      scene = null;
    };
  });

  $effect(() => {
    scene?.setSides(sides);
  });

  /** @param {number} next */
  function chooseSides(next) {
    const value = clampSides(next);
    if (!value || phase === 'rolling' || value === sides) return;
    sides = value;
    resetRound();
  }

  function resetRound() {
    phase = 'ready';
    result = null;
    outcome = null;
    locked = false;
  }

  function onStage() {
    if (phase === 'rolling') return;
    if (guessMode && !locked) {
      locked = true;
      if (phase === 'landed') {
        result = null;
        outcome = null;
        phase = 'ready';
      }
      return;
    }
    throwDie();
  }

  async function throwDie() {
    if (phase === 'rolling' || (guessMode && !locked)) return;
    const value = rollFair(sides);
    const rolledSides = sides;
    const lockedGuess = guessMode ? guess : null;
    phase = 'rolling';
    result = null;
    outcome = null;
    await (scene?.roll(value) ?? Promise.resolve());
    if (rolledSides !== sides) return;
    result = value;
    phase = 'landed';
    throwCount += 1;
    history = [{ id: throwCount, value, sides: rolledSides, guess: lockedGuess }, ...history].slice(0, 40);
    if (lockedGuess !== null) {
      outcome = lockedGuess === value ? 'hit' : 'miss';
      scene?.effect(outcome);
      flash += 1;
      locked = false;
    }
  }

  function toggleGuess() {
    if (phase === 'rolling') return;
    guessMode = !guessMode;
    resetRound();
  }

  /** @param {number} delta */
  function stepGuess(delta) {
    if (locked) return;
    guess = ((guess - 1 + delta + sides) % sides) + 1;
  }

  /** @param {Event} event */
  function onGuessInput(event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget);
    const value = Number.parseInt(input.value, 10);
    if (Number.isFinite(value)) guess = Math.min(sides, Math.max(1, value));
  }

  /** @param {SubmitEvent} event */
  function onCustom(event) {
    event.preventDefault();
    chooseSides(Number.parseInt(customInput, 10));
    customInput = '';
  }

  function clearHistory() {
    history = [];
  }
</script>

<div class="dice-box" class:embedded bind:this={root}>
<div class="dice" class:with-panel={showPanel}>
  <div class="deck">
    <button
      type="button"
      class="stage"
      class:hit={outcome === 'hit'}
      class:miss={outcome === 'miss'}
      onclick={onStage}
      aria-disabled={phase === 'rolling'}
      aria-label={guessMode && !locked ? `Lock in guess ${guess} for the d${sides}` : `Throw the d${sides}`}
    >
      <span class="host" bind:this={host}></span>
      <span class="tag tag-top">
        <span class="tag-die">D{sides}</span><span class="tag-name">{name}</span>
      </span>
      <span class="tag tag-odds">P 1/{sides}</span>
      {#if failed}<span class="fallback">3D unavailable</span>{/if}
      {#key flash}
        <span class="readout" class:rolling={phase === 'rolling'}>
          <span class="value">{result ?? '--'}</span>
          <span class="slash" aria-hidden="true">/</span>
          <span class="status">{status}</span>
          {#if outcome}<span class="odds">1 in {sides}</span>{/if}
        </span>
        {#if outcome === 'hit'}<span class="burst" aria-hidden="true"></span>{/if}
      {/key}
      <span class="cta" aria-hidden="true">
        <span class="cta-key">{phase === 'rolling' ? '...' : 'SPC'}</span>{action}
      </span>
    </button>

    {#if guessMode}
      <div class="guess" class:locked>
        <span class="guess-label">Guess</span>
        {#if sides <= 12}
          <div class="chips" role="group" aria-label="Your guess">
            {#each { length: sides }, index (index)}
              <button
                type="button"
                aria-pressed={guess === index + 1}
                class="chip"
                class:on={guess === index + 1}
                disabled={locked || phase === 'rolling'}
                onclick={() => (guess = index + 1)}>{index + 1}</button
              >
            {/each}
          </div>
        {/if}
        <div class="stepper" class:has-chips={sides <= 12}>
          <button type="button" class="step" aria-label="Lower guess" disabled={locked || phase === 'rolling'} onclick={() => stepGuess(-1)}>-</button>
          <input
            class="guess-input"
            type="number"
            min="1"
            max={sides}
            value={guess}
            aria-label="Your guess, 1 to {sides}"
            disabled={locked || phase === 'rolling'}
            onchange={onGuessInput}
          />
          <button type="button" class="step" aria-label="Raise guess" disabled={locked || phase === 'rolling'} onclick={() => stepGuess(1)}>+</button>
        </div>
        <button type="button" class="lock" aria-pressed={locked} disabled={phase === 'rolling'} onclick={() => (locked = !locked)}>
          {locked ? 'Locked' : 'Lock'}
        </button>
      </div>
    {/if}
  </div>

  {#if showPanel}
    <aside class="panel" aria-label="Dice options">
      <h3 class="panel-title"><span aria-hidden="true">//</span> Dice options</h3>

      <div class="group">
        <span class="label" id="dice-type-label">Die</span>
        <div class="types" role="group" aria-labelledby="dice-type-label">
          {#each PRESETS as preset (preset)}
            <button type="button" class="type" class:on={sides === preset} aria-pressed={sides === preset} disabled={phase === 'rolling'} onclick={() => chooseSides(preset)}>d{preset}</button>
          {/each}
          <form class="custom" class:on={!isPreset} onsubmit={onCustom}>
            <span aria-hidden="true">d</span>
            <input type="number" min="2" max="999" inputmode="numeric" placeholder={isPreset ? 'N' : String(sides)} aria-label="Custom side count" bind:value={customInput} disabled={phase === 'rolling'} />
          </form>
        </div>
      </div>

      <div class="group row">
        <span class="label">Guess mode</span>
        <button type="button" class="switch" role="switch" aria-checked={guessMode} disabled={phase === 'rolling'} onclick={toggleGuess}>
          <span class="knob" aria-hidden="true"></span><span class="switch-text">{guessMode ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div class="group stats">
        <div class="stat"><span class="label">Throws</span><span class="num">{throwCount}</span></div>
        <div class="stat"><span class="label">Sum last {Math.max(recent.length, 1)}</span><span class="num">{recent.length ? sum : '--'}</span></div>
        {#if guessed}
          <div class="stat"><span class="label">Hits</span><span class="num">{hits}/{guessed}</span></div>
        {/if}
      </div>

      <div class="group history">
        <div class="history-head">
          <span class="label">Log</span>
          {#if history.length}<button type="button" class="clear" onclick={clearHistory}>Clear</button>{/if}
        </div>
        {#if history.length}
          <ol class="log">
            {#each history.slice(0, 12) as entry (entry.id)}
              <li
                class="entry"
                class:hit={entry.guess !== null && entry.guess === entry.value}
                class:miss={entry.guess !== null && entry.guess !== entry.value}
                title="Throw {entry.id}: {entry.value} on d{entry.sides}{entry.guess !== null ? `, guessed ${entry.guess}` : ''}"
              >
                <span class="entry-value">{entry.value}</span><span class="entry-die">d{entry.sides}</span>
              </li>
            {/each}
          </ol>
        {:else}
          <p class="empty">No throws yet this session.</p>
        {/if}
      </div>
    </aside>
  {/if}

  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
</div>

<style>
  .dice-box { height: 100%; min-width: 0; }
  /* Embeds have a real height, so the widget can also respond to it. */
  .dice-box.embedded { container: dicebox / size; }
  .dice {
    --dice-gap: .75rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--dice-gap);
    height: 100%;
    min-height: 15rem;
    font-family: var(--lab-meta-font);
  }
  .dice.with-panel { grid-template-columns: minmax(0, 1fr) minmax(10.5rem, 13rem); }

  .deck { display: flex; flex-direction: column; gap: .5rem; min-width: 0; min-height: 0; }

  .stage {
    position: relative;
    flex: 1;
    min-height: 13rem;
    width: 100%;
    padding: 0;
    border: 1px solid var(--lab-line);
    border-radius: calc(var(--lab-radius) - .35rem);
    background:
      radial-gradient(ellipse at 50% 72%, var(--lab-accent-soft), transparent 62%),
      var(--lab-inset);
    color: inherit;
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    isolation: isolate;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .stage:hover:not([aria-disabled='true']) { border-color: var(--lab-line-strong); }
  .stage:focus-visible { outline: none; border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent), var(--lab-glow); }
  .stage[aria-disabled='true'] { cursor: progress; }
  .stage.hit { border-color: var(--lab-accent); box-shadow: inset 0 0 28px var(--lab-accent-soft); }
  .stage.miss { border-color: color-mix(in srgb, var(--lab-hot) 60%, transparent); }
  .host { position: absolute; inset: 0; display: block; }

  .tag {
    position: absolute;
    top: .55rem;
    z-index: 1;
    color: var(--lab-muted);
    font-size: .58rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    pointer-events: none;
  }
  .tag-top { left: .7rem; display: flex; gap: .45rem; align-items: baseline; }
  .tag-die { color: var(--lab-accent); font-family: var(--lab-display-font); font-size: .78rem; letter-spacing: .06em; text-shadow: var(--lab-text-glow); }
  .tag-odds { right: .7rem; font-variant-numeric: tabular-nums; }
  .fallback { position: absolute; inset: 0; display: grid; place-items: center; color: var(--lab-muted); font-size: .65rem; letter-spacing: .12em; text-transform: uppercase; }

  .readout {
    position: absolute;
    left: .7rem;
    bottom: .55rem;
    z-index: 1;
    display: flex;
    align-items: baseline;
    gap: .4rem;
    pointer-events: none;
    text-transform: uppercase;
  }
  .value {
    min-width: 1.4ch;
    color: var(--lab-ink);
    font-family: var(--lab-display-font);
    font-size: 1.7rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-shadow: var(--lab-text-glow);
  }
  .slash { color: var(--lab-line-strong); font-size: 1rem; }
  .status { color: var(--lab-accent); font-size: .66rem; letter-spacing: .18em; text-shadow: var(--lab-text-glow); }
  .odds { color: var(--lab-muted); font-size: .58rem; letter-spacing: .12em; }
  .readout.rolling .status { animation: blink .5s steps(2, start) infinite; }
  .hit .readout .status { color: var(--lab-accent); }
  .miss .readout .value, .miss .readout .status { color: var(--lab-hot); text-shadow: 0 0 10px color-mix(in srgb, var(--lab-hot) 45%, transparent); }
  .miss .readout { animation: glitch .55s steps(1, end) 1; }
  .hit .readout .value { animation: pop .6s cubic-bezier(.2, 1.6, .4, 1) 1; }

  .burst {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 1rem;
    height: 1rem;
    margin: -.5rem 0 0 -.5rem;
    border: 2px solid var(--lab-accent);
    border-radius: 50%;
    box-shadow: 0 0 18px var(--lab-accent);
    opacity: 0;
    pointer-events: none;
    animation: burst .9s ease-out 1;
  }

  .cta {
    position: absolute;
    right: .6rem;
    bottom: .55rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .32rem .6rem .32rem .35rem;
    border: 1px solid var(--lab-line-strong);
    border-radius: .4rem;
    background: color-mix(in srgb, var(--lab-accent) 10%, transparent);
    color: var(--lab-accent);
    font-size: .64rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    text-shadow: var(--lab-text-glow);
    pointer-events: none;
    transition: background .2s ease;
  }
  .stage:hover:not([aria-disabled='true']) .cta, .stage:focus-visible .cta { background: color-mix(in srgb, var(--lab-accent) 22%, transparent); }
  .stage[aria-disabled='true'] .cta { opacity: .6; }
  .cta-key { padding: .1rem .3rem; border: 1px solid var(--lab-line); border-radius: .25rem; color: var(--lab-muted); font-size: .5rem; letter-spacing: .1em; }

  .guess {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .4rem .6rem;
    padding: .4rem .5rem;
    border: 1px dashed var(--lab-line);
    border-radius: .55rem;
  }
  .guess.locked { border-style: solid; border-color: var(--lab-line-strong); }
  .guess-label, .label { color: var(--lab-muted); font-size: .58rem; letter-spacing: .16em; text-transform: uppercase; }
  .chips { display: flex; flex-wrap: wrap; gap: .2rem; flex: 1; min-width: 0; }
  .chips .chip { min-width: 1.5rem; height: 1.5rem; padding: 0 .25rem; }
  .stepper.has-chips { display: none; }
  .chip, .step, .lock, .type, .clear {
    min-width: 1.7rem;
    height: 1.7rem;
    padding: 0 .4rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    background: transparent;
    color: var(--lab-ink);
    font: inherit;
    font-size: .68rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: border-color .15s ease, background .15s ease, color .15s ease;
  }
  .chip:hover:not(:disabled), .step:hover:not(:disabled), .lock:hover:not(:disabled), .type:hover:not(:disabled), .clear:hover { border-color: var(--lab-line-strong); }
  .chip:focus-visible, .step:focus-visible, .lock:focus-visible, .type:focus-visible, .clear:focus-visible, .switch:focus-visible, .guess-input:focus-visible, .custom input:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 1px; }
  .chip.on, .type.on { border-color: var(--lab-accent); background: var(--lab-accent-soft); color: var(--lab-accent); text-shadow: var(--lab-text-glow); }
  .chip:disabled:not(.on) { opacity: .45; cursor: default; }
  .stepper { display: flex; align-items: center; gap: .25rem; flex: 1; }
  .guess-input, .custom input {
    width: 3.6rem;
    height: 1.7rem;
    padding: 0 .4rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    background: var(--lab-inset);
    color: var(--lab-ink);
    font: inherit;
    font-size: .72rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .guess-input::-webkit-inner-spin-button, .custom input::-webkit-inner-spin-button { appearance: none; margin: 0; }
  .lock { margin-left: auto; padding: 0 .7rem; letter-spacing: .16em; text-transform: uppercase; font-size: .6rem; color: var(--lab-accent); border-color: var(--lab-line-strong); }
  .lock[aria-pressed='true'] { background: var(--lab-accent); color: var(--lab-inset); border-color: var(--lab-accent); }
  :global(.dark) .lock[aria-pressed='true'] { color: #06121a; }

  .panel {
    display: flex;
    flex-direction: column;
    gap: .75rem;
    min-width: 0;
    padding: .7rem .75rem;
    border: 1px solid var(--lab-line);
    border-radius: calc(var(--lab-radius) - .35rem);
    background: color-mix(in srgb, var(--lab-inset) 60%, transparent);
    overflow: auto;
  }
  .panel-title { color: var(--lab-ink); font-size: .62rem; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; }
  .panel-title span { color: var(--lab-accent); }
  .group { display: flex; flex-direction: column; gap: .35rem; }
  .group.row { flex-direction: row; align-items: center; justify-content: space-between; }
  .types { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .25rem; }
  .type { min-width: 0; padding: 0; }
  .custom { display: flex; align-items: center; gap: .1rem; height: 1.7rem; padding-left: .35rem; border: 1px solid var(--lab-line); border-radius: .35rem; color: var(--lab-muted); font-size: .68rem; }
  .custom.on { border-color: var(--lab-accent); color: var(--lab-accent); }
  .custom input { flex: 1; min-width: 0; width: 100%; height: 100%; padding: 0 .2rem; border: 0; background: transparent; text-align: left; }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    height: 1.4rem;
    padding: 0 .5rem 0 .2rem;
    border: 1px solid var(--lab-line);
    border-radius: 999px;
    background: transparent;
    color: var(--lab-muted);
    font: inherit;
    font-size: .58rem;
    letter-spacing: .16em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .knob { width: .8rem; height: .8rem; border: 1px solid var(--lab-line-strong); border-radius: 50%; transition: transform .2s ease, background .2s ease; }
  .switch[aria-checked='true'] { border-color: var(--lab-accent); color: var(--lab-accent); }
  .switch[aria-checked='true'] .knob { background: var(--lab-accent); box-shadow: 0 0 8px var(--lab-accent); }

  .stats { flex-direction: row; gap: .9rem; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: .1rem; }
  .num { color: var(--lab-ink); font-family: var(--lab-display-font); font-size: 1rem; font-variant-numeric: tabular-nums; }

  .history { min-height: 0; }
  .history-head { display: flex; align-items: center; justify-content: space-between; }
  .clear { height: 1.3rem; min-width: 0; padding: 0 .4rem; color: var(--lab-muted); font-size: .54rem; letter-spacing: .14em; text-transform: uppercase; }
  .log { display: flex; flex-wrap: wrap; gap: .25rem; margin: 0; padding: 0; list-style: none; }
  .entry {
    display: inline-flex;
    align-items: baseline;
    gap: .2rem;
    padding: .15rem .35rem;
    border: 1px solid var(--lab-line);
    border-radius: .3rem;
    font-variant-numeric: tabular-nums;
  }
  .entry:first-child { border-color: var(--lab-line-strong); }
  .entry-value { color: var(--lab-ink); font-size: .7rem; }
  .entry-die { color: var(--lab-muted); font-size: .5rem; }
  .entry.hit { border-color: var(--lab-accent); }
  .entry.hit .entry-value { color: var(--lab-accent); }
  .entry.miss .entry-value { color: var(--lab-hot); }
  .empty { color: var(--lab-muted); font-size: .62rem; line-height: 1.5; }

  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

  /* Narrow: the panel moves under the die and turns into a compact strip. */
  @container (max-width: 440px) {
    .dice.with-panel { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(11rem, 1fr) auto; }
    .panel { flex-direction: row; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; padding: .5rem .6rem; overflow: visible; }
    .panel-title { display: none; }
    .group:first-of-type { flex-basis: 100%; }
    .group:first-of-type > .label { display: none; }
    .types { grid-template-columns: repeat(8, minmax(0, 1fr)); }
    .type, .custom { height: 1.55rem; font-size: .62rem; }
    .history { flex-basis: 100%; }
    .chips { display: none; }
    .stepper.has-chips { display: flex; }
  }
  @container (max-width: 360px) {
    .tag-name, .readout .odds { display: none; }
    .value { font-size: 1.35rem; }
    .cta-key { display: none; }
  }
  /* Very narrow: just the die. */
  @container (max-width: 260px) {
    .panel { display: none; }
    .tag-odds { display: none; }
  }
  /* Short embeds: keep the die big and trim the panel to its controls. */
  @container dicebox (max-height: 420px) {
    .dice { min-height: 0; }
    .stage { min-height: 8rem; }
  }
  @container dicebox (max-height: 280px) {
    .history { display: none; }
  }
  @container dicebox (max-height: 420px) and (max-width: 440px) {
    .stats, .history { display: none; }
    .dice.with-panel { grid-template-rows: minmax(0, 1fr) auto; }
  }
  @container dicebox (max-height: 240px) and (max-width: 440px) {
    .panel { display: none; }
  }

  @keyframes blink { 50% { opacity: .35; } }
  @keyframes pop { 0% { transform: scale(.6); } 100% { transform: scale(1); } }
  @keyframes burst {
    0% { opacity: .9; transform: scale(1); }
    100% { opacity: 0; transform: scale(18); }
  }
  @keyframes glitch {
    0% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
    15% { transform: translate(-3px, 1px); clip-path: inset(10% 0 45% 0); }
    30% { transform: translate(3px, -1px); clip-path: inset(50% 0 5% 0); }
    45% { transform: translate(-2px, 0); clip-path: inset(0 0 0 0); filter: hue-rotate(40deg); }
    60% { transform: translate(2px, 1px); clip-path: inset(30% 0 20% 0); }
    80% { transform: translate(0, 0); clip-path: inset(0 0 0 0); filter: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .readout.rolling .status, .miss .readout, .hit .readout .value { animation: none; }
    .burst { display: none; }
    .knob, .stage, .cta { transition: none; }
  }
</style>
