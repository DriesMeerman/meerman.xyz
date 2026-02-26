const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, '..', 'content/blog');
const REQUIRED_FIELDS = ['title', 'summary', 'date', 'author', 'ID', 'tags'];

if (!fs.existsSync(contentDir)) {
  console.error(`Missing content directory: ${contentDir}`);
  process.exit(1);
}

const dirs = fs
  .readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const errors = [];
const seenIds = new Map();
const seenSlugs = new Set();

function hasHtmlBody(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : html;
  return content.replace(/<!--[\s\S]*?-->/g, '').trim().length > 0;
}

for (const slug of dirs) {
  const mdPath = path.join(contentDir, slug, 'index.md');
  const htmlPath = path.join(contentDir, slug, 'index.html');
  if (!fs.existsSync(mdPath)) {
    errors.push(`[${slug}] missing index.md`);
    continue;
  }

  if (seenSlugs.has(slug)) {
    errors.push(`[${slug}] duplicate slug`);
  }
  seenSlugs.add(slug);

  const raw = fs.readFileSync(mdPath, 'utf-8');
  const { data, content } = matter(raw);

  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`[${slug}] missing required field: ${field}`);
    }
  }

  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    errors.push(`[${slug}] invalid date: ${data.date}`);
  }

  if (!Array.isArray(data.tags) && typeof data.tags !== 'string') {
    errors.push(`[${slug}] tags must be an array or comma-separated string`);
  }

  const markdownHasBody = content.trim().length > 0;
  const htmlHasBody = fs.existsSync(htmlPath)
    ? hasHtmlBody(fs.readFileSync(htmlPath, 'utf-8'))
    : false;

  if (!markdownHasBody && !htmlHasBody) {
    errors.push(`[${slug}] missing article body: add markdown content in index.md or html body in index.html`);
  }
  const idKey = String(data.ID);
  if (seenIds.has(idKey)) {
    errors.push(`[${slug}] duplicate ID ${data.ID} (also in ${seenIds.get(idKey)})`);
  } else {
    seenIds.set(idKey, slug);
  }
}

if (errors.length > 0) {
  console.error('Blog content validation failed:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log(`Blog content validation passed for ${dirs.length} article(s).`);
