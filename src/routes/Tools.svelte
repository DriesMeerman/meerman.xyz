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


    async function getIcon(iconUrl) {
        const response = await fetch(iconUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }

        const svgText = await response.text();
        return svgText;
    }

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

    const listOfGradientColors = [
        'from-purple-600 to-blue-600',
        'from-blue-600 to-green-600',
        'from-green-600 to-yellow-600',
        'from-yellow-600 to-red-600',
        'from-red-600 to-purple-600',

        'from-purple-600 via-blue-600 to-green-600',
        'from-blue-600 via-green-600 to-yellow-600',
        'from-green-600 via-yellow-600 to-red-600',
        'from-yellow-600 via-red-600 to-purple-600',
    ];

    // const randomGradientColor = listOfGradientColors[Math.floor(Math.random() * listOfGradientColors.length)];
    const getRandomGradientColor = () => {
        return listOfGradientColors[Math.floor(Math.random() * listOfGradientColors.length)];
    }


</script>

<div>
    <div class="flex justify-start items-center w-full p-4 bg-gray-700 p-4 mb-12 rounded-md backdrop-blur-sm bg-opacity-75">

    <div class="text-left flex items-start">
        This page contains tools, programs and apps that I use.
    </div>
    </div>
    <div class="flex flex-wrap justify-between gap-8">
        {#each tools as tool}
            <div class="bg-gray-700 p-4 rounded-md backdrop-blur-sm w-32 flex-none  bg-opacity-75">
                <div class="text-center flex justify-center items-center overflow-hidden w-24 h-24">
                    {#await getIcon(tool.icon)}
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