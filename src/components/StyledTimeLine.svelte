<script>
    import {
        Timeline,
        TimelineItem,
        TimelineSeparator,
        TimelineDot,
        TimelineConnector,
        TimelineContent,
        TimelineOppositeContent
    } from 'svelte-vertical-timeline';

    export let timeLineItems;
    let innerWidth = 0;
</script>

<svelte:window bind:innerWidth  />


{#if innerWidth === 0}
    <div>place holder</div>
{:else}
    <Timeline position="{innerWidth < 640 ? 'right' : 'alternate'}">
        {#each timeLineItems as item}
            <TimelineItem>
                <TimelineOppositeContent slot="opposite-content">
                    {item.date || ''}
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                    <div>
                        <div class="flex">
                            {#if item.image}
                            <div class="mx-2 relative thumbnail-holder self-center">
                                    <img class="h-full w-full object-cover absolute" src="{item.image}" alt={item.title + " logo"}/>
                            </div>
                            {/if}
                            <div class="mb-2">
                                <h1 >{item.title}</h1>
                                <h1 class="text-sm">{item.subtitle || ''}</h1>
                            </div>
                        </div>

                        <div class="flex">

                            <div class="mx-1  max-w-[80%]">
                                <div class="text-sm">{item.description || ''}</div>
                                {#if item.bullets && item.bullets.length > 0 }
                                    <ul class="list list-disc text-left ml-4 mt-1 text-sm">
                                        {#each item.bullets as bullet}
                                            <li>{bullet}</li>
                                        {/each }
                                    </ul>
                                {/if }
                                <div class="flex">
                                    {#each item.attachments || [] as file}
                                        <div>
                                            <a href="{file.url}" target="_blank" rel="noopener noreferrer">
                                                <div class="h-11 m-4 flex flex-row content-center flex-col">
                                                    <img class="h-full" src="{file.image}" alt="">
                                                    <p class="text-xs">{file.title}</p>
                                                </div>
                                            </a>

                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </TimelineContent>
            </TimelineItem>
        {/each}
    </Timeline>
{/if}

<style>

    .thumbnail-holder {
        width: 1.5rem;
        height: 1.5rem;
        min-width: 1.5rem;
        min-height: 1.5rem;
    }

    /* workaround with global because rollup removes the css as it,
     * does not detect the alternate generated by the timeline component */
    :global(.alternate:nth-of-type(even) .flex) {
        flex-direction: row-reverse;
        /*border: solid pink 1px;*/
    }

    :global(.timeline-opposite-content.right) {
        flex: 0 !important;
    }
</style>