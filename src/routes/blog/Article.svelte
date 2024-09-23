<script>
    import {  onDestroy } from "svelte";
    import { particlesEnabled } from "../../state.js";
    import { findPost } from "../../services/articleService.js";
    import { tick } from 'svelte';

    export let params = {};

    let slug = params.slug ? params.slug.split('#')[0] : ''; // workaround for #footnote links
    let post = findPost(slug);
    let htmlContent = '';
    let loading = true;
    let errorMessage = '';
    let enlargedImage = null;

    loadPost(); // not put in onMount due to funky routing


    async function loadPost() {
        if (post) {
            try {
                htmlContent = await post.getHtml();
                await tick(); // Wait for the DOM to update
                setTimeout(() => {
                    addImageClickListeners();
                    addEscapeKeyListener();
                }, 100);
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

    function addImageClickListeners() {
        const images = document.querySelectorAll('.prose img');
        images.forEach(img => {
            img.addEventListener('click', (event) => {
                if (enlargedImage) {
                    closeEnlargedImage();
                } else {
                    enlargeImage(img);
                }
                event.stopPropagation(); // Prevent the click from bubbling up
            });
        });

        // Add click listener to the document to close enlarged image
        document.addEventListener('click', () => {
            if (enlargedImage) {
                closeEnlargedImage();
            }
        });
    }

    function enlargeImage(img) {
        img.classList.add('enlarged');
        enlargedImage = img;
    }

    function closeEnlargedImage() {
        if (enlargedImage) {
            enlargedImage.classList.remove('enlarged');
            enlargedImage = null;
        }
    }

    function addEscapeKeyListener() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && enlargedImage) {
                closeEnlargedImage();
            }
        });
    }

    onDestroy(() => {
        particlesEnabled.set(true);
        document.removeEventListener('keydown', addEscapeKeyListener);
        document.removeEventListener('click', closeEnlargedImage);
    });
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

    :global(.prose img) {
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 15px;
        background: #f0f0f0;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        padding: 1px;
    }

    :global(.prose img.enlarged) {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90vw;
        max-height: 90vh;
        z-index: 1000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        background: none;
        padding: 0;
    }

    /* Add this to handle dark mode */
    :global(.dark .prose img) {
        background: #2a2a2a;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
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

