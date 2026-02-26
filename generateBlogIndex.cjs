const fs = require('fs');
const path = require('path');
const RSS = require('rss');
const matter = require('gray-matter');

const markdownDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, 'content/blog/');
const outputDir = process.env.BLOG_FEED_OUT_DIR || path.join(__dirname, 'static');
const dataDir = process.env.BLOG_DATA_OUT_DIR || path.join(__dirname, 'src/lib/data');

const outputFilePath = path.join(outputDir, 'feed.json');
const outputRssPath = path.join(outputDir, 'feed.xml');
const outputJsonPath = path.join(dataDir, 'articleData.js');

const REQUIRED_FIELDS = ['title', 'summary', 'date', 'author', 'ID', 'tags'];

if (!fs.existsSync(markdownDir)) {
  console.log('No articles found, stopping...');
  process.exit(0);
}

function listArticleDirs(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function normalizeTags(tags, slug) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  throw new Error(`Article "${slug}" has invalid tags. Expected array or comma-separated string.`);
}

function validateMeta(meta, slug) {
  for (const field of REQUIRED_FIELDS) {
    if (meta[field] === undefined || meta[field] === null || meta[field] === '') {
      throw new Error(`Article "${slug}" is missing required frontmatter field "${field}".`);
    }
  }

  const date = new Date(meta.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Article "${slug}" has invalid "date" field: ${meta.date}`);
  }
}

function loadArticle(slug) {
  const articleDir = path.join(markdownDir, slug);
  const mdPath = path.join(articleDir, 'index.md');
  const htmlPath = path.join(articleDir, 'index.html');

  if (!fs.existsSync(mdPath)) return null;

  const content = fs.readFileSync(mdPath, 'utf-8');
  const { data } = matter(content);

  data.tags = normalizeTags(data.tags, slug);
  validateMeta(data, slug);

  return {
    slug,
    filename: `${slug}.md`,
    sourceType: fs.existsSync(htmlPath) ? 'html' : 'md',
    ...data,
    url: `https://meerman.xyz/blog/${slug}`
  };
}

const articleDirs = listArticleDirs(markdownDir);
console.log('Found article directories:');
console.log(articleDirs.reduce((total, current) => total + `\n\t${current}`, ''));

const data = articleDirs.map(loadArticle).filter(Boolean);

const seenIds = new Set();
const seenSlugs = new Set();
for (const item of data) {
  const idKey = String(item.ID);
  if (seenIds.has(idKey)) {
    throw new Error(`Duplicate article ID detected: ${item.ID}`);
  }
  seenIds.add(idKey);

  if (seenSlugs.has(item.slug)) {
    throw new Error(`Duplicate article slug detected: ${item.slug}`);
  }
  seenSlugs.add(item.slug);
}

fs.writeFileSync(outputFilePath, JSON.stringify(data));

const feed = new RSS({
  title: 'Meerman',
  description: 'Meerman.xyz website and blog',
  feed_url: 'https://meerman.xyz/feed.xml',
  site_url: 'https://meerman.xyz/',
  managingEditor: 'Dries Meerman',
  webMaster: 'Dries Meerman',
  ttl: '180'
});

data.forEach((item) => {
  feed.item({
    title: item.title,
    description: item.summary,
    url: item.url,
    date: new Date(item.date)
  });
});

fs.writeFileSync(outputRssPath, feed.xml());

const newArticlesJson = JSON.stringify(data, null, 2);

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
