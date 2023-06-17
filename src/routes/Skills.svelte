<script>
    import Card from "../components/Card.svelte";
    import PillButton from "../components/PillButton.svelte";
    import TradingCard from "../components/TradingCard.svelte";
    import { skills } from "../model/Skill.js";

    let categories = {
        frontend: { name: "Frontend", selected: true, items: skills.frontend },
        backend: { name: "Backend", selected: true, items: skills.backend },
        mobile: { name: "Mobile", selected: true, items: skills.mobile },
        tooling: { name: "Tooling", selected: true, items: skills.tooling },
        misc: { name: "Other", selected: true, items: skills.misc },
    };

    console.log(categories)
    console.log(skills)

    let rarity = "common";
    let rarities = ["common", "uncommon", "rare", "epic", "legendary"];
    let legendImage = "https://www.freepnglogos.com/uploads/circle-png/grunge-frame-circle-png-clipart-29.png"

</script>

<div class="category-selectors flex flex-row flex-wrap">
    {#each Object.values(categories) as category}
        <div class="m-1">
            <PillButton name={category.name} selected={category.selected} 
            on:click={()=>{ category.selected = !category.selected}} />
        </div>
    {/each}
</div>



<div class="px-6 py-3 flex flex-col">
    <div class="flex flex-row flex-wrap justify-around scale-75">
        <div class="hover:scale-150 transition-all duration-500">  <TradingCard title="common" rarity="common" image="{legendImage}"></TradingCard></div>
        <div class="hover:scale-150 transition-all duration-500">  <TradingCard title="uncommon" rarity="uncommon" image="{legendImage}"></TradingCard></div>
        <div class="hover:scale-150 transition-all duration-500">  <TradingCard title="rare" rarity="rare" image="{legendImage}"></TradingCard></div>
        <div class="hover:scale-150 transition-all duration-500">  <TradingCard title="epic" rarity="epic" image="{legendImage}"></TradingCard></div>
        <div class="hover:scale-150 transition-all duration-500">  <TradingCard title="legendary" rarity="legendary" image="{legendImage}"></TradingCard></div>
    </div>
</div>

<Card class="px-6 py-3 my-8 flex flex-col backdrop-blur-sm">
    {#each Object.values(categories) as category, i}
        <div class="p-1 {!category.selected ? 'hidden': ''}">
            <h4 class="h4 ml-2">{category.name}</h4>
            <hr />

            <div class="flex flex-row p-4 flex-wrap justify-around">
                {#each category.items as skill, j}
                    <div class="m-2">
                        <TradingCard
                            title={skill.name}
                            description={skill.description}
                            image={skill.image}
                            alt={skill.altText}
                            items={skill.bullets}
                            rarity={rarities[Math.abs(skill.getHash())%rarities.length]}
                            
                        />
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</Card>

<Card class="px-6 py-3">
    Shown below is an overview of skills I have consisting of programming
    languages, frameworks and technologies. Additionally the languages I speak
    and processes I've worked with. Some information has been omitted due to
    relevancy. <br />
    Overall I would describe my skill set as that of a Fullstack Engineer with DevOps
    knowledge.
</Card>
