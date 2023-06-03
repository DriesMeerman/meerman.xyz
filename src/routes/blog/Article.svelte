<script>
    import { onMount, onDestroy } from "svelte";
    import { particlesEnabled } from "../../state";
    import all from "./articles/*.md";

    export let params = {};
    export const post = findPost(all, params.slug);

    onMount(() => particlesEnabled.set(false));
    onDestroy(() => particlesEnabled.set(true));

    function findPost(posts, name) {
        return posts.find((post) => {
            console.log(post.filename, name);
            return post.filename.includes(name);
        });
    }
</script>

{#if post}
    <div
        class="prose dark:prose-invert max-w-none list-disc dark:marker:text-white"
    >
        {@html post.html}
    </div>
{:else}
    <div>Error article not found</div>
{/if}

<style>
    @media (min-width: 768px) {
        .prose :global(img) {
            max-width: 30rem;
            margin: 1.5rem auto;
        }
    }
</style>
