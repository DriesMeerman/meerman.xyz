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