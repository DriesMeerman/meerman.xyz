export class MarkdownItem {
    constructor(file) {
        const slug = file.filename
            .toLowerCase()
            .replace(/\.md$/, '');
        const permalink = `/#/blog/${slug}`

        this.slug = slug;
        this.date = new Date(file.date);
        this.ID = String(file.ID).padStart(3, '0');
        this.permalink = permalink
        this.title = file.title;
        this.author = file.author;
        this.summary = file.summary;
        this.tags = file.tags || [];
        this._html = null; // Add this line
    }

    /**
     * This method returns the html of the article file, which it gets based
     * on the slug. It caches the result for subsequent calls.
     * @returns {Promise<String>} html of the article file
     */
    async getHtml() {
        if (this._html === null) {
            const response = await fetch(`/articles/${this.slug}.html`);
            this._html = await response.text();
        }
        return this._html;
    }
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
