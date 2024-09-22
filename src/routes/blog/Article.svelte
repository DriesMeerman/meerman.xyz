<script>
    import {  onDestroy } from "svelte";
    import { particlesEnabled } from "../../state.js";
    import { findPost } from "../../services/articleService.js";

    export let params = {};

    let slug = params.slug ? params.slug.split('#')[0] : ''; // workaround for #footnote links
    let post = findPost(slug);
    let htmlContent = '';
    let loading = true;
    let errorMessage = '';

    loadPost(); // not put in onMount due to funky routing


    async function loadPost() {
        if (post) {
            try {
                htmlContent = await post.getHtml();
            } catch (error) {
                console.error("Error loading HTML:", error);
                errorMessage = "An error occurred while loading the article.";
            }
            loading = false;
        } else {
            errorMessage = "The requested article could not be found.";
            loading = false;
        }
        particlesEnabled.set(false);
    }

    onDestroy(() => particlesEnabled.set(true));
</script>

{#if loading}
    <div class="loader">Loading...</div>
{:else if errorMessage}
    <div class="error-message">
        <h2>Oops! Something went wrong</h2>
        <p>{errorMessage}</p>
        <a href="#/blog">Return to blog list</a>
    </div>
{:else if post}
    <div class="prose dark:prose-invert max-w-none list-disc dark:marker:text-white">
        {@html htmlContent}
    </div>
{/if}

<style>
    @media (min-width: 768px) {
        .prose :global(img) {
            max-width: 30rem;
            margin: 1.5rem auto;
        }
    }

    .loader {
        text-align: center;
        font-size: 1.2rem;
        margin: 2rem 0;
    }

    .error-message {
        text-align: center;
        margin: 2rem auto;
        max-width: 30rem;
    }

    .error-message h2 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }

    .error-message a {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: #4a5568;
        color: white;
        text-decoration: none;
        border-radius: 0.25rem;
    }

    .error-message a:hover {
        background-color: #2d3748;
    }

    :global(a[href*="/blog/"][href*="#footnote"])::before {
       content: '[';
}

    :global(a[href*="/blog/"][href*="#footnote"])::after {
        content: ']';
    }
</style>

<svelte:head>
    {#if post}
    <title>{post.title}</title>
    <meta name="description" content={post.summary} />
    <meta name="author" content="{post.author}" />
    <meta name="keywords" content="{post.tags.join(', ')}" />
    {/if}
</svelte:head>
