<script>
    import Card from "../components/Card.svelte";
    import DrawingOne from "../components/DrawingOne.svelte";
</script>

<svelte:head>
    <title>Meerman</title>
    <meta name="description" content="">
    <meta name="author" content="Dries Meerman">
    <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA">
</svelte:head>

<div>
    <!-- <h1 class="pb-8 text-3xl font-semibold">Canvas visualizations</h1> -->
    <h2 class="text-xl pb-4">Debug lines</h2>
    <Card class="flex-col">
        <DrawingOne></DrawingOne>
    </Card>
</div>
