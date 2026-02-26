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
    <p class="eyebrow">Blog</p>
    <h1>Digital Reflections</h1>
    <p class="dek">
      Experiments, engineering notes, and long-form explorations. And various thoughts.
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
    --blog-bg: #eef3fb;
    --blog-panel: #ffffff;
    --blog-panel-2: #f8fbff;
    --blog-border: #d5deec;
    --blog-ink: #1f2937;
    --blog-muted: #5e6b82;
    --blog-accent: #168fc7;
    --blog-accent-soft: rgba(22, 143, 199, 0.1);
    --blog-glow: rgba(56, 189, 248, 0.1);
    min-height: 70vh;
    padding: clamp(1rem, 1.4vw + 0.75rem, 1.65rem);
    background:
      radial-gradient(circle at 14% 6%, var(--blog-glow), transparent 42%),
      radial-gradient(circle at 88% 12%, rgba(20, 184, 166, 0.09), transparent 44%),
      linear-gradient(140deg, #f9fbff 0%, var(--blog-bg) 55%, #edf2fb 100%);
    color: var(--blog-ink);
    border: 1px solid var(--blog-border);
    border-radius: 1rem;
    box-shadow: 0 18px 38px rgba(32, 62, 101, 0.08);
  }

  :global(html.dark) .blog-index {
    --blog-bg: #1f2230;
    --blog-panel: #262a39;
    --blog-panel-2: #282d3c;
    --blog-border: #3d4354;
    --blog-ink: #e7ebf3;
    --blog-muted: #bcc4d4;
    --blog-accent: #5cb7db;
    --blog-accent-soft: rgba(92, 183, 219, 0.1);
    --blog-glow: rgba(92, 183, 219, 0.08);
    background:
      radial-gradient(circle at 16% 8%, rgba(92, 183, 219, 0.09), transparent 45%),
      radial-gradient(circle at 84% 10%, rgba(99, 102, 241, 0.08), transparent 46%),
      linear-gradient(138deg, #1e2230 0%, var(--blog-bg) 60%, #232838 100%);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  }

  .blog-hero {
    padding: clamp(0.45rem, 0.8vw, 0.9rem) clamp(0.2rem, 0.9vw, 0.7rem) 1.1rem;
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.68rem;
    color: var(--blog-accent);
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
    line-height: 1.62;
  }

  .rss-pill {
    display: inline-block;
    margin-top: 1.05rem;
    border: 1px solid var(--blog-border);
    background: linear-gradient(140deg, rgba(14, 165, 233, 0.12), rgba(20, 184, 166, 0.04));
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
    transform: translateY(-0.5px);
    border-color: var(--blog-accent);
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.14) inset;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    gap: 0.95rem;
    margin-top: 0.65rem;
  }

  .post-card {
    border: 1px solid var(--blog-border);
    background: linear-gradient(160deg, var(--blog-panel) 0%, var(--blog-panel-2) 100%);
    border-radius: 0.9rem;
    overflow: hidden;
    transition: border-color 180ms ease, transform 180ms ease, box-shadow 220ms ease, background-color 200ms ease;
  }

  .post-card:hover {
    border-color: color-mix(in oklab, var(--blog-accent), var(--blog-border) 72%);
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.13);
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
    background: color-mix(in oklab, var(--blog-accent-soft), transparent 82%);
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
    text-wrap: balance;
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

  @media (max-width: 640px) {
    .blog-index {
      padding: 0.85rem;
    }

    .blog-hero h1 {
      font-size: clamp(1.75rem, 8vw, 2.2rem);
    }

    .posts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
