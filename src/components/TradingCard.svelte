<script>
    
    export let title = "";
    export let description = "";
    export let image;
    export let alt = null;
    export let items = [];

    export let gradient = 0;
    export let rarity = "common";

    let wasClicked = false;


    const colorPairs = [
        ["from-purple-500/25", "to-pink-500/25"],
        ["from-green-500/25", "to-blue-500/25"],
        ["from-yellow-500/25", "to-red-500/25"],
        ["from-pink-500/25", "to-purple-500/25"],
        ["from-blue-500/25", "to-green-500/25"],
        ["from-red-500/25", "to-yellow-500/25"],
        ["from-pink-500/25", "to-yellow-500/25"],
        ["from-blue-500/25", "to-purple-500/25"],
        ["from-red-500/25", "to-green-500/25"],
        ["from-purple-500/25", "to-blue-500/25"],
        ["from-green-500/25", "to-yellow-500/25"],
        ["from-yellow-500/25", "to-pink-500/25"],
        ["from-gray-500/25", "to-pink-300/25"],
        ["from-pink-400/25", "to-purple-600/25"],
    ];


    const colors = {
        "purple": "from-purple-500/25 to-pink-500/25",
        "green": "from-green-500/25 to-blue-500/25",
        "yellow": "from-yellow-500/25 to-red-500/25",
        "pink": "from-pink-500/25 to-purple-500/25",
        "blue": "from-cyan-500/25 to-blue-500/25",
        "red": "from-amber-500/25 to-red-500/25",
        "gray": "from-gray-500/25 to-pink-300/25",
    };

    const colorRarity = {
        "common": colors.gray,
        "uncommon": colors.green,
        "rare": colors.blue,
        "epic": colors.purple,
        "legendary": colors.red,
    };
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bruno+Ace&display=swap" rel="stylesheet"> 
</svelte:head>

<div class="skill-card {wasClicked ? 'show-back-side' : ''} flex flex-col h-80 w-48 border-solid border-teal rounded-lg bg-gradient-to-r {colorRarity[rarity]}" 
role="button"
    on:click={() => wasClicked = !wasClicked}
    on:keydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            wasClicked = !wasClicked;
            event.preventDefault();
        }
    }}
    tabindex="0">

    <div class="front h-full w-full">
        <div class="skill-logo border-solid border-2 border-white/10 h-32 w-32 mx-4 mt-4 self-center p-4 rounded-lg">
            <img alt="{alt || `${title} logo`}" class="image object-contain h-full w-full" src="{image}"/>
        </div>
        <div class="skill-title m-4 ">
            {title} 
            <!-- {`(${rarity})`} -->
            <hr class="max-w-[80%] dark:border-zinc-50 border-zinc-800">
        </div>
        <div class="card-body-text m-4 mt-auto break-words">
            {description}
        </div>
    </div>

    <div class="back card-body-text h-full w-full flex flex-col p-4 mt-auto">
        {#if items}
            <ul class="list-inside list-disc">
                {#each items as item}
                <li>
                    {item}
                </li>
            {/each}
            </ul>
            
        {/if}
    </div>

</div>

<style lang="scss">
    
    .show-back-side {
        transition: all ease 0.8s;
        transform: rotateY(180deg);

        .skill-card {
            transform: rotateY(180deg);

        }
    }

    .skill-card {

        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s;

        perspective: 1000px;

        .back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            transform: rotateY(180deg);

            ul {
                margin-top: auto;
            }

        }
        .front {
            transform: rotateY(0deg);
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
        }
    }

    .card-body-text {
        font-size: 10px;
        font-family: monospace;
    }

    .skill-logo{
        box-shadow: inset 1px 1px 2px 1px #0000004f;
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