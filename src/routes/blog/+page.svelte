<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  let posts = [];
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch('/feed.json');
      if (!res.ok) throw new Error('Failed to load posts');
      posts = (await res.json()).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      error = e.message;
    }
  });

  function isoDate(str) {
    return new Date(str).toISOString().split('T')[0];
  }

  function formatId(id) {
    return String(id).padStart(3, '0');
  }

  function postSlug(post) {
    return post.slug || post.filename?.replace(/\.md$/, '');
  }

  function sourceLabel(post) {
    return post.sourceType === 'html' ? 'IMMERSIVE' : 'NOTES';
  }
</script>

<svelte:head>
  <title>Meerman - Blog</title>
  <meta name="description" content="Digital reflections - A collection of articles about software development, technology, and other topics." />
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Blog">
</svelte:head>

<section class="blog-index" in:fade={{ duration: 250 }} out:fade={{ duration: 180 }}>
  <header class="blog-hero" in:fly={{ y: 14, duration: 280 }}>
    <p class="eyebrow">Meerman Lab Notes</p>
    <h1>Digital Reflections</h1>
    <p class="dek">
      Experiments, engineering notes, and long-form explorations. Markdown posts and immersive HTML essays live together here.
    </p>
    <a class="rss-pill" href="/feed.xml" aria-label="RSS feed">RSS feed</a>
  </header>

  {#if error}
    <div class="state-panel">Error: {error}</div>
  {:else if posts.length}
    <div class="posts-grid">
      {#each posts as post, index}
        <article class="post-card" in:fly={{ y: 10, duration: 260, delay: Math.min(index * 25, 220) }}>
          <a class="post-link" href={`/blog/${postSlug(post)}`}>
            <div class="post-topline">
              <span class="post-id">#{formatId(post.ID)}</span>
              <span class="post-type">{sourceLabel(post)}</span>
              <time class="post-date">{isoDate(post.date)}</time>
            </div>
            <h2 class="post-title">{post.title}</h2>
            <p class="post-summary">{post.summary}</p>
          </a>
        </article>
      {/each}
    </div>
  {:else}
    <div class="state-panel">Loading posts...</div>
  {/if}
</section>

<style>
  .blog-index {
    --blog-bg: #f3efe7;
    --blog-panel: #fffdf8;
    --blog-border: #ddd2c2;
    --blog-ink: #261d12;
    --blog-muted: #67594a;
    --blog-accent: #ac2b1d;
    --blog-accent-soft: #f4d6ce;
    min-height: 70vh;
    padding: clamp(1rem, 1vw + 0.8rem, 1.5rem);
    background:
      radial-gradient(circle at 12% 10%, rgba(172, 43, 29, 0.08), transparent 35%),
      linear-gradient(130deg, #f8f2e8 0%, var(--blog-bg) 52%, #efe9dd 100%);
    color: var(--blog-ink);
    border: 1px solid var(--blog-border);
    border-radius: 1rem;
    box-shadow: 0 20px 50px rgba(38, 29, 18, 0.12);
  }

  :global(html.dark) .blog-index {
    --blog-bg: #17171a;
    --blog-panel: #1f2025;
    --blog-border: #30323a;
    --blog-ink: #f4f4f4;
    --blog-muted: #b4b7c2;
    --blog-accent: #f39a7e;
    --blog-accent-soft: rgba(243, 154, 126, 0.2);
    background:
      radial-gradient(circle at 18% 12%, rgba(243, 154, 126, 0.1), transparent 35%),
      linear-gradient(130deg, #121217 0%, var(--blog-bg) 58%, #191b20 100%);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  }

  .blog-hero {
    padding: clamp(0.4rem, 0.8vw, 0.8rem) clamp(0.2rem, 0.9vw, 0.6rem) 1rem;
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.72rem;
    color: var(--blog-muted);
    font-weight: 700;
  }

  .blog-hero h1 {
    margin: 0.5rem 0 0.7rem;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 0.98;
    letter-spacing: -0.04em;
    font-weight: 800;
  }

  .dek {
    margin: 0;
    max-width: 58ch;
    color: var(--blog-muted);
    line-height: 1.55;
  }

  .rss-pill {
    display: inline-block;
    margin-top: 1rem;
    border: 1px solid var(--blog-border);
    background: var(--blog-accent-soft);
    color: var(--blog-ink);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
    transition: transform 160ms ease, border-color 160ms ease;
  }

  .rss-pill:hover {
    transform: translateY(-1px);
    border-color: var(--blog-accent);
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.8rem;
    margin-top: 0.6rem;
  }

  .post-card {
    border: 1px solid var(--blog-border);
    background: var(--blog-panel);
    border-radius: 0.9rem;
    overflow: hidden;
  }

  .post-link {
    display: block;
    height: 100%;
    text-decoration: none;
    color: inherit;
    padding: 0.9rem;
    transition: background-color 180ms ease;
  }

  .post-link:hover {
    background: color-mix(in oklab, var(--blog-accent-soft), transparent 55%);
  }

  .post-topline {
    display: grid;
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.67rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .post-id {
    font-weight: 800;
    color: var(--blog-accent);
  }

  .post-type {
    border: 1px solid var(--blog-border);
    border-radius: 999px;
    padding: 0.12rem 0.4rem;
    color: var(--blog-muted);
    font-weight: 700;
  }

  .post-date {
    justify-self: end;
    color: var(--blog-muted);
  }

  .post-title {
    margin: 0.65rem 0 0.45rem;
    font-size: 1.1rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .post-summary {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--blog-muted);
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .state-panel {
    margin-top: 1rem;
    border: 1px dashed var(--blog-border);
    border-radius: 0.85rem;
    padding: 0.8rem;
    color: var(--blog-muted);
    background: var(--blog-panel);
  }
</style>
