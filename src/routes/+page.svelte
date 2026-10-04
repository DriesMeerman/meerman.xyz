<script>
  import { resolve } from '$app/paths';
  import Person from '$lib/home/Person.svelte';
  import Socials from '$lib/home/Socials.svelte';
  import { company } from '$lib/data/companyData.js';
</script>

<svelte:head>
  <title>Dries Meerman · Software engineer &amp; engineering manager</title>
  <meta name="description" content="Dries Meerman is a software engineer, engineering manager, technologist, and nerd based in Amsterdam. My background, interests, work, and writing." />
</svelte:head>

<div class="home-profile profile-theme">
  <div class="page-marker">
    <span class="marker-cross" aria-hidden="true">+</span>
    <span>MEERMAN / PROFILE</span>
  </div>

  <Person>
    {#snippet heading()}
      <h1 id="person-title">Dries <span>Meerman<span class="title-dot" aria-hidden="true">.</span></span></h1>
      <p class="hero-role">Software engineer &amp; engineering manager.</p>
    {/snippet}
    <p class="hero-intro">
      Technologist and nerd. I enjoy building flexible systems, learning how things work, and helping people grow.
    </p>
    <a class="company-intro" href={resolve('/industries')} aria-labelledby="home-company-name" aria-describedby="home-company-description">
      <span class="company-symbol" aria-hidden="true">
        <svg viewBox="40 38 142 92" fill="none">
          <path d="M50 120V48L88 88L126 48V120M160 48V120M148 48H172M148 120H172" stroke="currentColor" stroke-width="7" stroke-linejoin="bevel" />
        </svg>
      </span>
      <span class="company-copy">
        <span id="home-company-name" class="company-name">{company.name}</span>
        <span id="home-company-description" class="company-description">My software development company</span>
      </span>
      <span class="company-arrow" aria-hidden="true">↗</span>
    </a>
  </Person>

  <div class="biography-grid">
    <section class="bio-card profile-panel" aria-labelledby="background-title">
      <p class="card-label" aria-hidden="true">01 / Background</p>
      <h2 id="background-title">How I got here</h2>
      <p>
        It started with a Game Boy Color and Pokémon Gold. Minecraft, especially ComputerCraft, got me
        writing <a href="https://lua.org/">Lua</a> to automate things in-game. Programming quickly became
        the thing I wanted to get better at.
      </p>
      <p>
        I <a href={resolve('/education')}>studied software engineering</a> and started working at Plat4mation while
        I was still a student. At the startup, I got to design applications as well as implement features.
      </p>
      <p>
        That path took me from development to architecture and, now, engineering management. These days I
        manage a team of 10, with a focus on helping people grow.
      </p>
    </section>

    <section class="bio-card personal-card profile-panel" aria-labelledby="interests-title">
      <p class="card-label" aria-hidden="true">02 / Off the clock</p>
      <h2 id="interests-title">Outside the screen</h2>
      <p>
        Desk work needs a counterbalance. I go to the gym, and in summer I like longboarding along smooth paths.
      </p>
      <p>
        I also enjoy 3D printing, mostly small trinkets for now. My modelling skills still have room to grow.
      </p>
      <p>
        I share my home with <a href={resolve('/cats')}>two cats</a>, Henrietta and Gina. Also known as Fen Fen, Gina Beena,
        Joony B Coots, Juniper Breeze, Foonry Winks, or just the Coots.
      </p>
    </section>
  </div>

  <section class="connections profile-section" aria-labelledby="connections-title">
    <div class="profile-section-head">
      <h2 id="connections-title" class="profile-section-title">03 / Find me elsewhere</h2>
    </div>
    <Socials />
  </section>
</div>

<style>
  .home-profile { max-width: 1120px; margin: 0 auto; }
  .page-marker { display: flex; gap: .75rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--profile-line); color: var(--profile-muted); font-family: var(--profile-meta-font); font-size: .67rem; line-height: 1.6; letter-spacing: .12em; }
  .marker-cross { color: var(--profile-accent); font-size: 1rem; }

  h1 {
    margin: 0;
    font-family: var(--profile-display-font);
    font-size: clamp(1.65rem, 4.8vw, 2.25rem);
    line-height: 1.3;
    letter-spacing: -.045em;
  }

  h1 > span { display: block; }
  .title-dot { color: var(--profile-accent); }
  .hero-role { margin: 1rem 0 0; color: var(--profile-ink); font-size: .9rem; font-weight: 500; line-height: 1.6; }
  .hero-intro { margin: 0; max-width: 45ch; color: var(--profile-muted); font-size: .95rem; line-height: 1.75; }
  .company-intro { display: flex; align-items: center; gap: .75rem; width: fit-content; max-width: 100%; margin-top: 1.35rem; padding: .65rem .85rem; border: 1px solid var(--profile-line); border-radius: .35rem; background: var(--profile-inset); color: var(--profile-ink); text-decoration: none; }
  .company-symbol { display: flex; align-items: center; justify-content: center; flex: 0 0 2.2rem; height: 2.2rem; border: 1px solid var(--profile-line); border-radius: .2rem; color: var(--profile-accent); }
  .company-symbol svg { width: 1.7rem; height: 1.2rem; }
  .company-copy { display: flex; flex-direction: column; gap: .2rem; min-width: 0; }
  .company-name { font-size: .8rem; font-weight: 600; line-height: 1.5; }
  .company-description { color: var(--profile-muted); font-size: .68rem; line-height: 1.6; }
  .company-arrow { margin-left: .4rem; color: var(--profile-accent); }
  .company-intro:hover { border-color: var(--profile-accent); }

  .biography-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.2rem; }
  .bio-card { padding: 1.6rem; min-width: 0; }
  .personal-card { background: linear-gradient(135deg, #679ddf12, #e29cb414), var(--profile-surface); }
  .card-label { margin: 0 0 1.25rem; color: var(--profile-accent); font-family: var(--profile-meta-font); font-size: .61rem; line-height: 1.6; letter-spacing: .1em; text-transform: uppercase; }
  .bio-card h2 { margin: 0 0 1rem; font-family: var(--profile-display-font); font-size: 1rem; font-weight: 400; line-height: 1.6; }
  .bio-card p:not(.card-label) { margin: 0 0 1rem; color: var(--profile-muted); font-size: .9rem; line-height: 1.75; }
  .bio-card p:last-child { margin-bottom: 0; }
  .bio-card p a { text-decoration: underline; text-decoration-color: var(--profile-accent); text-underline-offset: 3px; }
  .bio-card p a:hover { color: var(--profile-accent); }

  .connections { margin-top: 2.5rem; }

  a:focus-visible { outline: 2px solid var(--profile-accent); outline-offset: 4px; }

  @media (min-width: 1024px) {
    h1 { font-size: clamp(2.4rem, 4vw, 3.8rem); }
    .hero-role { font-size: 1.05rem; }
  }

  @media (max-width: 1023px) {
    .biography-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .bio-card { padding: 1.2rem; }
  }

  @media (max-width: 380px) {
    .page-marker { font-size: .6rem; letter-spacing: .05em; }
    .hero-role { font-size: .8rem; }
  }
</style>
