<script>
    import StyledTimeLine from "../components/StyledTimeLine.svelte";
    import Card from "../components/Card.svelte";
    import { workData, internshipData } from "../data/workExperienceData.js";

    const work = workData;
    const internships = internshipData;

    let uniqueTitles = [...new Set([...work.map(item => item.title), ...internships.map(item => item.title)])];

</script>


<div>
    <Card class="pb-6 flex-col">
        <h1 class="text-center my-4 font-bold text-lg">Experience</h1>
        <StyledTimeLine timeLineItems="{work}"></StyledTimeLine>
    </Card>

    <Card class="pb-6 flex-col mt-6">
        <h1 class="text-center my-4">Internships</h1>
        <StyledTimeLine timeLineItems="{internships}"></StyledTimeLine>
    </Card>
</div>

<svelte:head>
    <title>Meerman</title>
    <meta name="description" content="A list of work experiences">
    <meta name="author" content="Dries Meerman">
    <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, {uniqueTitles.join(', ')}">
</svelte:head>