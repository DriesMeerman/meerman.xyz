<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { workData } from '$lib/data/workExperienceData.js';

  const uniqueTitles = [...new Set(workData.map((item) => item.title))];
</script>

<svelte:head>
  <title>Experience · Meerman</title>
  <meta name="description" content="Dries Meerman's engineering and leadership roles, responsibilities, and product milestones." />
  <meta name="author" content="Dries Meerman" />
  <meta name="keywords" content={'Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, ' + uniqueTitles.join(', ')} />
</svelte:head>

<ProfilePage title="Experience" description="My engineering and management roles.">
  <section class="profile-section" aria-labelledby="experience-roles">
    <div class="profile-section-head">
      <h2 id="experience-roles" class="profile-section-title">01 / Roles &amp; responsibilities</h2>
      <span class="profile-section-count">{workData.length} entries</span>
    </div>
    <StyledTimeLine timeLineItems={workData} />
  </section>
</ProfilePage>
