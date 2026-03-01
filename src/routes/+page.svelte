<script>
  import Particles from '$lib/Particles.svelte';
  import Person from '$lib/home/Person.svelte';
  import Socials from '$lib/home/Socials.svelte';
  import { particlesEnabled } from '$lib/state';
</script>

<Person>
  <p class="max-w-3/4 sm:text-justify">
    My name is Dries Meerman, I'm a Software Engineer, technologist and nerd.
    My interrest in technology started early with a Game Boy Color which I used to mainly play Pokemon Gold.
    This gaming journey eventually let me to Minecraft and specifically a mod called ComputerCraft which allowed
    me to automate things in the game using <a class="underline" href="https://lua.org/">Lua</a>.
    Programming from that point on became the thing I wanted focus on and improve my skills. <br/><br/>

    After high school this led me to do a bachelor degree majoring in Software Engineering.
    While studying, there was a lot of opportunity to connect with the development industry. This gave me the chance to start working at a startup (Plat4mation) while still studying.
    At Plat4mation I was able to grow my skills fast, because at the time it was a small startup, so I was given opportunities and responsibilities.
    During my career I've enjoyed building systems rather than specific features that can be configured to allow them to be used in flexible rather than in rigid ways. <br/><br/>

    My profession primarily involves desk-based work, to balance this out a I like going to the gym to get physical energy out and keep my endurance up.
    In the summers I enjoy to go longboarding gliding across preferably smooth paths.
    I'm also a hobbyist 3D printer, it is a great intersection between digital and physical.
    It can be practical but I mainly enjoy printing small trinkets found online as my 3D modelling skills could be improved.
    I have <a class="underline" href="/cats">two cats</a>, Henrietta and Gina, they are commonly known as Fen Fen, Gina Beena, Joony B Coots, Juniper Breeze and Foonry Winks or just the Coots.
  </p>
</Person>

<div class="mt-12">
  <Socials />
</div>

<div class="particle-background" class:fade-in={$particlesEnabled} class:fade-out={!$particlesEnabled}>
  {#if $particlesEnabled}
    <Particles class="h-full border-1" />
  {/if}
</div>

<style>
  .particle-background {
    position: fixed;
    z-index: 0;
    inset: 0;
    pointer-events: none;
  }

  .fade-in { animation: fadeIn 3s; }
  .fade-out { animation: fadeOut 2s; opacity: 0; }

  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
