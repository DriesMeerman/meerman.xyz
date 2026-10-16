<script>
  // Lazy-loads one widget so an embed only downloads the code it shows (the orb pulls in three.js).
  import HudPanel from './HudPanel.svelte';

  /**
   * @type {{
   *   widget: import('./registry.js').WidgetMeta,
   *   options: Record<string, string>,
   *   clock: import('./clock.svelte.js').LabClock,
   *   embedded?: boolean,
   *   frame?: boolean,
   *   code?: string
   * }}
   */
  let { widget, options, clock, embedded = false, frame = true, code = '' } = $props();
</script>

<HudPanel label={widget.title} {code} {frame} class="widget-{widget.id}">
  {#await widget.load()}
    <p class="state">Booting {widget.title.toLowerCase()}…</p>
  {:then module}
    <module.default {options} {clock} {embedded} />
  {:catch}
    <p class="state">Could not load {widget.title.toLowerCase()}.</p>
  {/await}
</HudPanel>

<style>
  .state { display: grid; place-items: center; min-height: 6rem; color: var(--lab-muted); font-family: var(--lab-meta-font); font-size: .65rem; letter-spacing: .12em; text-transform: uppercase; }
</style>
