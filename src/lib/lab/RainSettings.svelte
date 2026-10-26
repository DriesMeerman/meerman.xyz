<script>
  // Playground for the lab's matrix rain: controls on the left, a looping preview and the intensity curve on the right.
  // Changes apply live; the URL and embed links follow when a slider or point is released.
  import HudPanel from './HudPanel.svelte';
  import CurveEditor from './CurveEditor.svelte';
  import MatrixRain from '$lib/effects/matrix-rain/MatrixRain.svelte';
  import { RainField } from '$lib/effects/matrix-rain/field.js';
  import { getRainControl, rainPresets, rainSliders } from './rain.svelte.js';

  /** @type {{ active?: boolean }} true while the tab is on screen; the preview only runs then */
  let { active = false } = $props();

  const rain = /** @type {import('./rain.svelte.js').RainControl} */ (getRainControl());
  let copied = $state('');
  let run = $state(0);

  // The preview rains inside its own box and loops, whatever the page's on/off switch says.
  const preview = new RainField($state.snapshot(rain.settings), { local: true, loop: true });
  preview.auto = false;
  preview.onburst = () => (run += 1);
  $effect(() => preview.set($state.snapshot(rain.settings)));
  $effect(() => () => preview.destroy());

  /** @param {number} value @param {number} step */
  const format = (value, step) => (step < 1 ? value.toFixed(2).replace(/0$/, '') : String(value));

  /** @param {Partial<import('./rain.svelte.js').RainSettings>} settings */
  function apply(settings) {
    rain.update(settings);
    rain.commit();
  }

  function toggle() {
    rain.setEnabled(!rain.enabled);
    rain.commit();
  }

  function reset() {
    rain.reset();
    rain.commit();
  }

  async function copyDefaults() {
    const { curve, start, ...numbers } = $state.snapshot(rain.settings);
    const fields = [
      ...Object.entries(numbers).map(([key, value]) => `${key}: ${value}`),
      `start: '${start}'`,
      `curve: ${JSON.stringify(curve)}`
    ];
    try {
      await navigator.clipboard.writeText(`export const RAIN_DEFAULTS = { ${fields.join(', ')} };`);
      copied = 'done';
      setTimeout(() => copied === 'done' && (copied = ''), 1600);
    } catch {
      copied = 'error';
    }
  }
</script>

<HudPanel label="Matrix rain" code="MTX" status={rain.enabled ? 'armed' : 'off'} class="rain-settings">
  <div class="editor">
    <div class="controls">
      <div class="row">
        <button type="button" aria-pressed={rain.enabled} onclick={toggle}>{rain.enabled ? 'On' : 'Off'}</button>
        <button type="button" disabled={!rain.enabled} onclick={() => rain.rainNow()}>Rain now</button>
        <span class="note">The particles button in the menu also starts a burst.</span>
      </div>

      <div class="group">
        <span class="name">Preset</span>
        <div class="row">
          {#each rainPresets as preset (preset.id)}
            <button type="button" aria-pressed={rain.preset === preset.id} title={preset.hint} onclick={() => apply(preset.settings)}>{preset.label}</button>
          {/each}
        </div>
      </div>

      <div class="group">
        <span class="name">Drops start <code>rain-start</code></span>
        <div class="row">
          <button type="button" aria-pressed={rain.settings.start === 'scatter'} onclick={() => apply({ start: 'scatter' })}>Anywhere</button>
          <button type="button" aria-pressed={rain.settings.start === 'top'} onclick={() => apply({ start: 'top' })}>From the top</button>
        </div>
      </div>

      <div class="sliders">
        {#each rainSliders as slider (slider.key)}
          <label class="slider">
            <span class="name">{slider.label} <code>rain-{slider.key}</code></span>
            <span class="value">{format(rain.settings[slider.key], slider.step)}{slider.unit}</span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={rain.settings[slider.key]}
              oninput={(event) => rain.update({ [slider.key]: Number(event.currentTarget.value) })}
              onchange={() => rain.commit()}
            />
            <span class="hint">{slider.hint}</span>
          </label>
        {/each}
      </div>
    </div>

    <div class="stage">
      <div class="group">
        <div class="stage-head">
          <span class="name">Live preview</span>
          <button type="button" onclick={() => preview.burst()}>Replay</button>
        </div>
        <div class="preview">
          {#if active}<MatrixRain field={preview} />{/if}
        </div>
      </div>

      <div class="group">
        <span class="name">Intensity over the burst <code>rain-curve</code></span>
        <CurveEditor
          points={rain.settings.curve}
          seconds={rain.settings.length}
          {run}
          onchange={(curve) => rain.update({ curve })}
          oncommit={() => rain.commit()}
        />
        <span class="hint">Across is time through the burst, up is the share of the density that rains. Drag a point, or focus it and use the arrow keys (Shift for bigger steps).</span>
      </div>
    </div>
  </div>

  <div class="row footer">
    <button type="button" disabled={!rain.changed} onclick={reset}>Reset to defaults</button>
    <button type="button" onclick={copyDefaults}>{copied === 'done' ? 'Copied' : 'Copy as defaults'}</button>
    <span class="note">
      {copied === 'error'
        ? 'Clipboard is blocked here.'
        : 'Settings live in the page URL and in embed links. To make them the site default, paste over RAIN_DEFAULTS in src/lib/effects/matrix-rain/field.js.'}
    </span>
  </div>
</HudPanel>

<style>
  .editor { display: grid; gap: 1.5rem; margin: 0 .35rem; }
  @container (min-width: 760px) {
    .editor { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2rem; }
  }
  .controls, .stage { display: grid; gap: 1.1rem; align-content: start; }
  .group { display: grid; gap: .45rem; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
  .footer { margin: 1.25rem .35rem 0; padding-top: 1rem; border-top: 1px dashed var(--lab-line); }
  .note { color: var(--lab-muted); font-size: .75rem; line-height: 1.45; }

  button {
    padding: .4rem .65rem;
    border: 1px solid var(--lab-line);
    border-radius: .35rem;
    color: var(--lab-muted);
    background: var(--lab-inset);
    font-family: var(--lab-meta-font);
    font-size: .65rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color .15s, border-color .15s, box-shadow .15s, opacity .15s;
  }
  button:hover:not(:disabled) { color: var(--lab-ink); border-color: var(--lab-line-strong); }
  button[aria-pressed='true'] { color: var(--lab-accent); border-color: var(--lab-accent); box-shadow: 0 0 0 1px var(--lab-accent-soft), var(--lab-glow); }
  button:disabled { opacity: .45; cursor: default; }
  button:focus-visible, input:focus-visible { outline: 1px solid var(--lab-accent); outline-offset: 2px; }

  .name { color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .6rem; letter-spacing: .12em; text-transform: uppercase; }
  .name code { margin-left: .25rem; color: var(--lab-accent); text-transform: none; letter-spacing: 0; }
  .hint { color: var(--lab-muted); font-size: .72rem; line-height: 1.4; opacity: .85; }

  .sliders { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1rem 1.25rem; }
  .slider { display: grid; grid-template-columns: 1fr auto; gap: .35rem .5rem; align-content: start; }
  .value { color: var(--lab-accent); font-family: var(--lab-meta-font); font-size: .7rem; font-variant-numeric: tabular-nums; }
  .slider input { grid-column: 1 / -1; width: 100%; accent-color: var(--lab-accent); }
  .slider .hint { grid-column: 1 / -1; }

  .stage-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
  .preview {
    position: relative;
    height: 15rem;
    overflow: hidden;
    border: 1px solid var(--lab-line);
    border-radius: .5rem;
    background:
      linear-gradient(var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      linear-gradient(90deg, var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      var(--lab-inset);
  }
</style>
