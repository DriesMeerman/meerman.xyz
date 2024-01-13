<script>
    import { onDestroy } from "svelte";
    import { particlesEnabled } from "../../state";
    import all from "./articles/*.md";
    import { transformMeta } from "../../services/markdownService";

    export let params = {};
    export const post = findPost(all, params.slug);

    setTimeout(() => particlesEnabled.set(false));
    onDestroy(() => particlesEnabled.set(true));

    /**
     * 
     * @param {*[]} posts
     * @param {String} name
     * @returns {MarkdownItem}
     */
    function findPost(posts, name) {
        let post = posts.find((post) => {
            return post.filename.includes(name);
        });
        return transformMeta(post);
    }
</script>

<pre>{JSON.stringify(post, 0, 4)}</pre>

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

<svelte:head>
    {#if post}
    <title>{post.title}</title>
    <meta name="description" content={post.summary} />
    <meta name="author" content="{post.author}">
    {/if}
</svelte:head>


    