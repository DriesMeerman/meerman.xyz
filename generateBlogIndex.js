import fs from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
import RSS from 'rss';
import { fileURLToPath } from 'url';
import meta from 'markdown-it-meta';

const md = new MarkdownIt()
md.use(meta);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownDir = path.join(__dirname, 'src/routes/blog/articles/');
const outputDir = path.join(__dirname, 'static');
const outputFilePath = path.join(outputDir, 'data.json');
const outputRssPath = path.join(outputDir, 'feed.xml');

const files = fs.readdirSync(markdownDir)

console.log("Found files:")
console.log(files.reduce((total, current) => {
    return total + `\n\t${current}`;
}, ""))

const data = files.map((filename) => {
    const content = fs.readFileSync(path.join(markdownDir, filename), 'utf-8');
    md.render(content);
    const metaData = md.meta;

    return {
        filename: filename,
        ...metaData
    };
});

fs.writeFileSync(outputFilePath, JSON.stringify(data));

const feed = new RSS({
    title: 'Meerman',
    description: 'Meerman.xyz website and blog',
    feed_url: 'https://meerman.xyz/feed.xml',
    site_url: 'https://meerman.xyz/',
    // image_url: 'https://example.com/images/logo.png',
    managingEditor: 'Dries Meerman',
    webMaster: 'Dries Meerman',
    ttl: '180',
});

data.forEach((item) => {
    feed.item({
        title: item.title,
        description: item.summary,
        url: `https://meerman.xyzm/blog/${item.filename.replace(/\.md$/, '')}`,
        date: new Date(item.date),
    });
});

fs.writeFileSync(outputRssPath, feed.xml());
