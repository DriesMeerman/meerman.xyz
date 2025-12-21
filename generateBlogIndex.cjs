const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const RSS = require('rss');
const meta = require('markdown-it-meta');

const md = new MarkdownIt()
md.use(meta);

const markdownDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, 'content/blog/');
const outputDir = process.env.BLOG_FEED_OUT_DIR || path.join(__dirname, 'static');
const dataDir = process.env.BLOG_DATA_OUT_DIR || path.join(__dirname, 'src/lib/data');


const outputFilePath = path.join(outputDir, 'feed.json');
const outputRssPath = path.join(outputDir, 'feed.xml');
const outputJsonPath = path.join(dataDir, 'articleData.js');

if (!fs.existsSync(markdownDir)) {
    console.log('No articles found, stopping...');
    process.exit(0);
}
const files = fs.readdirSync(markdownDir).filter(f => f.endsWith('.md'))

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
        url: `https://meerman.xyz/blog/${blogUrlPath}`,
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

const newArticlesJson = JSON.stringify(data, null, 2);

// If nothing changed besides the timestamp, don't rewrite the file to avoid git churn
try {
    let shouldWrite = true;
    if (fs.existsSync(outputJsonPath)) {
        const existing = fs.readFileSync(outputJsonPath, 'utf-8');
        const match = existing.match(/const articlesString = `([\s\S]*?)`;/);
        if (match && match[1] === newArticlesJson) {
            shouldWrite = false;
            console.log('articleData.js content unchanged; skipping rewrite (timestamp preserved).');
        }
    }

    if (shouldWrite) {
        const articleData = `// Generated at ${new Date().toISOString()}
const articlesString = \`${newArticlesJson}\`;
export const articles = JSON.parse(articlesString);
`;
        fs.writeFileSync(outputJsonPath, articleData);
        console.log('articleData.js written');
    }
} catch (err) {
    console.error('Failed to write articleData.js:', err);
    process.exitCode = 1;
}