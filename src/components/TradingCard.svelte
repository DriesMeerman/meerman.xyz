<script>
    export let image;
    export let alt = "an image";
    export let backText = "";
    export let rarity = "common";

    let showBackSide = false;
    let hideOverflow = true;

    $: {
        if (showBackSide) {
            hideOverflow = false;
        } else {
            setTimeout(() => {
                hideOverflow = true;
            }, 600);
        }
    }

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
        purple: "from-purple-500/25 to-pink-500/25",
        green: "from-green-500/25 to-blue-500/25",
        yellow: "from-yellow-500/25 to-red-500/25",
        pink: "from-pink-500/25 to-purple-500/25",
        blue: "from-cyan-500/25 to-blue-500/25",
        red: "from-amber-500/25 to-red-500/25",
        gray: "from-gray-500/25 to-pink-300/25",
    };

    const colorRarity = {
        common: colors.gray,
        uncommon: colors.green,
        rare: colors.blue,
        epic: colors.purple,
        legendary: colors.red,
    };

    const hasShine = rarity === "epic" || rarity === "legendary";

    function cardClicked(event) {
        console.log("Card clicked", event);
        if (event.key === "Enter" || event.key === " ") {
            showBackSide = !showBackSide;
            event.preventDefault();
        }
    }
</script>

<div
    class="skill-card flex flex-col h-64 w-40 border-solid border-teal rounded-lg bg-gradient-to-r {showBackSide
        ? 'show-back-side'
        : ''} {hideOverflow ? 'overflow-hidden' : ''} {colorRarity[rarity]}"
    role="button"
    on:click={() => (showBackSide = !showBackSide)}
    on:keydown={cardClicked}
    tabindex="0"
>
    <div class="{hasShine && hideOverflow ? 'shine' : ''} overflow-visible" />

    <div class="front h-full w-full">
        <div
            class="card-image w-36 h-28 border-solid border-2 border-white/10 mx-3 mt-2 self-center p-4 rounded-lg"
        >
            <img
                {alt}
                class="image object-contain h-full w-full aspect-square"
                src={image}
            />
        </div>
        <div class="p-3 h-full">
            <slot />
        </div>
    </div>

    <div class="back card-body-text h-full w-full flex flex-col p-4 mt-auto">
        {backText}
    </div>
</div>

<style lang="scss">
    .show-back-side {
        .shine {
            display: none;
        }
    }

    :global(.dark .shine) {
        background: -webkit-linear-gradient(
            top,
            transparent,
            rgba(200, 200, 200, 0.1),
            transparent
        ) !important;
    }

    .shine {
        // modified from https://codepen.io/nilbog/pen/ZYLQdR
        width: 1000px;
        height: 100px;
        margin-left: -100px;
        transform: rotate(30deg);
        background: -webkit-linear-gradient(
            top,
            transparent,
            rgba(231, 229, 228, 0.375),
            transparent
        );
        position: absolute;
        animation: shine 6s ease-in-out 8;
    }
    @keyframes shine {
        0%,
        100% {
            margin-top: -100px;
        }
        50% {
            margin-top: 800px;
        }
    }

    .show-back-side {
        transition: all ease 0.8s;
        transform: rotateY(180deg);
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
        font-family: monospace, Courier;
    }

    .card-image {
        box-shadow: inset 1px 1px 2px 1px #0000004f;
        background: #e5edf473;
    }

    // using global so the dark mode can override this
    :global(.dark .card-image) {
        box-shadow: inset 1px 1px 2px 1px #0000004f;
        background: #77889973 !important;
    }

    .skill-title {
        font-family: "Bruno Ace", cursive;
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

        box-shadow: 1px 1px 3px 0px rgb(23 76 76 / 70%);

        /* box-shadow: 1px 1px 3px 0px rgb(153 166 166); */
    }

    :hover.skill-card {
        transition: all ease 0.4s;
        box-shadow: 1px 1px 3px 0px rgba(0, 255, 255, 0.7);
        cursor: pointer;
    }

    :hover.skill-card {
        transition: all ease 0.8s;
        box-shadow: 0px 1px 2px 0px rgba(0, 255, 255, 0.7),
            1px 2px 4px 0px rgba(0, 255, 255, 0.7),
            2px 4px 12px 0px rgba(0, 255, 255, 0.7);
        /* 2px 4px 16px 0px rgba(0,255,255,0.7); */
    }
</style>
