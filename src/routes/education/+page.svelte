<script>
  import Card from '$lib/Card.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { educationTimeline, internshipData } from '$lib/data/educationData.js';
  const timelineItems = educationTimeline;
  const internships = internshipData;
</script>

<svelte:head>
  <title>Meerman</title>
  <meta name="description" content="A list of formal education that Dries followed.">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA">
</svelte:head>

<div class="education-page">
  <Card class="pb-6 px-4 md:px-7 flex-col">
    <div class="page-head">
      <h1>Education</h1>
      <p>Formal education and focused learning tracks that shaped my engineering path.</p>
    </div>
    <StyledTimeLine timeLineItems={timelineItems} />
  </Card>

  <Card class="pb-6 px-4 md:px-7 flex-col">
    <div class="section-head">
      <h2>Internships</h2>
    </div>
    <StyledTimeLine timeLineItems={internships} />
  </Card>
</div>

<style>
  .education-page {
    display: grid;
    gap: 1rem;
  }

  .page-head,
  .section-head {
    text-align: center;
    padding: 1.35rem 0.75rem 0.85rem;
  }

  .page-head h1,
  .section-head h2 {
    margin: 0;
    letter-spacing: -0.02em;
    color: #0f172a;
    font-weight: 800;
  }

  .page-head h1 {
    font-size: clamp(1.5rem, 2.4vw, 2rem);
  }

  .section-head h2 {
    font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  }

  .page-head p {
    margin: 0.5rem auto 0;
    max-width: 56ch;
    color: #475569;
    font-size: 0.92rem;
  }

  :global(.dark .page-head h1),
  :global(.dark .section-head h2) {
    color: #f8fafc;
  }

  :global(.dark .page-head p) {
    color: #cbd5e1;
  }
</style>
