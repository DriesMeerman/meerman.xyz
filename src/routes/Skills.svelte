<script>
    import Card from "../components/Card.svelte";
    import PillButton from "../components/PillButton.svelte";
    import SkillCard from "../components/SkillCard.svelte";
    import TradingCardLegend from "../components/TradingCardLegend.svelte";
    import { skills } from "../model/Skill.js";

    const categories = {
        lang: { name: "Languages", selected: true, items: skills.language },
        framework: { name: "Frameworks", selected: true, items: skills.framework },
        tooling: { name: "Tools", selected: true, items: skills.tooling },
        misc: { name: "Miscellaneous", selected: true, items: skills.misc },
    };

   let selectedCount = Object.values(categories).filter(c => c.selected).length;



 

</script>

<div class="category-selectors flex flex-row flex-wrap mb-4">
    {#each Object.values(categories) as category}
        <div class="m-1">
            <PillButton name={category.name} selected={category.selected} 
            on:click={()=>{ 
                category.selected = !category.selected; 
                let add = category.selected ? 1 : -1;
                selectedCount += add;
                }} />
        </div>
    {/each}
</div>






<Card class="px-6 py-3 mb-4 flex flex-col backdrop-blur-sm {selectedCount ? '' : 'hidden'} scale-100">
    {#each Object.values(categories) as category, i}
        <div class="p-1 {!category.selected ? 'hidden': ''}">
            <h4 class="h4 ml-2">{category.name}</h4>
            <hr />

            <div class="flex flex-row p-4 flex-wrap mx-8">
                {#each category.items || [] as skill}
                    <div class="m-2">
                        <SkillCard skill={skill} />

                   
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</Card>

<div class="pt-16">
    <h4 class="h4">Legend</h4>
    <div class="scale-75 origin-top">
        <TradingCardLegend></TradingCardLegend>
    </div>

</div>

