<script>
  import { onMount } from 'svelte';
  import ProfilePage from '$lib/ProfilePage.svelte';

  /**
   * @typedef {{
   *   ID: number | string,
   *   slug?: string,
   *   filename?: string,
   *   title: string,
   *   summary: string,
   *   date: string,
   *   sourceType?: string
   * }} Post
   */

  /** @type {Post[]} */
  let posts = $state([]);
  let error = $state('');
  let loading = $state(true);

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  });

  async function loadPosts() {
    loading = true;
    error = '';
    try {
      const response = await fetch('/feed.json');
      if (!response.ok) throw new Error('Failed to load articles');
      posts = (await response.json()).sort(
        /** @param {Post} left @param {Post} right */
        (left, right) => Date.parse(right.date) - Date.parse(left.date)
      );
    } catch {
      error = 'The article archive could not be loaded. Please try again.';
    } finally {
      loading = false;
    }
  }

  onMount(() => { void loadPosts(); });

  /** @param {string} date */
  function isoDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  /** @param {number | string} id */
  function formatId(id) {
    return String(id).padStart(3, '0');
  }

  /** @param {Post} post */
  function postSlug(post) {
    return post.slug || post.filename?.replace(/\.md$/, '');
  }

  /** @param {Post} post */
  function sourceLabel(post) {
    return post.sourceType === 'html' ? 'Immersive' : 'Notes';
  }
</script>

<svelte:head>
  <title>Digital Reflections · Meerman</title>
  <meta name="description" content="Digital reflections — experiments, engineering notes, and articles about software development and technology." />
  <meta name="author" content="Dries Meerman" />
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Blog" />
</svelte:head>

<ProfilePage title="Digital Reflections" marker="Blog" description="Experiments, engineering notes, long-form explorations, and various thoughts.">
  <section class="profile-section" aria-labelledby="blog-archive">
    <div class="profile-section-head archive-head">
      <h2 id="blog-archive" class="profile-section-title">01 / Articles</h2>
      <div class="archive-controls">
        {#if !loading && !error}
          <span class="profile-section-count">{posts.length} entries</span>
        {/if}
        <a class="rss-link" href="/feed.xml" aria-label="RSS feed">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="19" r="1" fill="currentColor" />
            <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span>RSS feed</span>
        </a>
      </div>
    </div>

    {#if loading}
      <div class="state-panel" role="status"><p>Loading articles…</p></div>
    {:else if error}
      <div class="state-panel" role="alert">
        <p>{error}</p>
        <button class="retry-button" type="button" onclick={loadPosts}>Try again <span aria-hidden="true">↗</span></button>
      </div>
    {:else if posts.length}
      <div class="posts-grid">
        {#each posts as post (postSlug(post))}
          <article class="post-card">
            <a class="post-link" href={'/blog/' + postSlug(post)} aria-labelledby={'post-title-' + postSlug(post)}>
              <div class="post-topline">
                <span class="post-id">#{formatId(post.ID)}</span>
                <span class="post-type">{sourceLabel(post)}</span>
                <time class="post-date" datetime={isoDate(post.date)}>{dateFormatter.format(new Date(post.date))}</time>
              </div>
              <h3 id={'post-title-' + postSlug(post)} class="post-title">{post.title}</h3>
              <p class="post-summary">{post.summary}</p>
              <div class="post-bottomline" aria-hidden="true">
                <span>Read article</span><span class="read-arrow">↗</span>
              </div>
            </a>
          </article>
        {/each}
      </div>
    {:else}
      <div class="state-panel" role="status"><p>No articles yet. Check back soon.</p></div>
    {/if}
  </section>
</ProfilePage>

<style>
  .archive-head { align-items: center; }
  .archive-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .75rem; }

  .rss-link {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .5rem .6rem;
    border: 1px solid var(--profile-line);
    border-radius: .3rem;
    background: var(--profile-inset);
    color: var(--profile-accent);
    font-family: var(--profile-meta-font);
    font-size: .62rem;
    line-height: 1.5;
    text-decoration: none;
  }

  .rss-link svg { width: .9rem; height: .9rem; flex-shrink: 0; }
  .rss-link:hover { border-color: var(--profile-accent); }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 1.2rem;
  }

  .post-card {
    position: relative;
    min-width: 0;
    border: 1px solid var(--profile-line);
    border-radius: var(--profile-radius);
    background: linear-gradient(135deg, #43cbc414, transparent 55%, #8299e410), var(--profile-surface);
    box-shadow: var(--profile-shadow);
    transition: transform 180ms ease, border-color 180ms ease;
  }

  .post-card::after {
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

  .post-card:hover { transform: translateY(-1px); border-color: var(--profile-accent); }

  .post-link {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
    border-radius: inherit;
    color: var(--profile-ink);
    text-decoration: none;
  }

  .post-topline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .6rem;
    margin-bottom: 1rem;
    padding-bottom: .85rem;
    border-bottom: 1px solid var(--profile-line);
    font-family: var(--profile-meta-font);
    font-size: .65rem;
    line-height: 1.6;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .post-id { color: var(--profile-accent); }
  .post-type { padding: .2rem .4rem; border: 1px solid var(--profile-line); border-radius: .15rem; background: var(--profile-inset); color: var(--profile-muted); font-size: .56rem; }
  .post-date { margin-left: auto; color: var(--profile-muted); font-size: .6rem; }

  .post-title {
    margin: 0 0 .85rem;
    font-family: var(--profile-display-font);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.65;
    letter-spacing: -.015em;
    overflow-wrap: anywhere;
  }

  .post-summary {
    display: -webkit-box;
    margin: 0 0 1.25rem;
    color: var(--profile-muted);
    font-size: .9rem;
    line-height: 1.75;
    line-clamp: 4;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .post-bottomline {
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

  .read-arrow { font-size: .95rem; }

  .state-panel {
    padding: 1.5rem;
    border: 1px solid var(--profile-line);
    border-radius: var(--profile-radius);
    background: var(--profile-surface);
    color: var(--profile-muted);
    font-size: .9rem;
    line-height: 1.75;
  }

  .retry-button { margin-top: .85rem; color: var(--profile-accent); font-size: .8rem; font-weight: 600; }
  .retry-button span { margin-left: .5rem; }
  .post-link:focus-visible,
  .rss-link:focus-visible,
  .retry-button:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 4px; }

  @media (max-width: 640px) {
    .post-link { padding: 1.1rem; }
    .post-title { font-size: .95rem; }
    .archive-controls { gap: .5rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .post-card { transition: none; }
    .post-card:hover { transform: none; }
  }
</style>
