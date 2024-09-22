import { articles } from "../data/articleData";
import { MarkdownItem, sortByDate } from "./markdownService";


/**
 *
 * @param {String} name
 * @returns {MarkdownItem}
 */
export function findPost(name) {
    let post = articles.find((post) => {
        return post.filename.includes(name);
    });

    if (!post) {
        console.error(`No post found for ${name}`);
        return null;
    }

    return new MarkdownItem(post);
}

export function getAllArticles() {
    return articles.map(a => new MarkdownItem(a)).sort(sortByDate)
}