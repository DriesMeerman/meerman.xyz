<script>
    // import { onMount, onDestroy } from "svelte";
    // import {particlesEnabled} from "../../state";
    // onMount(() => particlesEnabled.set(false))
    // onDestroy(() => particlesEnabled.set(true))

    import all from './articles/*.md'
    import Card from "../../components/Card.svelte";
    import {transformMeta, sortByDate} from "../../services/markdownService";

    export const posts = all.map(transformMeta).sort(sortByDate)

    export function isLast(list, index) {
        return (list.length - 1) === index;
    }

    let first = posts[0]
    console.log('posts', first, Object.keys((first)))
</script>

<div>
    <h1 class="justify-center flex text-4xl pb-12">Articles</h1>

    <Card class="p-6">
        <div>
            {#each posts as post, index}
                <article class="{index === 0 ? '' : 'pt-6'}">
                    <!-- link article to /posts/$permalink -->
                    <a class="" href={`/blog/${post.permalink}`}>
                        <div class="flex flex-row justify-between">
                            <h2 class="text-2xl hover:decoration-blue-400">{post.title}</h2>
                            <p class="">[{post.date.toLocaleDateString()}]</p>
                        </div>
                    </a>
                    {#if post.summary}
                        <p class="text-sm pt-2">{post.summary}</p>
                    {/if}

                </article>
                {#if !isLast(posts, index)}
                    <hr class="mt-2">
                {/if}
            {/each}
        </div>
    </Card>

</div>