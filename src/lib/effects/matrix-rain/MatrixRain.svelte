<script>
  import { RainField } from './field.js';

  /**
   * A window onto matrix rain. Fills its positioned parent and never takes pointer events.
   * Pass a shared `field` so several windows show one continuous rain; without one, it rains inside this canvas only.
   * Colour comes from `--matrix-rain-color` (falls back to the text colour), strength from `--matrix-rain-opacity`.
   * @type {{ field?: import('./field.js').RainField, class?: string }}
   */
  let { field, class: className = '' } = $props();

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

<canvas bind:this={canvas} class="matrix-rain {className}" aria-hidden="true" width="0" height="0"></canvas>

<style>
  .matrix-rain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 1.2s ease;
  }
  /* The field adds `running` during a burst. */
  .matrix-rain:global(.running) { opacity: calc(var(--matrix-rain-opacity, 0.2) * var(--matrix-rain-strength, 1)); }
</style>
