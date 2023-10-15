/**
 * This method takes an object returned by a Markdown parser and re-structures the metadata
 * @param {Object} file - markdown
 * @returns {MarkdownItem}
 */
export function transformMeta(file){
    const {filename, html} = file;
    // .meta is used by markdown-it for generating rss feed, while .metadata is for svelte Markdown plugin
    const metadata = file.metadata || file.meta;
    const blogPath = filename
        .toLowerCase()
        .replace(/\.md$/, '');
    const permalink = `/#/blog/${blogPath}`

    const date = new Date(metadata.date);
    const id = String(metadata.ID).padStart(3, '0');

    return {...metadata, permalink, filename, date, html, ID: id};
}

/**
 *
 * @param {MarkdownItem} lhs
 * @param {MarkdownItem} rhs
 * @returns {boolean}
 */
export function sortByDate(lhs, rhs) {
    return rhs.date - lhs.date;
}

/**
 * @typedef MarkdownItem
 * @property {string} title
 * @property {string} author
 * @property {Date} date
 * @property {string} summary
 * @property {string} permalink
 * @property {string} filename
 * @property {string} html
 */