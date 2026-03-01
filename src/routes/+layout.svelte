<script>
  import { browser, dev } from '$app/environment';
  import '../app.css';
  import Menu from '$lib/Menu.svelte';
  import { darkMode } from '$lib/state';
  let { children } = $props();

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', $darkMode);
    }
  });

  $effect(() => {
    if (!browser || dev) return;

    const loadAnalytics = () => {
      if (document.querySelector('script[data-tinylytics]')) return;

      const script = document.createElement('script');
      script.src = 'https://tinylytics.app/embed/hGqRVSTNs4M9tmV5uNAn.js?spa';
      script.defer = true;
      script.dataset.tinylytics = 'true';
      document.body.appendChild(script);
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(loadAnalytics, 1500);
    return () => window.clearTimeout(timeoutId);
  });
</script>

<svelte:head>
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <title>Meerman</title>
  <meta name="description" content="A website showcasing Dries Meerman's skills, education, and experience he has accumulated over the years.">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering">
</svelte:head>

<div class="flex flex-col h-full">
  <Menu />
  <div class="wrapper flex flex-col flex-grow items-center">
    <main class="p-6 pt-12 w-full sm:w-2/3 dark:text-white mx-auto">
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  @media (min-width: 640px) {
    main { max-width: none; }
  }
  .wrapper { position: relative; }
  .wrapper main { position: relative; z-index: 1; }
  :global(body) {
    color: #1f2937;
    background-color: #f5f5f5;
  }
  :global(html.dark body) {
    color: #e5e7eb;
    background-color: #52525b; /* zinc-600 - original dark mode color */
  }
  :global(a) { color: inherit; text-decoration-color: #60a5fa; }
  :global(nav a) { color: #1f2937; }
  :global(html.dark nav a) { color: #e5e7eb; }
  :global(nav a:hover) { color: #0d9488; }
  :global(html.dark nav a:hover) { color: #38bdf8; }
  :global(nav a.font-semibold) { color: #1f2937; }
  :global(html.dark nav a.font-semibold) { color: #e5e7eb; }
</style>
