<script>
    
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bruno+Ace&display=swap" rel="stylesheet"> 
</svelte:head>

<div class="skill-card flex flex-col h-96 w-56 border-solid border-teal rounded-lg bg-gradient-to-r from-purple-500/25 to-pink-500/25">

    <div class="border-solid border-2 border-white/10 m-4 h-32">
        <img alt="logo" class="image h-full w-full" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2048px-Tailwind_CSS_Logo.svg.png"/>
    </div>
    <div class="skill-title m-4">
        Tailwind CSS
    </div>
    <div class="description m-4">
        Tailwind css is a utility first css framework. It allows you to build custom components with ease.
    </div>

</div>

<style>
    


    .description {
        font-size: 12px;
        /* background-color: #7f7c7c; */
        /* box-shadow: inset -10px -10px 15px rgba(255, 255, 255, 0.5), 
           inset 10px 10px 15px rgba(70, 70, 70, 0.12); */
           

    }

    .skill-title {
        font-family: 'Bruno Ace', cursive;
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