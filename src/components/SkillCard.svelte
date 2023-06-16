<script>
    
    export let title = "Tailwind CSS";
    export let description = "Tailwind css is a utility first css framework. It allows you to build custom components with ease.";
    export let image = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2048px-Tailwind_CSS_Logo.svg.png";
    export let alt
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bruno+Ace&display=swap" rel="stylesheet"> 
</svelte:head>

<div class="skill-card flex flex-col h-80 w-48 border-solid border-teal rounded-lg bg-gradient-to-r from-purple-500/25 to-pink-500/25">

    <div class="skill-logo border-solid border-2 border-white/10 h-36 w-36 mx-4 mt-4 self-center p-2 rounded-lg">
        <img alt="{alt || `${title} logo`}" class="image h-full w-full" src="{image}"/>
    </div>
    <div class="skill-title m-4 ">
        {title}
        <hr class="max-w-[80%] dark:border-zinc-50 border-zinc-800">
    </div>
    <div class="description m-4 mt-auto">
        {description}
    </div>

</div>

<style>
    


    .description {
        font-size: 10px;
        font-family: monospace;
    }

    .skill-logo{
        box-shadow: inset 1px 1px 2px 1px #0000004f
    }

    .skill-title {
        font-family: 'Bruno Ace', cursive;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    /* :hover */
    .skill-card {
        transition: all ease 0.8s;
        /* box-shadow: 1px 1px 3px 0px rgba(0,255,255,0.7) */
        /* box-shadow: 1px 1px 3px 0px rgba(111, 125, 125, 0.7); */
        /* box-shadow: 1px 1px 3px 0px rgba(3, 4, 4, 0.7); */
        /* https://blog.logrocket.com/three-ways-style-css-box-shadow-effects/ */

        box-shadow: 1px 1px 3px 0px rgb(23 76 76 / 70%)

        /* box-shadow: 1px 1px 3px 0px rgb(153 166 166); */
    }

    :hover.skill-card {
        transition: all ease 0.4s;
        box-shadow: 1px 1px 3px 0px rgba(0,255,255,0.7);
        cursor: pointer;
    }

    :hover.skill-card {
        transition: all ease 0.8s;
        box-shadow: 0px 1px 2px 0px rgba(0,255,255,0.7),
            1px 2px 4px 0px rgba(0,255,255,0.7),
            2px 4px 12px 0px rgba(0,255,255,0.7);
            /* 2px 4px 16px 0px rgba(0,255,255,0.7); */
    }
</style>