<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { particlesEnabled } from '$lib/state.svelte.js';
  export let data;
  let htmlContent = '';
  let errorMessage = '';
  let readingMinutes = null;
  /** @type {{ src: string, alt: string } | null} */
  let enlargedImage = null;
  let articleContainer;
  /** @type {HTMLDialogElement | undefined} */
  let imageDialog;
  const imageListeners = [];

  if (typeof window !== 'undefined') {
    window.__blogExternalScriptPromises ||= new Map();
  }

  const isHtmlSource = data?.meta?.sourceType === 'html';
  const customJsEnabled = data?.meta?.enableCustomJs !== false;

  onMount(async () => {
    // Disable particles on blog article pages for better readability
    particlesEnabled.current = false;

    try {
      const res = await fetch(`/articles/${data.slug}.html`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load article');
      htmlContent = await res.text();
      readingMinutes = calculateReadingMinutes(htmlContent);
      await tick();
      if (isHtmlSource && customJsEnabled) {
        await activateEmbeddedScripts();
      }
      addImageClickListeners();
    } catch (e) {
      errorMessage = e.message;
    }
  });

  onDestroy(() => {
    removeImageClickListeners();
    imageDialog?.close();

    particlesEnabled.current = true;
  });

  async function activateEmbeddedScripts() {
    if (!articleContainer) return;

    const scriptNodes = Array.from(articleContainer.querySelectorAll('script'));
    for (const oldScript of scriptNodes) {
      const src = oldScript.getAttribute('src');
      if (src) {
        await loadExternalScript(src, oldScript);
        oldScript.remove();
        continue;
      }

      const code = oldScript.textContent || '';
      const wrappedCode = `(function(){\n${code}\n})();`;
      const newScript = document.createElement('script');
      newScript.textContent = wrappedCode;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }
  }

  function loadExternalScript(src, oldScript) {
    if (typeof window === 'undefined') return Promise.resolve();

    window.__blogExternalScriptPromises ||= new Map();
    const existing = window.__blogExternalScriptPromises.get(src);
    if (existing) return existing;

    const script = document.createElement('script');
    script.src = src;
    script.async = false;

    for (const { name, value } of oldScript.attributes) {
      if (name === 'src') continue;
      script.setAttribute(name, value);
    }

    const promise = new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    });

    window.__blogExternalScriptPromises.set(src, promise);
    document.head.appendChild(script);
    return promise;
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
        event.preventDefault();
        event.stopPropagation();
      };

      img.addEventListener('click', onClick);
      imageListeners.push({ img, onClick });
    });

  }

  function removeImageClickListeners() {
    imageListeners.forEach(({ img, onClick }) => {
      img.removeEventListener('click', onClick);
    });
    imageListeners.length = 0;
  }

  /** @param {HTMLImageElement} img */
  async function enlargeImage(img) {
    enlargedImage = { src: img.currentSrc || img.src, alt: img.alt };
    await tick();
    imageDialog?.showModal();
  }

  function closeEnlargedImage() {
    imageDialog?.close();
    enlargedImage = null;
  }

  function calculateReadingMinutes(html) {
    const text = html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return null;
    const words = text.split(' ').length;
    return Math.max(1, Math.ceil(words / 220));
  }
</script>

<section class={`article-page ${isHtmlSource ? 'html-source' : 'md-source'}`} in:fade={{ duration: 220 }} out:fade={{ duration: 160 }}>
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {:else}
    {#if readingMinutes}
      <p class="reading-time">{readingMinutes} min read</p>
    {/if}
    <div
      bind:this={articleContainer}
      class={`article-content ${!isHtmlSource ? 'prose dark:prose-invert max-w-none list-disc dark:marker:text-white' : ''}`}
    >
      {@html htmlContent}
    </div>
  {/if}
</section>

<dialog bind:this={imageDialog} class="image-zoom" aria-label="Enlarged image" on:close={() => enlargedImage = null}>
  <button class="image-zoom-close" aria-label="Close enlarged image" on:click={closeEnlargedImage}>
    {#if enlargedImage}
      <img src={enlargedImage.src} alt={enlargedImage.alt} />
    {/if}
    <span class="image-zoom-hint">Close ×</span>
  </button>
</dialog>

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
    overflow: visible;
  }

  .reading-time {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    opacity: 0.65;
    display: flex;
    align-content: end;
    justify-content: flex-end;
    margin: 0.5rem;
  }

  .article-page.md-source {
    background: transparent;
    width: 100%;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    transform: none;
    left: auto;
    margin-top: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  :global(.article-page.md-source .article-content) {
    max-width: 100%;
    overflow-x: hidden;
  }

  :global(.article-page.md-source .article-content.prose a),
  :global(.article-page.md-source .article-content .footnotes a),
  :global(.article-page.md-source .article-content .notes a) {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  :global(.article-page.md-source .article-content .footnotes),
  :global(.article-page.md-source .article-content .footnotes li),
  :global(.article-page.md-source .article-content .footnotes p),
  :global(.article-page.md-source .article-content .notes),
  :global(.article-page.md-source .article-content .notes li),
  :global(.article-page.md-source .article-content .notes p) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .article-page.html-source {
    --site-menu-offset: clamp(3.4rem, 5vw, 4.1rem);
    background: #0a0a0b;
    border-color: #202229;
    color: #e4e4e7;
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
    width: min(1640px, calc(100vw - 14rem));
    margin-top: clamp(0.65rem, 1.5vw, 1rem);
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 1rem;
    overflow: hidden;
  }

  .article-page.html-source :global(a) {
    color: #c8f547;
  }

  .article-page.html-source .reading-time {
    color: #b7c25b;
  }

  .article-page.html-source :global(main) {
    padding-inline: clamp(0.6rem, 1.4vw, 1.15rem);
  }

  @media (max-width: 640px) {
    .article-page.html-source {
      --site-menu-offset: 3.05rem;
      width: calc(100vw - 2rem);
      margin-top: 0.6rem;
      border-radius: 0.7rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .article-page.html-source :global(main) {
      padding-inline: 0.35rem;
    }
  }

  @media (min-width: 768px) { .prose :global(img) { max-width: 30rem; margin: 1.5rem auto; } }
  :global(.article-content img) { cursor: zoom-in; border-radius: 15px; background: #f0f0f0; box-shadow: 0 10px 25px rgba(0,0,0,.5); padding: 1px; }
  .image-zoom {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .image-zoom::backdrop { background: rgba(0, 0, 0, 0.82); }

  .image-zoom-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 3.5rem 1rem;
    cursor: zoom-out;
  }

  .image-zoom-close img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0.5rem;
  }

  .image-zoom-hint {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: white;
  }

  @media (prefers-reduced-motion: no-preference) {
    .image-zoom[open] { animation: zoom-fade-in 160ms ease-out; }
    @keyframes zoom-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  }

  :global(.dark .prose img) { background: #2a2a2a; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
  :global(.dark .article-content img) { background: #2a2a2a; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
</style>
