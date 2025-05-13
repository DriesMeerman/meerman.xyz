<script>
    import { onDestroy } from "svelte";
    import { particlesEnabled } from "../state";
    import { tools } from "../data/toolData";

    function initializeToolsPage() {
        // particlesEnabled.set(false);
    }

    initializeToolsPage();

    onDestroy(() => {
        // particlesEnabled.set(true);
    });

    const iconSize = '5em';

    // Adapt the SVG string to the desired size
    function adaptSvgString(svgString, width, height) {
        if (!svgString || typeof svgString !== 'string') {
            return '';
        }
        let modifiedSvg = svgString.replace(
            /<svg([^>]*)>/i,
            (match, attributes) => {
                let cleanedAttributes = attributes
                    .replace(/\s*width\s*=\s*["']?[^"'\s>]*["']?/gi, '')
                    .replace(/\s*height\s*=\s*["']?[^"'\s>]*["']?/gi, '');

                const attributesPart = cleanedAttributes.trim() ? ` ${cleanedAttributes.trim()}` : '';
                return `<svg width="${width}" height="${height}"${attributesPart}>`;
            }
        );
        return modifiedSvg;
    }

</script>

<div>
    <div class="flex flex-wrap justify-center gap-4">
        {#each tools as tool}
            <div class="bg-gray-700 p-4 rounded-md backdrop-blur-sm w-32 flex-none">
                <div class="text-center flex justify-center items-center overflow-hidden w-24 h-24">
                    {#await fetch(tool.icon).then(res => res.text())}
                        <p>Loading icon...</p>
                    {:then svgContent}
                        {@html adaptSvgString(svgContent, iconSize, iconSize)}
                    {:catch error}
                        <p>Error loading icon: {error.message}</p>
                    {/await}
                </div>
                <h2 class="pt-2 text-center"> {tool.name}</h2>
            </div>
        {/each}
    </div>
</div>