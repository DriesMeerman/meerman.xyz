<script>
  import { darkMode, toggleDarkMode, particlesEnabled, toggleParticles } from '$lib/state';
  let darkModeIconFill = $state('black');
  let particleText = $state('Disable particles');
  let expanded = $state(false);
  const menuItems = [
    { href: '/skills', text: 'Skills' },
    { href: '/experience', text: 'Experience' },
    { href: '/education', text: 'Education' },
    { href: '/tools', text: 'Tools' },
    { href: '/blog', text: 'Blog' }
  ];
  $effect(() => {
    darkModeIconFill = $darkMode ? 'white' : 'black';
    particleText = $particlesEnabled ? 'Disable particles' : 'Enable particles';
  });
  function getIconClass(isDarkMode) {
    return `icon-hover ${isDarkMode ? 'dark:fill-white' : 'fill-black'}`;
  }
  function menuItemClicked() {
    expanded = false;
    if (typeof window !== 'undefined' && window.tinylytics) window.tinylytics.triggerUpdate();
  }
</script>

<nav class="border-b-2 border-teal-500 dark:border-sky-600 dark:bg-zinc-700 flex items-center justify-between flex-wrap p-2 pt-1 duration-500">
  <div class="flex items-center flex-shrink-0 dark:text-white mr-6 justify-between w-full sm:w-20">
    <a href="/" class="font-semibold text-xl tracking-tight">Meerman</a>
    <div class="sm:hidden mr-4 flex">
      <button type="button" class=" text-gray-500 hover:text-white focus:text-white focus:outline-none transition" onclick={() => (expanded = !expanded)}>
        <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
          {#if expanded}
            <path fill-rule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/>
          {:else}
            <path fill-rule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
          {/if}
        </svg>
      </button>
    </div>
  </div>
  {#if expanded}
    <hr class="w-full dark:border-zinc-50/25 border-zinc-800/25 mt-1 sm:hidden" />
  {/if}
  <div class="w-full block flex-grow sm:flex sm:items-center sm:w-auto sm:h-7 transition-all duration-500 sm:overflow-visible overflow-hidden {expanded ? 'max-h-48' : 'max-h-0'}">
    <div class="text-sm sm:flex sm:flex-grow">
      {#each menuItems as item}
        <a onclick={menuItemClicked} href={item.href} class="block mtop-6 mt-4 lg:inline-block lg:mt-0 text-teal-900 dark:text-white dark:hover:text-sky-600 mr-4 hover:text-teal-600">
          {item.text}
        </a>
      {/each}
    </div>
    <div class="flex flex-row mt-2 sm:mt-0 gap-4 sm:gap-2">
      <div class="hover:animate-pulse" title={particleText} role="button" tabindex="0" onclick={() => toggleParticles()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toggleParticles(); e.preventDefault(); } }}>
        <svg class={getIconClass($darkMode)} width="24px" height="24px" viewBox="0 0 16 16">
          <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" />
        </svg>
      </div>
      <div>
        <div tabindex="0" class="cursor-pointer mtop-0 sm:mtop-6" role="button" onclick={toggleDarkMode} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toggleDarkMode(); e.preventDefault(); } }} title={$darkMode ? 'Lightmode' : 'Darkmode'}>
          <svg class={getIconClass($darkMode)} width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16V20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</nav>

<style>
  .mtop-6 { margin-top: 6px; }
  .icon-hover { transition: transform 0.3s ease; }
  .icon-hover:hover { transform: scale(1.1); fill: #64748b; }
  :global(.dark) .icon-hover:hover { fill: #94a3b8; }
</style>

