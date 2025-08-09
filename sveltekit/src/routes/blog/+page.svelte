<script>
  import { onMount } from 'svelte';
  import Card from '$lib/Card.svelte';
  let posts = [];
  let error = '';
  onMount(async () => {
    try {
      const res = await fetch('/feed.json');
      if (!res.ok) throw new Error('Failed to load posts');
      posts = await res.json();
    } catch (e) {
      error = e.message;
    }
  });

  function isoDate(str) {
    return new Date(str).toISOString().split('T')[0];
  }
</script>

<svelte:head>
  <title>Meerman - Blog</title>
  <meta name="description" content="Digital reflections - A collection of articles about software development, technology, and other topics." />
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Blog">
</svelte:head>

{#if error}
  <div>Error: {error}</div>
{:else if posts.length}
  <h1 class="justify-center flex text-2xl pb-12">Digital Reflections</h1>
  <div class="p-6 border rounded">
    <div class="w-full">
      {#each posts as post, index}
        <article class={index === 0 ? '' : 'pt-6'}>
          <a class="cursor-pointer" href={`/blog/${post.filename.replace(/\.md$/, '')}`}>
            <div class="flex flex-row justify-between">
              <h2 class="text-l hover:decoration-blue-400" title={post.summary}>{post.ID} - {post.title}</h2>
              <p class="text-xs min-w-fit ml-4 lh-inherit">[{isoDate(post.date)}]</p>
            </div>
          </a>
        </article>
        {#if index < posts.length - 1}
          <hr class="mt-2" />
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div>Loading...</div>
{/if}

<div class="rss-icon" title="This will open the rss feed">
  <a href="/feed.xml">RSS</a>
  </div>

<style>
  .rss-icon {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
  }
  .lh-inherit { line-height: inherit; }
  :global(.prose img) { cursor: pointer; }
</style>


