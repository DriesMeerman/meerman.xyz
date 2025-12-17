<script>
  import Card from '$lib/Card.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { educationTimeline } from '$lib/data/educationData.js';
  const timelineItems = educationTimeline;
</script>

<svelte:head>
  <title>Meerman</title>
  <meta name="description" content="A list of formal education that Dries followed.">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA">
</svelte:head>

<div>
  <Card class="pb-6 flex-col">
    <h1 class="text-center my-4 font-bold text-lg">Education</h1>
    <StyledTimeLine timeLineItems={timelineItems} />
  </Card>
</div>

<style>
  :global(.timeline) {
    padding: 0 !important;
  }
</style>


