<script>
  import { onMount } from 'svelte';
  import Card from '$lib/Card.svelte';
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
  <Card class="p-6">
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
  </Card>
{:else}
  <div>Loading...</div>
{/if}

<div class="rss-icon" title="This will open the rss feed">
  <a href="/feed.xml" aria-label="RSS feed">
    <svg class="dark:fill-white" width="25" height="25" viewBox="0 0 490 490" aria-hidden="true">
      <path d="M468.2,489.5H20.8C9.4,489.5,0,480.1,0,468.7V21.3C0,9.9,9.4,0.5,20.8,0.5h448.4c11.4,0,20.8,9.4,20.8,20.8v448.4C489,480.1,479.6,489.5,468.2,489.5z M40.6,448.9h407.8V41.1H40.6V448.9z"/>
      <path d="M260.1,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-77-62.4-139.4-139.4-139.4c-11.4,0-20.8-9.4-20.8-20.8 c0-11.4,9.4-20.8,20.8-20.8c99.9,0,181,81.1,181,181C280.9,410.4,271.5,419.8,260.1,419.8z"/>
      <path d="M347.5,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-124.8-102-227.8-227.8-227.8c-11.4,0-20.8-9.4-20.8-20.8s9.4-20.8,20.8-20.8 c147.7,0,268.4,120.7,268.4,268.4C368.3,410.4,358.9,419.8,347.5,419.8z"/>
      <path d="M173.7,419.8c-11.4,0-20.8-9.4-20.8-20.8c0-29.1-23.9-53.1-53.1-53.1c-11.4,0-20.8-9.4-20.8-20.8 c0-11.4,9.4-20.8,20.8-20.8c52,0,94.7,42.7,94.7,94.7C194.5,410.4,185.2,419.8,173.7,419.8z"/>
    </svg>
  </a>
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


