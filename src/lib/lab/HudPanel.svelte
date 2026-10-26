<script>
  import MatrixRain from '$lib/effects/matrix-rain/MatrixRain.svelte';
  import { getRainControl } from './rain.svelte.js';

  /**
   * Shared frame for lab widgets: corner brackets, a technical label row, and a faint grid.
   * @type {{ label?: string, code?: string, status?: string, frame?: boolean, class?: string, children: import('svelte').Snippet }}
   */
  let { label = '', code = '', status = '', frame = true, class: className = '', children } = $props();

  const rain = getRainControl();
</script>

<section class="hud {className}" class:frameless={!frame}>
  <!-- Frameless panels have no background of their own, so the rain stays out of them. -->
  {#if rain && frame}<MatrixRain field={rain.field} />{/if}
  {#if frame}
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
  {/if}
  {#if label || code || status}
    <header class="hud-head">
      {#if code}<span class="hud-code">{code}</span>{/if}
      {#if label}<span class="hud-label">{label}</span>{/if}
      {#if status}<span class="hud-status"><span class="pulse" aria-hidden="true"></span>{status}</span>{/if}
    </header>
  {/if}
  <div class="hud-body">{@render children()}</div>
</section>

<style>
  .hud {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
    padding: .9rem 1rem 1rem;
    border: 1px solid var(--lab-line);
    border-radius: var(--lab-radius);
    background:
      linear-gradient(var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      linear-gradient(90deg, var(--lab-grid) 1px, transparent 1px) 0 0 / 22px 22px,
      var(--lab-surface);
    box-shadow: var(--lab-glow), inset 0 1px 0 #ffffff14;
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    overflow: hidden;
    isolation: isolate;
  }
  .hud.frameless { border-color: transparent; background: transparent; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; padding: .25rem; }

  .corner { position: absolute; width: 14px; height: 14px; border-color: var(--lab-line-strong); border-style: solid; border-width: 0; pointer-events: none; z-index: 2; }
  .tl { top: 6px; left: 6px; border-top-width: 1px; border-left-width: 1px; border-top-left-radius: 4px; }
  .tr { top: 6px; right: 6px; border-top-width: 1px; border-right-width: 1px; border-top-right-radius: 4px; }
  .bl { bottom: 6px; left: 6px; border-bottom-width: 1px; border-left-width: 1px; border-bottom-left-radius: 4px; }
  .br { bottom: 6px; right: 6px; border-bottom-width: 1px; border-right-width: 1px; border-bottom-right-radius: 4px; }

  .hud-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: .6rem;
    margin: 0 .35rem .75rem;
    color: var(--lab-muted);
    font-family: var(--lab-meta-font);
    font-size: .62rem;
    line-height: 1.4;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .hud-code { color: var(--lab-accent); text-shadow: var(--lab-text-glow); }
  .hud-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hud-status { display: inline-flex; align-items: center; gap: .4rem; margin-left: auto; white-space: nowrap; }
  .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--lab-accent); box-shadow: 0 0 8px var(--lab-accent); animation: pulse 2.4s ease-in-out infinite; }
  .hud-body { position: relative; z-index: 1; flex: 1; min-height: 0; container-type: inline-size; }

  @keyframes pulse { 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
