<script>
  import { resolve } from '$app/paths';
  import { company, getCompanyEmail } from '$lib/data/companyData.js';

  let email = $state('');

  function revealEmail() {
    email = getCompanyEmail();
  }

</script>

<svelte:head>
  <title>Meerman Industries · Software development</title>
  <meta name="description" content="Meerman Industries is the software development company of Dries Meerman, based in Amsterdam. Company details and business contact." />
  <link rel="canonical" href="https://meerman.xyz/industries" />
  <meta property="og:title" content="Meerman Industries" />
  <meta property="og:description" content="Software development by Dries Meerman. Based in Amsterdam, the Netherlands." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://meerman.xyz/industries" />
</svelte:head>

<div class="industries profile-theme">
  <div class="page-marker">
    <span><span class="marker-cross" aria-hidden="true">+</span> MEERMAN / INDUSTRIES</span>
    <span>AMS · NL</span>
  </div>

  <section class="intro" aria-labelledby="company-title">
    <div class="intro-copy">
      <p class="eyebrow">Independent software development</p>
      <h1 id="company-title">Meerman<span>Industries<span class="title-dot">.</span></span></h1>
      <p class="intro-body">
        Meerman Industries is the company behind my software development work.
        I'm <a href={resolve('/')}>Dries Meerman</a>, a software engineer based in Amsterdam.
      </p>
      <div class="intro-links">
        <a href="#contact">Business contact <span aria-hidden="true">↘</span></a>
        <a href={resolve('/skills')}>Explore my skills <span aria-hidden="true">↗</span></a>
      </div>
    </div>

    <div class="identity-card" aria-label="Meerman Industries company card">
      <div class="card-topline"><span>MEERMAN INDUSTRIES</span><span aria-hidden="true">01 / MI</span></div>
      <div class="emblem-window" aria-hidden="true">
        <span class="window-coordinate">52° N / 04° E</span>
        <svg class="monogram" viewBox="0 0 240 180" fill="none">
          <path class="circuit" d="M0 44H34L54 64H88M240 132H202L182 112H152M24 156H64L84 136M216 24H180L160 44" />
          <path class="monogram-shadow" d="M56 126V54L94 94L132 54V126M166 54V126M154 54H178M154 126H178" />
          <path class="monogram-line" d="M50 120V48L88 88L126 48V120M160 48V120M148 48H172M148 120H172" />
          <circle class="circuit-node" cx="34" cy="44" r="3" /><circle class="circuit-node" cx="202" cy="132" r="3" />
        </svg>
        <span class="window-caption">SOFTWARE / SYSTEMS / CODE</span>
      </div>
      <div class="card-name">Meerman<br />Industries</div>
      <div class="card-tags"><span>Software</span><span>Eenmanszaak</span></div>
      <div class="card-bottomline"><span>KVK {company.kvkNumber}</span><span>AMSTERDAM</span></div>
    </div>
  </section>

  <div class="section-divider" aria-hidden="true"><span>THE DETAILS</span><span>↓</span></div>

  <div class="details-grid">
    <section class="detail-card registry" aria-labelledby="registry-title">
      <div class="section-label"><span>01 / REGISTER</span><span aria-hidden="true">[ MI ]</span></div>
      <h2 id="registry-title">Company identity</h2>
      <dl>
        <div><dt>Trade name</dt><dd>{company.name}</dd></div>
        <div><dt>Proprietor</dt><dd>{company.proprietor}</dd></div>
        <div><dt>Activity</dt><dd>{company.activity}</dd></div>
        <div><dt>Legal form</dt><dd>{company.legalForm} <span class="secondary-value">/ sole proprietorship</span></dd></div>
        <div><dt>KVK number</dt><dd class="registration-number">{company.kvkNumber}</dd></div>
        <div><dt>Establishment no.</dt><dd class="registration-number">{company.establishmentNumber}</dd></div>
        <div><dt>Based in</dt><dd>{company.city}, {company.country}</dd></div>
        {#if company.vatId}
          <div><dt>VAT ID / btw-id</dt><dd class="registration-number">{company.vatId}</dd></div>
        {/if}
      </dl>
    </section>

    <section id="contact" class="detail-card contact" aria-labelledby="contact-title">
      <div class="section-label"><span>02 / CONTACT</span><span aria-hidden="true">↗</span></div>
      <h2 id="contact-title">A direct line.</h2>
      <p class="section-description">For questions about Meerman Industries and my software work.</p>
      <div class="email-window">
        <span class="email-label">BUSINESS EMAIL</span>
        <button class="email-image-button" type="button" onclick={revealEmail} aria-label="Reveal the Meerman Industries business email address" aria-controls="revealed-email" aria-expanded={Boolean(email)}>
          <picture>
            <source type="image/avif" srcset="/g/assets/industries-contact-400.avif 400w, /g/assets/industries-contact-800.avif 800w" sizes="(min-width: 1100px) 400px, (min-width: 640px) 600px, calc(100vw - 112px)" />
            <source type="image/webp" srcset="/g/assets/industries-contact-400.webp 400w, /g/assets/industries-contact-800.webp 800w" sizes="(min-width: 1100px) 400px, (min-width: 640px) 600px, calc(100vw - 112px)" />
            <img src="/assets/industries-contact.png" alt="Business email in magazine cut-letter artwork. Use the reveal email button for a text version." width="1877" height="838" />
          </picture>
        </button>
      </div>
      <div class="contact-actions">
        {#if email}
          <a class="contact-primary" href={`mailto:${email}`}>Write an email <span aria-hidden="true">↗</span></a>
        {:else}
          <button type="button" class="contact-primary" onclick={revealEmail} aria-controls="revealed-email" aria-expanded="false">Reveal email <span aria-hidden="true">↗</span></button>
        {/if}
      </div>
      <div id="revealed-email" class="revealed-email" aria-live="polite">
        {#if email}<a href={`mailto:${email}`}>{email}</a>{/if}
      </div>
      <noscript><p class="noscript-note">JavaScript is needed to reveal the text address. You can still read the email address in the image above and type it into your email app.</p></noscript>
      {#if company.phone}
        <p class="phone-contact">Telephone: <a href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}>{company.phone}</a></p>
      {/if}
      <div class="contact-signoff"><span>Dries Meerman</span><span>Meerman Industries</span></div>
    </section>
  </div>

  <div class="page-end"><a href={resolve('/')}>Back to Meerman <span aria-hidden="true">↗</span></a></div>
</div>

<style>
  .industries {
    --ink: var(--profile-ink);
    --muted: var(--profile-muted);
    --accent: var(--profile-accent);
    --line: var(--profile-line);
    --surface: var(--profile-surface);
    --inset: var(--profile-inset);
    --cyan: var(--profile-cyan);
    --pink: var(--profile-pink);
    color: var(--ink);
    max-width: 1120px;
    margin: 0 auto;
  }
  .page-marker, .eyebrow, .card-topline, .card-bottomline, .window-coordinate, .window-caption,
  .card-tags, .section-divider, .section-label, .email-label, .page-end {
    font-family: var(--profile-meta-font);
  }
  .page-marker { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--line); font-size: .67rem; letter-spacing: .12em; color: var(--muted); }
  .marker-cross { color: var(--accent); font-size: 1rem; margin-right: .5rem; }
  .intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(230px, .68fr); gap: 2.5rem; align-items: center; padding: 3.5rem 0; }
  .eyebrow { color: var(--accent); font-size: .68rem; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 1.3rem; }
  h1 { font-family: var(--profile-display-font); font-size: clamp(1.55rem, 3.1vw, 3.1rem); line-height: 1.27; letter-spacing: -.045em; margin: 0; }
  h1 > span { display: block; }
  .title-dot { color: var(--accent); }
  .intro-body { color: var(--muted); font-size: .95rem; line-height: 1.75; max-width: 30rem; }
  .intro-body a { text-decoration: underline; text-underline-offset: 3px; }
  .intro-links { display: flex; flex-wrap: wrap; gap: 1rem 1.4rem; margin-top: 1.8rem; font-size: .8rem; font-weight: 600; }
  .intro-links a { border-bottom: 1px solid var(--accent); padding-bottom: .35rem; }
  .intro-links a span { color: var(--accent); margin-left: .3rem; }
  .identity-card { position: relative; width: 100%; max-width: 330px; justify-self: end; border: 1px solid var(--line); border-radius: 1rem; padding: 1rem; background: linear-gradient(130deg, #54cfc329, #8299e424 60%, #eb96bf30), var(--surface); box-shadow: 1px 2px 5px #174c4c40, inset 0 0 0 5px #ffffff0a; }
  .identity-card::after { content: ''; position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); border-radius: 0 .65rem 0 0; }
  .card-topline, .card-bottomline { display: flex; justify-content: space-between; gap: .5rem; font-size: .56rem; letter-spacing: .03em; color: var(--muted); }
  .card-topline { padding: .3rem .15rem .8rem; }
  .emblem-window { position: relative; height: 180px; margin-bottom: 1.1rem; overflow: hidden; border: 1px solid var(--line); border-radius: .5rem; background: repeating-linear-gradient(0deg, transparent, transparent 19px, #77a5ad18 19px, #77a5ad18 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #77a5ad18 19px, #77a5ad18 20px), var(--inset); box-shadow: inset 1px 1px 3px #00000028; }
  .window-coordinate, .window-caption { position: absolute; left: .65rem; color: var(--muted); font-size: .5rem; letter-spacing: .08em; }
  .window-coordinate { top: .55rem; }
  .window-caption { bottom: .55rem; }
  .monogram { display: block; width: 100%; height: 100%; }
  .circuit { stroke: var(--accent); stroke-width: 1; opacity: .45; }
  .circuit-node { fill: var(--accent); }
  .monogram-shadow { stroke: var(--pink); stroke-width: 7; stroke-linejoin: bevel; }
  .monogram-line { stroke: var(--accent); stroke-width: 7; stroke-linejoin: bevel; }
  .card-name { font-family: var(--profile-display-font); font-size: 1.3rem; line-height: 1.5; padding-bottom: .6rem; border-bottom: 1px solid var(--line); }
  .card-tags { display: flex; gap: .5rem; margin: .8rem 0 1.35rem; font-size: .55rem; text-transform: uppercase; letter-spacing: .06em; }
  .card-tags span { padding: .4rem .5rem; background: #789b9b16; box-shadow: inset 1px 1px 2px #00000025; border-radius: .15rem; }
  .card-bottomline { border-top: 1px solid var(--line); padding-top: .6rem; }
  .section-divider { display: flex; justify-content: space-between; color: var(--muted); font-size: .6rem; letter-spacing: .15em; border-top: 1px solid var(--line); padding: 1rem 0; }
  .details-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 1.2rem; }
  .detail-card { min-width: 0; padding: 1.6rem; border: 1px solid var(--line); border-radius: var(--profile-radius); background: var(--surface); box-shadow: var(--profile-shadow); }
  .registry { background: linear-gradient(135deg, #43cbc411, transparent 65%), var(--surface); }
  .contact { background: linear-gradient(135deg, #679ddf12, #e29cb41a), var(--surface); scroll-margin-top: 1rem; }
  .section-label { display: flex; justify-content: space-between; color: var(--accent); font-size: .61rem; letter-spacing: .1em; margin-bottom: 1.6rem; }
  h2 { font-family: var(--profile-display-font); font-size: 1rem; line-height: 1.5; margin-bottom: .65rem; }
  .section-description { color: var(--muted); font-size: .85rem; line-height: 1.65; }
  dl { margin-top: 1.5rem; }
  dl > div { display: grid; grid-template-columns: 115px minmax(0, 1fr); gap: .75rem; padding: .8rem 0; border-top: 1px solid var(--line); font-size: .78rem; line-height: 1.5; }
  dt { color: var(--muted); }
  dd { overflow-wrap: anywhere; }
  .registration-number { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .04em; }
  .secondary-value { display: block; font-size: .7rem; color: var(--muted); }
  .email-window { margin-top: 1.5rem; background: #142d38; color: #dcecef; border-radius: .5rem; padding: .85rem .6rem; border: 1px solid #527c86; box-shadow: inset 1px 1px 4px #00000045; }
  .email-label { display: block; padding: 0 .25rem .65rem; font-size: .56rem; letter-spacing: .12em; color: #b9d9dd; }
  .email-image-button { display: block; width: 100%; padding: 0; border: 0; cursor: pointer; background: transparent; border-radius: .25rem; }
  .email-image-button img { width: 100%; height: auto; display: block; }
  .contact-actions { display: flex; flex-wrap: wrap; gap: .7rem; align-items: center; margin-top: 1.3rem; }
  .contact-primary { font-size: .78rem; padding: .7rem .85rem; border-radius: .25rem; cursor: pointer; font-weight: 600; }
  .contact-primary { background: var(--cyan); color: #183d42; border: 1px solid #388a91; box-shadow: 2px 2px 0 #183d4240; }
  .contact-primary span { margin-left: .5rem; }
  .revealed-email { margin-top: 1rem; font-size: .8rem; overflow-wrap: anywhere; }
  .revealed-email a { text-decoration: underline; text-underline-offset: 3px; }
  .noscript-note, .phone-contact { color: var(--muted); font-size: .8rem; line-height: 1.6; margin-top: 1rem; }
  .contact-signoff { display: flex; flex-direction: column; gap: .2rem; border-top: 1px solid var(--line); margin-top: 1.5rem; padding-top: 1rem; font-size: .8rem; }
  .contact-signoff span + span { color: var(--muted); font-size: .7rem; }
  .page-end { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1.5rem .1rem; font-size: .6rem; line-height: 1.6; color: var(--muted); }
  .page-end a { text-decoration: underline; text-underline-offset: 3px; }
  a, button { transition: color 180ms ease, background-color 180ms ease; }
  a:hover { color: var(--accent); }
  .contact-primary:hover { background: #c3f4ef; color: #183d42; }
  a:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 5px; }
  .email-image-button:focus-visible { outline-color: #82e6ed; }
  @media (max-width: 1100px) {
    .intro { gap: 1.5rem; }
    .details-grid { grid-template-columns: minmax(0, 1fr); }
    .detail-card { padding: 1.4rem; }
  }
  @media (max-width: 760px) {
    .intro { grid-template-columns: minmax(0, 1fr); padding: 2.5rem 0; gap: 2rem; }
    h1 { font-size: clamp(1.55rem, 6.5vw, 2.5rem); }
    .identity-card { justify-self: center; }
    .intro-body { max-width: none; }
  }
  @media (max-width: 380px) {
    .detail-card { padding: 1rem; }
    dl > div { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
    .page-marker { letter-spacing: .03em; font-size: .57rem; }
  }
  @media (prefers-reduced-motion: reduce) { a, button { transition: none; } }
</style>
