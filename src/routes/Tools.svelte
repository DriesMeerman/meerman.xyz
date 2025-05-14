<script>
    import { tools, unixTools } from "../data/toolData";

    const iconSize = '5em';

    async function getIcon(iconUrl) {
        const response = await fetch(iconUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }

        const svgText = await response.text();
        return svgText;
    }

    // Adapt the SVG string to the desired size
    function adaptSvgString(svgString, width, height) {
        if (!svgString || typeof svgString !== 'string') {
            return '';
        }

        let modifiedSvg = svgString.replace(
            /<svg([^>]*)>/i,
            (match, attributes) => {
                let cleanedAttributes = attributes
                    .replace(/\\s*width\\s*=\\s*["']?[^"'\s>]*["']?/gi, '')
                    .replace(/\\s*height\\s*=\\s*["']?[^"'\s>]*["']?/gi, '');

                const attributesPart = cleanedAttributes.trim() ? ` ${cleanedAttributes.trim()}` : '';
                return `<svg width="${width}" height="${height}" aria-hidden="true"${attributesPart}>`;
            }
        );
        return modifiedSvg;
    }
</script>

<div>
    <div class="flex justify-start w-full p-4 bg-gray-700 p-4 mb-12 rounded-md backdrop-blur-sm bg-opacity-75">
        <div class="text-left flex flex-wrap">
            <p>
                This is an overview of tools and programs I find useful and use on a daily basis.
            </p>

            <p class="text-xs pt-1 text-gray-400 w-full flex justify-end">
                Last updated: 2025-05-14
            </p>
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

    <div class="my-8">
        <h1>Unix tools</h1>
        <hr class="mb-4">
        <div class="flex flex-col gap-4">
            {#each unixTools as tool}
                <div class="bg-gray-700 p-4 rounded-md backdrop-blur-sm flex-none  bg-opacity-75">
                    <div class="flex flex-row justify-between items-center">
                        <pre><span class="select-none mr-2">$</span>{tool.name}</pre>

                        {#if tool.url}
                            {#if tool.url.includes('github')}

                                <a href={tool.url} target="_blank" aria-label="{`${tool.name} on GitHub`}">
                                <svg width="1.5rem" height="1.5rem" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)" fill="#1B1F23"/>
                                    </svg>
                                </a>
                            {:else}
                                <a href={tool.url} target="_blank" aria-label="{`Official website for ${tool.name}`}">
                                    <svg width="1rem" height="1rem" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" version="1.1" id="Capa_1" viewBox="0 0 577.545 577.545" xml:space="preserve" aria-hidden="true">
                                        <g>
                                            <g>
                                                <path d="M245.531,245.532c4.893-4.896,11.42-7.589,18.375-7.589s13.482,2.696,18.375,7.589l49.734,49.734    c1.723,1.72,4.058,2.689,6.49,2.689s4.771-0.967,6.49-2.689l49.733-49.734c1.724-1.72,2.69-4.058,2.69-6.49    c0-2.433-0.967-4.771-2.69-6.49l-49.733-49.734c-21.668-21.662-50.469-33.589-81.093-33.589s-59.425,11.928-81.093,33.586    L33.602,332.022C11.934,353.69,0,382.494,0,413.128c0,30.637,11.934,59.432,33.605,81.084l49.731,49.73    c21.65,21.668,50.447,33.603,81.081,33.603s59.438-11.935,81.108-33.603l84.083-84.082c2.705-2.705,3.448-6.803,1.869-10.285    c-1.496-3.295-4.776-5.386-8.356-5.386c-0.205,0-0.407,0.007-0.615,0.021c-2.959,0.199-5.958,0.297-8.917,0.297    c-23.354,0-46.322-6.208-66.417-17.956c-1.444-0.844-3.042-1.254-4.629-1.254c-2.375,0-4.725,0.921-6.494,2.689l-53.238,53.238    c-4.902,4.901-11.426,7.604-18.372,7.604c-6.949,0-13.479-2.699-18.381-7.604l-49.734-49.734    c-4.908-4.896-7.61-11.411-7.616-18.348c-0.003-6.953,2.699-13.489,7.616-18.406L245.531,245.532z"/>
                                                <path d="M543.942,83.324L494.208,33.59C472.556,11.931,443.762,0,413.128,0s-59.438,11.928-81.105,33.587l-84.086,84.119    c-2.705,2.705-3.448,6.806-1.867,10.288c1.497,3.292,4.777,5.382,8.354,5.382c0.205,0,0.413-0.006,0.621-0.021    c2.987-0.202,6.013-0.303,9-0.303c23.4,0,46.316,6.206,66.274,17.947c1.45,0.854,3.057,1.267,4.65,1.267    c2.375,0,4.725-0.921,6.494-2.689l53.274-53.274c4.893-4.896,11.42-7.589,18.375-7.589s13.482,2.696,18.375,7.589l49.734,49.734    c10.123,10.135,10.123,26.634-0.003,36.775L332.017,332.014c-4.894,4.905-11.408,7.604-18.348,7.604    c-6.956,0-13.495-2.702-18.415-7.61l-49.723-49.725c-1.723-1.72-4.057-2.69-6.49-2.69c-2.433,0-4.771,0.967-6.49,2.69    l-49.734,49.734c-3.586,3.586-3.586,9.397,0,12.983l49.734,49.734c21.668,21.668,50.469,33.602,81.093,33.602    c30.625,0,59.426-11.934,81.094-33.602l149.205-149.206c21.668-21.658,33.603-50.462,33.603-81.102S565.61,104.983,543.942,83.324    z"/>
                                            </g>
                                        </g>
                                        </svg>
                                </a>
                            {/if}

                        {/if}

                    </div>
                    <p class="text-sm pt-1">{tool.description}</p>
                </div>
            {/each}
        </div>

    </div>

    <div class="my-8">
        <h1>MacOS shortcuts</h1>
        <hr class="mb-4">
        <div class="flex justify-start w-full p-4 bg-gray-700 p-4 mb-12 rounded-md backdrop-blur-sm bg-opacity-75">
            <div class="text-left">
                <p class="mb-4">
                    There are some great built-in tools macOS provides. 'Preview' serves as the default application for viewing images, PDF files and many more.
                    For screen captures, you have multiple options:
                </p>
                <ul class="list-disc list-inside pl-4 text-sm space-y-1">
                    <li>Screenshot region to your clipboard: <kbd>Cmd+Ctrl+Shift+3</kbd></li>
                    <li>Screenshot the entire screen to your clipboard: <kbd>Cmd+Ctrl+Shift+4</kbd></li>
                    <li>Screenshot a selected region to a file: <kbd>Cmd+Shift+3</kbd></li>
                    <li>Screenshot the entire screen to a file: <kbd>Cmd+Shift+4</kbd></li>
                    <li>Open screen capture controls (+video): <kbd>Cmd+Shift+5</kbd></li>
                </ul>
                <p class="my-4">
                    When there's an image in your clipboard, you can use <kbd>Cmd+Shift+N</kbd> if preview is open to create a new document with the image.
                </p>
            </div>
        </div>
    </div>
</div>