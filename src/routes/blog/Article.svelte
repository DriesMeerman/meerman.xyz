<script>
    import { onMount, onDestroy } from "svelte";
    import {particlesEnabled} from "../../state";
    import all from './articles/*.md';

    export let params = {}
    export const post = findPost(all, params.slug);

    onMount(() => particlesEnabled.set(false));
    onDestroy(() => particlesEnabled.set(true));

    function findPost(posts, name) {
        return posts.find( post => {
            console.log(post.filename, name)
            return post.filename.includes(name);
        })
    }
</script>


{#if post}
    <div class="prose dark:prose-invert max-w-none">
        {@html post.html}
    </div>
{:else }
    <div>Error article not found</div>
{/if}
