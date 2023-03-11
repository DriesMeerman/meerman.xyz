const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const RSS = require('rss');
const meta = require('markdown-it-meta');

const md = new MarkdownIt()
md.use(meta);

const markdownDir = path.join(__dirname, 'src/routes/blog/articles/');
const outputDir = path.join(__dirname, 'static');

const outputFilePath = path.join(outputDir, 'feed.json');
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
    const blogUrlPath = filename
        .toLowerCase()
        .replace(/\.md$/, '');

    return {
        filename: filename,
        ...metaData,
        url: `https://meerman.xyzm/#/blog/${blogUrlPath}`,
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
        url: item.url,
        date: new Date(item.date),
    });
});

fs.writeFileSync(outputRssPath, feed.xml());
