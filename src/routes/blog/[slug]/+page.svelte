<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { particlesEnabled } from '$lib/state';
  export let data;
  let htmlContent = '';
  let errorMessage = '';
  let enlargedImage = null;
  let articleContainer;
  let documentClickHandler;
  let documentEscapeHandler;
  const imageListeners = [];

  const isHtmlSource = data?.meta?.sourceType === 'html';
  const customJsEnabled = data?.meta?.enableCustomJs !== false;

  onMount(async () => {
    // Disable particles on blog article pages for better readability
    particlesEnabled.set(false);

    try {
      const res = await fetch(`/articles/${data.slug}.html`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load article');
      htmlContent = await res.text();
      await tick();
      if (isHtmlSource && customJsEnabled) {
        activateEmbeddedScripts();
      }
      addImageClickListeners();
      addEscapeKeyListener();
    } catch (e) {
      errorMessage = e.message;
    }
  });

  onDestroy(() => {
    removeImageClickListeners();
    if (documentClickHandler) document.removeEventListener('click', documentClickHandler);
    if (documentEscapeHandler) document.removeEventListener('keydown', documentEscapeHandler);

    // Re-enable particles when leaving the blog article
    particlesEnabled.set(true);
  });

  function activateEmbeddedScripts() {
    if (!articleContainer) return;

    const scriptNodes = articleContainer.querySelectorAll('script');
    scriptNodes.forEach((oldScript) => {
      const newScript = document.createElement('script');
      for (const { name, value } of oldScript.attributes) {
        newScript.setAttribute(name, value);
      }
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }

  function addImageClickListeners() {
    if (!articleContainer) return;

    const images = articleContainer.querySelectorAll('img');
    images.forEach((img) => {
      const onClick = (event) => {
        if (enlargedImage) {
          closeEnlargedImage();
        } else {
          enlargeImage(img);
        }
        event.stopPropagation();
      };

      img.addEventListener('click', onClick);
      imageListeners.push({ img, onClick });
    });

    documentClickHandler = () => {
      if (enlargedImage) closeEnlargedImage();
    };
    document.addEventListener('click', documentClickHandler);
  }

  function removeImageClickListeners() {
    imageListeners.forEach(({ img, onClick }) => {
      img.removeEventListener('click', onClick);
    });
    imageListeners.length = 0;
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
    documentEscapeHandler = (event) => {
      if (event.key === 'Escape' && enlargedImage) closeEnlargedImage();
    };
    document.addEventListener('keydown', documentEscapeHandler);
  }
</script>

<section class={`article-page ${isHtmlSource ? 'html-source' : 'md-source'}`} in:fade={{ duration: 220 }} out:fade={{ duration: 160 }}>
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {:else}
    <div
      bind:this={articleContainer}
      class={`article-content ${!isHtmlSource ? 'prose dark:prose-invert max-w-none list-disc dark:marker:text-white' : ''}`}
    >
      {@html htmlContent}
    </div>
  {/if}
</section>

<svelte:head>
  {#if data?.meta}
    <title>{data.meta.title}</title>
    <meta name="description" content={data.meta.summary} />
    <meta name="author" content={data.meta.author} />
    <meta name="keywords" content={(Array.isArray(data.meta.tags) ? data.meta.tags : []).join(', ')} />
  {/if}
</svelte:head>

<style>
  .article-page {
    border-radius: 1rem;
    border: 1px solid rgba(30, 41, 59, 0.22);
    overflow: hidden;
  }

  .article-page.md-source {
    background: transparent;
  }

  .article-page.html-source {
    --site-menu-offset: clamp(3.4rem, 5vw, 4.1rem);
    background: #0a0a0b;
    border-color: #202229;
    color: #e4e4e7;
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
    width: min(1640px, calc(100vw - 1.1rem));
    margin-inline: auto;
  }

  .article-page.html-source :global(a) {
    color: #c8f547;
  }

  .article-page.html-source :global(nav.fixed.top-0.left-0.right-0) {
    position: sticky !important;
    top: var(--site-menu-offset) !important;
    z-index: 20 !important;
  }

  .article-page.html-source :global(main) {
    padding-inline: clamp(0.6rem, 1.4vw, 1.15rem);
  }

  @media (max-width: 640px) {
    .article-page.html-source {
      --site-menu-offset: 3.05rem;
      width: calc(100vw - 0.45rem);
      border-radius: 0.7rem;
    }

    .article-page.html-source :global(main) {
      padding-inline: 0.35rem;
    }

    .article-page.html-source :global(nav.fixed.top-0.left-0.right-0 .max-w-6xl) {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }

  @media (min-width: 768px) { .prose :global(img) { max-width: 30rem; margin: 1.5rem auto; } }
  :global(.article-content img) { cursor: pointer; transition: all 0.3s ease; border-radius: 15px; background: #f0f0f0; box-shadow: 0 10px 25px rgba(0,0,0,.5); padding: 1px; }
  :global(.article-content img.enlarged) { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90vw; max-height: 90vh; z-index: 1000; background: none; padding: 0; }
  :global(.dark .prose img) { background: #2a2a2a; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
  :global(.dark .article-content img) { background: #2a2a2a; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
</style>
