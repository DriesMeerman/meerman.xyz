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

    console.log(categories);
    console.log(skills);
</script>

<div class="category-selectors flex flex-row flex-wrap">
    {#each Object.values(categories) as category}
        <div class="m-1">
            <PillButton name={category.name} selected={category.selected} 
            on:click={()=>{ category.selected = !category.selected}} />
        </div>
    {/each}
</div>

<Card class="px-6 py-3 my-8 flex flex-col backdrop-blur-sm">
    {#each Object.values(categories) as category}
        <div class="p-1 {!category.selected ? 'hidden': ''}">
            <h4 class="h4 ml-2">{category.name}</h4>
            <hr />

            <div class="flex flex-row p-4 flex-wrap justify-around">
                {#each category.items as skill}
                    <div class="m-2">
                        <TradingCard
                            title={skill.name}
                            description={skill.description}
                            image={skill.image}
                            items={skill.bullets}
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
