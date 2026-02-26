<script>
  import Card from '$lib/Card.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { workData } from '$lib/data/workExperienceData.js';
  const work = workData;
  let uniqueTitles = [...new Set(work.map((item) => item.title))];
</script>

<div class="experience-page">
  <Card class="pb-6 px-4 md:px-7 flex-col">
    <div class="page-head">
      <h1>Experience</h1>
      <p>A timeline of roles, ownership shifts, and product milestones.</p>
    </div>
    <StyledTimeLine timeLineItems={work} />
  </Card>
</div>

<svelte:head>
  <title>Meerman</title>
  <meta name="description" content="A list of work experiences">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content={`Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, ${uniqueTitles.join(', ')}`}>
</svelte:head>

<style>
  .experience-page {
    display: grid;
    gap: 1rem;
  }

  .page-head {
    text-align: center;
    padding: 1.35rem 0.75rem 0.85rem;
  }

  .page-head h1 {
    margin: 0;
    font-size: clamp(1.5rem, 2.4vw, 2rem);
    letter-spacing: -0.02em;
    color: #0f172a;
    font-weight: 800;
  }

  .page-head p {
    margin: 0.5rem auto 0;
    max-width: 52ch;
    color: #475569;
    font-size: 0.94rem;
  }

  :global(.dark .page-head h1) {
    color: #f8fafc;
  }

  :global(.dark .page-head p) {
    color: #cbd5e1;
  }
</style>
