/**
 *
 * @param {string} name - image filename
 * @param {string} ext - file extension, (png, jpg, etc)
 * @param {number} size - image quality size (400, 800, 1200) see also rollup
 * @returns {string}
 */
export function getImage(name, ext, size){
    const extension = ext ? ext : 'png';
    const imageSize = size ? size : 400;
    return `/g/assets/${name}-${imageSize}.${extension}`;
}

/**
 *
 * @param {string} name
 * @param {string} ext
 * @param {number} size
 */
export function getPictureSources(name, ext, size) {
    const extension = ext ? ext : 'png';
    const imageSize = size ? size : 400;
    const base = `/g/assets/${name}-${imageSize}`;

    return {
        avif: `${base}.avif`,
        webp: `${base}.webp`,
        fallback: `${base}.${extension}`
    };
}

/**
 *
 * @param {string} imageUrl
 */
export function getPictureSourcesFromUrl(imageUrl) {
    const match = imageUrl.match(/^\/g\/assets\/(.+)-(\d+)\.([a-z0-9]+)$/i);
    if (!match) return null;

    const [, name, size, extension] = match;
    return getPictureSources(name, extension, Number(size));
}
