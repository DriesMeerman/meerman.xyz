<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import { thingies, thingyTags } from '$lib/data/thingiesData.js';
  import { filterThingies, tagsOf } from '$lib/thingies/filter.js';

  const tags = tagsOf(thingies);

  let query = $state('');
  /** @type {string[]} */
  let selectedTags = $state([]);

  const visible = $derived(filterThingies(thingies, { query, tags: selectedTags }));
  const filtering = $derived(query.trim() !== '' || selectedTags.length > 0);

  /** @param {string} tag */
  const tagLabel = (tag) => thingyTags[tag] ?? tag;

  /** @param {string} tag */
  function toggleTag(tag) {
    selectedTags = selectedTags.includes(tag) ? selectedTags.filter((selected) => selected !== tag) : [...selectedTags, tag];
  }
</script>

<svelte:head>
  <title>Thingies · Meerman</title>
  <meta name="description" content="[DRIES TO ADD SPICE]" />
  <meta name="author" content="Dries Meerman" />
</svelte:head>

<ProfilePage title="Thingies" description="[DRIES TO ADD SPICE]">
  <section class="profile-section" aria-labelledby="thingies-heading">
    <div class="profile-section-head">
      <h2 id="thingies-heading" class="profile-section-title">01 / Entries</h2>
      <span class="profile-section-count" aria-live="polite">
        {filtering ? `${visible.length} of ${thingies.length}` : thingies.length} entries
      </span>
    </div>

    <div class="controls">
      <label class="search">
        <span class="sr-only">Search thingies</span>
        <span class="search-prompt" aria-hidden="true">/</span>
        <input type="search" placeholder="Search" autocomplete="off" spellcheck="false" bind:value={query} />
      </label>
      <div class="tag-filters" role="group" aria-label="Filter by tag">
        {#each tags as tag (tag)}
          <button type="button" class="tag-filter" aria-pressed={selectedTags.includes(tag)} onclick={() => toggleTag(tag)}>
            <span class="filter-indicator" aria-hidden="true">{selectedTags.includes(tag) ? '✓' : '+'}</span>
            {tagLabel(tag)}
          </button>
        {/each}
      </div>
    </div>

    {#if visible.length}
      <ul class="thingies-grid">
        {#each visible as entry (entry.id)}
          {@const titleId = `thingy-title-${entry.id}`}
          <li class="thingy-card" class:available={entry.href}>
            {#snippet body()}
              <div class="thingy-topline">
                {#each entry.tags as tag (tag)}
                  <span class="thingy-tag">{tagLabel(tag)}</span>
                {/each}
              </div>
              <h3 id={titleId} class="thingy-title">{entry.title}</h3>
              <p class="thingy-description">{entry.description}</p>
              <div class="thingy-bottomline">
                {#if entry.href}
                  <span>Open</span><span class="open-arrow" aria-hidden="true">↗</span>
                {:else}
                  <span class="status">In the works</span>
                {/if}
              </div>
            {/snippet}
            {#if entry.href}
              <a class="thingy-body" href={entry.href} aria-labelledby={titleId}>{@render body()}</a>
            {:else}
              <div class="thingy-body">{@render body()}</div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-state" role="status">Nothing matches that search.</p>
    {/if}
  </section>
</ProfilePage>

<style>
  .controls { display: flex; flex-wrap: wrap; align-items: stretch; gap: .75rem; margin-bottom: 1.5rem; }

  .search {
    display: flex;
    flex: 1 1 16rem;
    align-items: center;
    gap: .6rem;
    min-width: 0;
    padding: 0 .8rem;
    border: 1px solid var(--profile-line);
    border-radius: .3rem;
    background: var(--profile-inset);
  }

  .search:focus-within { border-color: var(--profile-accent); outline: 2px solid var(--profile-accent); outline-offset: 3px; }
  .search-prompt { color: var(--profile-accent); font-family: var(--profile-meta-font); font-size: .8rem; }

  .search input {
    flex: 1;
    min-width: 0;
    padding: .65rem 0;
    border: 0;
    background: transparent;
    color: var(--profile-ink);
    font-family: var(--profile-meta-font);
    font-size: .8rem;
    line-height: 1.5;
    outline: none;
  }

  .search input::placeholder { color: var(--profile-muted); opacity: 1; }

  .tag-filters { display: flex; flex-wrap: wrap; gap: .5rem; }

  .tag-filter {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    padding: .65rem .8rem;
    border: 1px solid var(--profile-line);
    border-radius: .3rem;
    background: var(--profile-inset);
    color: var(--profile-muted);
    font-family: var(--profile-meta-font);
    font-size: .7rem;
    line-height: 1.5;
  }

  .tag-filter[aria-pressed='true'] { border-color: var(--profile-accent); color: var(--profile-accent); }
  .tag-filter:hover { border-color: var(--profile-accent); }
  .filter-indicator { width: 1ch; }

  .thingies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 1.2rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .thingy-card {
    position: relative;
    min-width: 0;
    border: 1px solid var(--profile-line);
    border-radius: var(--profile-radius);
    background: linear-gradient(135deg, #43cbc414, transparent 55%, #8299e410), var(--profile-surface);
    box-shadow: var(--profile-shadow);
    transition: transform 180ms ease, border-color 180ms ease;
  }

  .thingy-card::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 17px;
    height: 17px;
    border-top: 1px solid var(--profile-accent);
    border-right: 1px solid var(--profile-accent);
    border-radius: 0 .4rem 0 0;
    opacity: .75;
    pointer-events: none;
  }

  .thingy-card.available:hover { transform: translateY(-1px); border-color: var(--profile-accent); }

  .thingy-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
    border-radius: inherit;
    color: var(--profile-ink);
    text-decoration: none;
  }

  .thingy-topline {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    margin-bottom: 1rem;
    padding-bottom: .85rem;
    border-bottom: 1px solid var(--profile-line);
  }

  .thingy-tag {
    padding: .2rem .4rem;
    border: 1px solid var(--profile-line);
    border-radius: .15rem;
    background: var(--profile-inset);
    color: var(--profile-muted);
    font-family: var(--profile-meta-font);
    font-size: .56rem;
    line-height: 1.6;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .thingy-title {
    margin: 0 0 .85rem;
    font-family: var(--profile-display-font);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.65;
    letter-spacing: -.015em;
    overflow-wrap: anywhere;
  }

  .thingy-description {
    margin: 0 0 1.25rem;
    color: var(--profile-muted);
    font-size: .9rem;
    line-height: 1.75;
    overflow-wrap: anywhere;
  }

  .thingy-bottomline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    margin-top: auto;
    padding-top: .8rem;
    border-top: 1px solid var(--profile-line);
    color: var(--profile-accent);
    font-family: var(--profile-meta-font);
    font-size: .62rem;
    line-height: 1.6;
  }

  .status { color: var(--profile-muted); letter-spacing: .05em; text-transform: uppercase; }
  .open-arrow { font-size: .95rem; }

  .empty-state {
    padding: 1.5rem;
    border: 1px solid var(--profile-line);
    border-radius: var(--profile-radius);
    background: var(--profile-surface);
    color: var(--profile-muted);
    font-size: .9rem;
    line-height: 1.75;
  }

  a.thingy-body:focus-visible,
  .tag-filter:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 3px; }

  @media (max-width: 640px) {
    .thingy-body { padding: 1.1rem; }
    .thingy-title { font-size: .95rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .thingy-card { transition: none; }
    .thingy-card.available:hover { transform: none; }
  }
</style>
