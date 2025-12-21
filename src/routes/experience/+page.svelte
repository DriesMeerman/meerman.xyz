<script>
  import Card from '$lib/Card.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { workData } from '$lib/data/workExperienceData.js';
  const work = workData;
  let uniqueTitles = [...new Set(work.map((item) => item.title))];
</script>

<div>
  <Card class="pb-6 flex-col">
    <h1 class="text-center my-4 font-bold text-lg">Experience</h1>
    <StyledTimeLine timeLineItems={work} />
  </Card>
</div>

<svelte:head>
  <title>Meerman</title>
  <meta name="description" content="A list of work experiences">
  <meta name="author" content="Dries Meerman">
  <meta name="keywords" content={`Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, ${uniqueTitles.join(', ')}`}>
</svelte:head>
