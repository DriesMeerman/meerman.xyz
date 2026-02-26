<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { particlesEnabled } from '$lib/state';
  export let data;
  let htmlContent = '';
  let errorMessage = '';
  let enlargedImage = null;

  onMount(async () => {
    // Disable particles on blog article pages for better readability
    particlesEnabled.set(false);

    try {
      const res = await fetch(`/articles/${data.slug}.html`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load article');
      htmlContent = await res.text();
      await tick();
      setTimeout(() => {
        addImageClickListeners();
        addEscapeKeyListener();
      }, 100);
    } catch (e) {
      errorMessage = e.message;
    }
  });

  onDestroy(() => {
    // Re-enable particles when leaving the blog article
    particlesEnabled.set(true);
  });

  function addImageClickListeners() {
    const images = document.querySelectorAll('.prose img');
    images.forEach((img) => {
      img.addEventListener('click', (event) => {
        if (enlargedImage) {
          closeEnlargedImage();
        } else {
          enlargeImage(img);
        }
        event.stopPropagation();
      });
    });
    document.addEventListener('click', () => {
      if (enlargedImage) closeEnlargedImage();
    });
  }

  function enlargeImage(img) {
    img.classList.add('enlarged');
    enlargedImage = img;
  }
  function closeEnlargedImage() {
    if (enlargedImage) {
      enlargedImage.classList.remove('enlarged');
      enlargedImage = null;
    }
  }
  function addEscapeKeyListener() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && enlargedImage) closeEnlargedImage();
    });
  }
</script>

{#if errorMessage}
  <div class="error-message">{errorMessage}</div>
{:else}
  <div class="prose dark:prose-invert max-w-none list-disc dark:marker:text-white">
    {@html htmlContent}
  </div>
{/if}

<svelte:head>
  {#if data?.meta}
    <title>{data.meta.title}</title>
    <meta name="description" content={data.meta.summary} />
    <meta name="author" content={data.meta.author} />
    <meta name="keywords" content={(Array.isArray(data.meta.tags) ? data.meta.tags : []).join(', ')} />
  {/if}
</svelte:head>

<style>
  @media (min-width: 768px) { .prose :global(img) { max-width: 30rem; margin: 1.5rem auto; } }
  :global(.prose img) { cursor: pointer; transition: all 0.3s ease; border-radius: 15px; background: #f0f0f0; box-shadow: 0 10px 25px rgba(0,0,0,.5); padding: 1px; }
  :global(.prose img.enlarged) { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90vw; max-height: 90vh; z-index: 1000; background: none; padding: 0; }
  :global(.dark .prose img) { background: #2a2a2a; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
</style>

