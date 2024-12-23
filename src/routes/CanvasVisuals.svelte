<script>
    import { onDestroy } from "svelte";
    import Card from "../components/Card.svelte";
    import DrawingOne from "../components/Visuals/DrawingOne.svelte";
    import { particlesEnabled } from "../state";


    particlesEnabled.set(false);

    onDestroy(() => {
        particlesEnabled.set(true);
    });
</script>

<svelte:head>
    <title>Meerman</title>
    <meta name="description" content="">
    <meta name="author" content="Dries Meerman">
    <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Master, MSc, Bachelor, BSc, University of Amsterdam, UvA, HvA">
</svelte:head>

<div>
    <div class="pt-4 pb-24">
    <p>This page consists of experiments with HTML canvases and me just having some fun with them.</p>
    </div>

    <h2 class="text-xl pb-4 select-none">
        <span># 1</span>
        Debug lines
    </h2>
    <Card class="flex-col">
        <DrawingOne></DrawingOne>
    </Card>
</div>
