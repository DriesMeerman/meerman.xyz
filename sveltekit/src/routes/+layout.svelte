<script>
  import favicon from '$lib/assets/favicon.svg';
  import '../app.css';
  import Menu from '$lib/Menu.svelte';
  import Particles from '$lib/Particles.svelte';
  import { darkMode, particlesEnabled } from '$lib/state';
  let { children } = $props();
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', $darkMode);
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
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
    <div class="particle-background" class:fade-in={$particlesEnabled} class:fade-out={!$particlesEnabled}>
      <Particles class="h-full border-1" />
    </div>
  </div>
</div>

<style>
  @media (min-width: 640px) {
    main { max-width: none; }
  }
  .wrapper { position: relative; }
  .wrapper main { position: relative; z-index: 1; }
  .wrapper .particle-background { position: fixed; z-index: 0; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; }
  .fade-in { animation: fadeIn 3s; }
  .fade-out { animation: fadeOut 2s; opacity: 0; }
  :global(body) { color: #e5e7eb; }
  :global(a) { color: inherit; text-decoration-color: #60a5fa; }
  :global(nav a) { color: #e5e7eb; }
  :global(nav a:hover) { color: #38bdf8; }
  :global(nav a.font-semibold) { color: #e5e7eb; }
  @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
</style>
