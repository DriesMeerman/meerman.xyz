import { imageManifest } from '$lib/data/imageData.js';

function getImageKey(name, ext) {
    const extension = ext || 'png';
    return `${name}.${extension}`;
}

function getSortedVariants(entry) {
    return [...(entry?.variants || [])].sort((left, right) => left.width - right.width);
}

function pickVariant(entry, requestedWidth) {
    const variants = getSortedVariants(entry);
    if (variants.length === 0) return null;

    return variants.find((variant) => variant.width >= requestedWidth) || variants[variants.length - 1];
}

/**
 *
 * @param {string} name - image filename
 * @param {string} ext - file extension, (png, jpg, etc)
 * @param {number} size - target width
 * @returns {string}
 */
export function getImage(name, ext, size) {
    const extension = ext || 'png';
    const imageSize = size || 400;
    const entry = imageManifest[getImageKey(name, extension)];
    const variant = pickVariant(entry, imageSize);

    if (variant) {
        return variant.fallback;
    }

    return `/g/assets/${name}-${imageSize}.${extension}`;
}

/**
 *
 * @param {string} name
 * @param {string} ext
 * @param {number} size
 */
export function getPictureSources(name, ext, size) {
    const extension = ext || 'png';
    const imageSize = size || 400;
    const entry = imageManifest[getImageKey(name, extension)];

    if (!entry) {
        const base = `/g/assets/${name}-${imageSize}`;
        return {
            avif: `${base}.avif`,
            avifSrcset: `${base}.avif ${imageSize}w`,
            webp: `${base}.webp`,
            webpSrcset: `${base}.webp ${imageSize}w`,
            fallback: `${base}.${extension}`,
            fallbackSrcset: `${base}.${extension} ${imageSize}w`,
            width: imageSize,
            height: null
        };
    }

    const variant = pickVariant(entry, imageSize);
    if (!variant) {
        return {
            avif: entry.avif,
            avifSrcset: entry.avifSrcset,
            webp: entry.webp,
            webpSrcset: entry.webpSrcset,
            fallback: entry.fallback,
            fallbackSrcset: entry.fallbackSrcset,
            width: entry.width,
            height: entry.height
        };
    }

    return {
        avif: variant.avif,
        avifSrcset: entry.avifSrcset,
        webp: variant.webp,
        webpSrcset: entry.webpSrcset,
        fallback: variant.fallback,
        fallbackSrcset: entry.fallbackSrcset,
        width: variant.width,
        height: variant.height
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
