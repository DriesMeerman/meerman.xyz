<script>
  import { onMount } from 'svelte';
  import { darkMode } from '$lib/state.svelte.js';
  import { formatReleaseDate, historyImage, historyViewport } from '$lib/data/siteHistory.js';

  /** @type {{ release: (typeof import('$lib/data/siteHistory.js').siteHistory)[number]; number: number }} */
  let { release, number } = $props();
  let selected = $state(0);
  let expanded = $state(false);
  let mounted = $state(false);
  /** @type {HTMLDialogElement} */
  let viewer;
  let slide = $derived(release.pages[selected]);
  let theme = $derived(release.originalTheme ? 'original' : mounted && darkMode.current ? 'dark' : 'light');
  let appearance = $derived(theme === 'original' ? 'original appearance' : `${theme} mode`);

  onMount(() => { mounted = true; });

  /** @param {number} direction */
  function step(direction) {
    selected = (selected + direction + release.pages.length) % release.pages.length;
  }

  /** @param {KeyboardEvent} event */
  function navigate(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }

  function openViewer() {
    expanded = true;
    viewer.showModal();
  }
</script>

<section id={`release-${release.version}`} class="release profile-section" aria-labelledby={`title-${release.version}`}>
  <div class="profile-section-head">
    <h2 id={`title-${release.version}`} class="profile-section-title">{String(number).padStart(2, '0')} / Version {release.version}</h2>
    {#if release.date}
      <time class="profile-section-count" datetime={release.date}>{formatReleaseDate(release.date)}</time>
    {:else}
      <span class="profile-section-count">Before v1</span>
    {/if}
  </div>

  <div class="release-card profile-panel">
    <header class="release-intro">
      <div class="chapter"><span aria-hidden="true">{String(number).padStart(2, '0')}</span><h3>{release.title}</h3></div>
      <ul class="highlights" aria-label={`Highlights of version ${release.version}`}>
        {#each release.highlights as highlight (highlight)}<li>{highlight}</li>{/each}
      </ul>
    </header>

    <div class="carousel" role="group" aria-roledescription={release.pages.length > 1 ? 'carousel' : 'snapshot'} aria-label={`Pages from version ${release.version}`}>
      <div class="browser-bar">
        <span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="address">{release.sourceUrl ? new URL(release.sourceUrl).hostname : 'meerman.xyz'}{slide.path}</span>
        <span class="mode">{theme}</span>
      </div>
      <button class="screenshot" type="button" onclick={openViewer} onkeydown={navigate} aria-label={`Enlarge ${slide.label} screenshot from version ${release.version}`}>
        <img src={historyImage(release.version, slide.id, theme)} alt={`${slide.label} in version ${release.version}, ${appearance}`} width={historyViewport.width} height={historyViewport.height} loading="lazy" decoding="async" />
        <span class="enlarge"><span aria-hidden="true">⤢</span> Explore full page</span>
      </button>
      <div class="carousel-controls">
        <p class="slide-status" aria-live="polite" aria-atomic="true"><strong>{slide.label}</strong><span>{String(selected + 1).padStart(2, '0')} / {String(release.pages.length).padStart(2, '0')}</span></p>
        {#if release.pages.length > 1}
          <div class="arrows">
            <button type="button" onclick={() => step(-1)} onkeydown={navigate} aria-label={`Previous page in version ${release.version}`}><span aria-hidden="true">←</span></button>
            <button type="button" onclick={() => step(1)} onkeydown={navigate} aria-label={`Next page in version ${release.version}`}><span aria-hidden="true">→</span></button>
          </div>
        {/if}
      </div>
      {#if release.pages.length > 1}
        <div class="page-picker" role="group" aria-label={`Choose a page from version ${release.version}`}>
          {#each release.pages as page, index (page.id)}
            <button type="button" aria-pressed={selected === index} onclick={() => selected = index} onkeydown={navigate}>{page.label}</button>
          {/each}
        </div>
      {/if}
    </div>
    {#if release.revision}
      <footer class="release-footer"><a href={`https://github.com/DriesMeerman/meerman.xyz/tree/${release.version}`} target="_blank" rel="noopener noreferrer">View release source <span aria-hidden="true">↗</span></a></footer>
    {/if}
  </div>
</section>

<dialog {@attach (node) => { viewer = node; }} class="profile-theme" aria-labelledby={`viewer-${release.version}`} onclose={() => expanded = false}>
  <div class="viewer-bar">
    <h2 id={`viewer-${release.version}`}>{slide.label} <span>/ v{release.version} / {theme}</span></h2>
    <button type="button" onclick={() => viewer.close()} aria-label="Close screenshot">Close <span aria-hidden="true">×</span></button>
  </div>
  {#if expanded}
    <div class="full-screenshot"><img src={historyImage(release.version, slide.id, theme, true)} alt={`Full ${slide.label} page in version ${release.version}, ${appearance}`} width={historyViewport.width} /></div>
  {/if}
</dialog>

<style>
  .release { scroll-margin-top: 1.5rem; }
  .release-card { overflow: hidden; }
  .release-intro { padding: 1.6rem; }
  .chapter { display: flex; gap: 1rem; align-items: center; }
  .chapter > span { color: var(--profile-accent); opacity: .55; font-family: var(--profile-display-font); font-size: 1.9rem; }
  h3 { margin: 0; font-family: var(--profile-display-font); font-size: clamp(.95rem, 2vw, 1.35rem); line-height: 1.6; }
  .highlights { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; margin: 1rem 0 0; padding: 0; }
  .highlights li { padding: .3rem .5rem; border: 1px solid var(--profile-line); border-radius: .15rem; background: var(--profile-inset); color: var(--profile-muted); font: .62rem/1.6 var(--profile-meta-font); }
  .carousel { margin: 0 1.6rem; border: 1px solid var(--profile-line); border-radius: .4rem; overflow: hidden; background: var(--profile-inset); }
  .carousel:last-child { margin-bottom: 1.6rem; }
  .browser-bar { display: flex; gap: .8rem; align-items: center; padding: .65rem .8rem; color: var(--profile-muted); font: .6rem/1.6 var(--profile-meta-font); }
  .browser-dots { display: flex; gap: .25rem; }
  .browser-dots i { width: 6px; height: 6px; border: 1px solid var(--profile-muted); border-radius: 50%; opacity: .6; }
  .address { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .mode { color: var(--profile-accent); text-transform: uppercase; font-size: .55rem; }
  .screenshot { position: relative; display: block; width: 100%; padding: 0; border: 0; cursor: zoom-in; background: var(--profile-surface); }
  .screenshot img { display: block; width: 100%; height: auto; aspect-ratio: 36 / 25; }
  .enlarge { position: absolute; right: .8rem; bottom: .8rem; display: flex; gap: .5rem; align-items: center; border: 1px solid var(--profile-line); border-radius: .25rem; padding: .45rem .65rem; background: var(--profile-surface); color: var(--profile-ink); font: .6rem/1.6 var(--profile-meta-font); box-shadow: var(--profile-shadow); }
  .enlarge > span { font-size: 1rem; line-height: 1; }
  .carousel-controls { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .8rem; border-top: 1px solid var(--profile-line); }
  .slide-status { display: flex; flex-wrap: wrap; align-items: baseline; gap: .75rem; margin: 0; }
  .slide-status strong { font-size: .8rem; font-weight: 500; }
  .slide-status > span { color: var(--profile-muted); font: .6rem/1.6 var(--profile-meta-font); }
  .arrows { display: flex; gap: .4rem; }
  .arrows button { width: 2.75rem; height: 2.75rem; border: 1px solid var(--profile-line); border-radius: .25rem; font-size: 1.1rem; }
  .page-picker { display: flex; flex-wrap: wrap; gap: .35rem; padding: 0 .8rem .8rem; }
  .page-picker button { padding: .55rem .7rem; border: 1px solid var(--profile-line); border-radius: .2rem; color: var(--profile-muted); font: .65rem/1.6 var(--profile-meta-font); }
  .page-picker button[aria-pressed='true'] { border-color: var(--profile-accent); color: var(--profile-accent); background: var(--profile-surface); }
  button { color: var(--profile-ink); transition: border-color 150ms; }
  button:hover { border-color: var(--profile-accent); }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 3px; }
  .screenshot:focus-visible { outline-offset: -3px; }
  .release-footer { display: flex; justify-content: flex-end; padding: 1rem 1.6rem 1.25rem; color: var(--profile-muted); font: .6rem/1.6 var(--profile-meta-font); }
  .release-footer a { text-decoration: none; }
  .release-footer a:hover { color: var(--profile-accent); }
  dialog { width: min(1440px, calc(100vw - 2rem)); max-width: none; max-height: calc(100dvh - 2rem); padding: 0; border: 1px solid var(--profile-line); border-radius: .6rem; background: var(--profile-inset); color: var(--profile-ink); }
  dialog::backdrop { background: #07131dd9; }
  .viewer-bar { position: sticky; top: 0; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .8rem 1rem; background: var(--profile-surface); border-bottom: 1px solid var(--profile-line); }
  .viewer-bar h2 { margin: 0; font: .75rem/1.7 var(--profile-meta-font); }
  .viewer-bar h2 span { color: var(--profile-muted); }
  .viewer-bar button { flex-shrink: 0; padding: .5rem .7rem; border: 1px solid var(--profile-line); border-radius: .25rem; font: .7rem/1.6 var(--profile-meta-font); }
  .full-screenshot img { display: block; width: 100%; height: auto; }
  @media (max-width: 640px) {
    .release-intro { padding: 1.1rem; }
    .chapter { gap: .6rem; align-items: baseline; }
    .chapter > span { font-size: 1.4rem; }
    .carousel { margin: 0 .65rem; }
    .carousel:last-child { margin-bottom: .65rem; }
    .release-footer { padding: 1rem 1.1rem; }
    .browser-dots { display: none; }
    .enlarge { right: .4rem; bottom: .4rem; padding: .25rem .4rem; font-size: .5rem; }
    dialog { width: calc(100vw - 1rem); max-height: calc(100dvh - 1rem); }
    .viewer-bar { gap: .5rem; padding: .5rem; }
    .viewer-bar h2 { font-size: .6rem; }
  }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
</style>
