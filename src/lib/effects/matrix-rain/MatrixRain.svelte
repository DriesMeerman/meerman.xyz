<script>
  import { RainField } from './field.js';

  /**
   * A window onto matrix rain. Fills its positioned parent and never takes pointer events; give the parent's
   * content `position: relative` (or a z-index) so it sits above the rain.
   * Pass a shared `field` so several windows show one continuous rain; without one, it rains inside this element only.
   * `sticky` keeps the canvas viewport-sized and pinned while a tall parent scrolls past, instead of covering all of it.
   * Colour comes from `--matrix-rain-color` (falls back to the text colour), strength from `--matrix-rain-opacity`.
   * @type {{ field?: import('./field.js').RainField, sticky?: boolean, class?: string }}
   */
  let { field, sticky = false, class: className = '' } = $props();

  /** @type {HTMLCanvasElement} */
  let canvas;

  $effect(() => {
    const target = field ?? new RainField({}, { local: true });
    const detach = target.attach(canvas);
    return () => {
      detach();
      if (!field) target.destroy();
    };
  });
</script>

<div class="matrix-rain-layer {className}" aria-hidden="true">
  <canvas bind:this={canvas} class="matrix-rain" class:sticky width="0" height="0"></canvas>
</div>

<style>
  .matrix-rain-layer {
    position: absolute;
    inset: 0;
    overflow: clip;
    border-radius: inherit;
    pointer-events: none;
  }
  .matrix-rain {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 1.2s ease;
  }
  .matrix-rain.sticky { position: sticky; inset: auto; top: 0; height: min(100%, 100vh); }
  /* The field adds `running` during a burst. */
  .matrix-rain:global(.running) { opacity: calc(var(--matrix-rain-opacity, 0.2) * var(--matrix-rain-strength, 1)); }
</style>
