<script>
    import Card from "../components/Card.svelte";
    import PillButton from "../components/Skills/PillButton.svelte";
    import SkillCard from "../components/Skills/SkillCard.svelte";
    import { skills } from "../model/Skill.js";
    // import TradingCardLegend from "../components/Skills/TradingCardLegend.svelte";


    const categories = {
        lang: { name: "Languages", selected: true, items: skills.language },
        framework: { name: "Frameworks", selected: true, items: skills.framework },
        tooling: { name: "Tools", selected: true, items: skills.tooling },
        misc: { name: "Miscellaneous", selected: true, items: skills.misc },
    };

   const categoryContent = Object.values(categories)
   let selectedCount = categoryContent.filter(c => c.selected).length;
   let keywords = categoryContent.flatMap(c => c.items).map(s => s.name).join(', ');
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



<Card class="px-2 py-3 mb-4 flex flex-col backdrop-blur-sm {selectedCount ? '' : 'hidden'} ">
    {#each Object.values(categories) as category, i}
        <div class="p-1 {!category.selected ? 'hidden': ''}">
            <h4 class="h4 ml-2">{category.name}</h4>
            <hr />

            <div class="flex flex-row justify-center flex-wrap md:p-4 md:mx-8  gap-4 md:gap-8 py-4">
                {#each category.items || [] as skill}
                <div class="scale-90 md:scale-100">
                    <SkillCard skill={skill} />
                </div>
                {/each}
            </div>
        </div>
    {/each}
</Card>

<!-- <div class="pt-16">
    <h4 class="h4">Legend</h4>
    <div class="scale-75 origin-top">
        <TradingCardLegend></TradingCardLegend>
    </div>
</div> -->

<svelte:head>
    <title>Meerman</title>
    <meta name="description" content="A list of hard and soft skills, visualized in a trading card format.">
    <meta name="author" content="Dries Meerman">
    <meta name="keywords" content="Dries Meerman, Meerman, Software Engineer, Software Engineering, Software Architect, Programmer, {keywords}">
</svelte:head>
