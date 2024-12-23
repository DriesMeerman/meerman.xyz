<script>
    import TradingCard from "../TradingCard.svelte";

    let cardWrapperStyle = "hover:scale-150 transition-all duration-500 my-4";
    let legendImage =
        "https://www.freepnglogos.com/uploads/circle-png/grunge-frame-circle-png-clipart-29.png";

    let rarities = ["common", "uncommon", "rare", "epic", "legendary"];

    const upperCased = (txt) => {
        return txt.charAt(0).toUpperCase() + txt.slice(1);
    };
</script>

<div class="px-6 flex flex-col">
    <div class="flex flex-row flex-wrap justify-around origin-top">
        {#each rarities as rarity}
            <div class={cardWrapperStyle}>
                <TradingCard
                    rarity={rarity}
                    image={legendImage}
                >
                <div class="flex flex-col justify-between h-full">
                    <div>
                        <h2 class="skill-title">{upperCased(rarity)}</h2>
                        <hr class="max-w-[90%] dark:border-zinc-50 border-zinc-800" />
                    </div>
            </TradingCard>
            </div>
        {/each}
    </div>
</div>
