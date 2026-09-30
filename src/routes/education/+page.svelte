<script>
  import ProfilePage from '$lib/ProfilePage.svelte';
  import StyledTimeLine from '$lib/StyledTimeLine.svelte';
  import { educationTimeline, internshipData } from '$lib/data/educationData.js';
</script>

<svelte:head>
  <title>Education · Meerman</title>
  <meta name="description" content="Dries Meerman's formal education, software engineering studies, and internships." />
  <meta name="author" content="Dries Meerman" />
  <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA" />
</svelte:head>

<ProfilePage title="Education" description="Formal education and focused learning tracks that shaped my engineering path.">
  <section class="profile-section" aria-labelledby="education-studies">
    <div class="profile-section-head">
      <h2 id="education-studies" class="profile-section-title">01 / Formal education</h2>
      <span class="profile-section-count">{educationTimeline.length} entries</span>
    </div>
    <StyledTimeLine timeLineItems={educationTimeline} />
  </section>

  <section class="profile-section" aria-labelledby="education-internships">
    <div class="profile-section-head">
      <h2 id="education-internships" class="profile-section-title">02 / Internships</h2>
      <span class="profile-section-count">{internshipData.length} entries</span>
    </div>
    <StyledTimeLine timeLineItems={internshipData} />
  </section>
</ProfilePage>
