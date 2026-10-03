<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import ReleaseCarousel from '$lib/history/ReleaseCarousel.svelte';
  import { siteHistory } from '$lib/data/siteHistory.js';
  const pageCount = siteHistory.reduce((total, release) => total + release.pages.length, 0);
</script>

<svelte:head>
  <title>Site history · Meerman</title>
  <meta name="description" content="Screenshots of meerman.xyz from the original site through version 4." />
  <link rel="canonical" href="https://meerman.xyz/site-history" />
</svelte:head>

<ProfilePage title="Site history" description="Previous versions of this website.">
  <aside class="archive-intro profile-panel" aria-label="About this archive">
    <div class="archive-label"><span class="archive-signal" aria-hidden="true"></span> ARCHIVE</div>
    <div class="archive-stats"><span>{siteHistory.length} versions</span><span>{pageCount} pages</span><span>v0 → v4</span></div>
    <p class="archive-help">Select a page. Click a screenshot to view it in full.</p>
  </aside>

  <div class="release-jumps" role="group" aria-label="Jump to a release">
    <span>Jump to</span>
    {#each siteHistory as release (release.version)}
      <a href={`#release-${release.version}`}>v{release.version} <span aria-hidden="true">↓</span></a>
    {/each}
  </div>

  {#each siteHistory as release, index (release.version)}
    <ReleaseCarousel {release} number={index + 1} />
  {/each}
</ProfilePage>

<style>
  .archive-intro { padding: 1.5rem; }
  .archive-label { display: flex; align-items: center; gap: .65rem; color: var(--profile-accent); font: .62rem/1.6 var(--profile-meta-font); letter-spacing: .08em; }
  .archive-signal { width: 7px; height: 7px; background: var(--profile-accent); transform: rotate(45deg); }
  .archive-stats { display: flex; flex-wrap: wrap; gap: .6rem 1.5rem; margin-top: .85rem; color: var(--profile-accent); font: .7rem/1.6 var(--profile-meta-font); }
  .archive-intro .archive-help { margin: 1.1rem 0 0; color: var(--profile-muted); font-size: .8rem; }
  .release-jumps { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin: 1.5rem 0 2rem; font: .65rem/1.6 var(--profile-meta-font); }
  .release-jumps > span { margin-right: .25rem; color: var(--profile-muted); }
  .release-jumps a { display: flex; gap: .7rem; padding: .6rem .75rem; border: 1px solid var(--profile-line); border-radius: .25rem; background: var(--profile-inset); color: var(--profile-ink); text-decoration: none; }
  .release-jumps a span { color: var(--profile-accent); }
  .release-jumps a:hover { border-color: var(--profile-accent); }
  .release-jumps a:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 3px; }
  @media (max-width: 640px) { .archive-intro { padding: 1.1rem; } }
</style>
