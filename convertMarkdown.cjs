const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const matter = require('gray-matter');
const markedFootnote = require('marked-footnote');

const inputDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, 'content/blog');
const outputDir = process.env.BLOG_HTML_OUT_DIR || path.join(__dirname, 'static/articles');
const assetsOutputDir = path.join(__dirname, 'static/assets/articles');
const cleanOutput = process.env.BLOG_CLEAN_OUTPUT === '1';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(assetsOutputDir)) {
  fs.mkdirSync(assetsOutputDir, { recursive: true });
}

const marked = new Marked({
  gfm: true,
  breaks: true
});

function listArticleDirs(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Copied asset: ${entry.name}`);
    }
  }
}

function isImageFile(filePath) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];
  return imageExtensions.includes(path.extname(filePath).toLowerCase());
}

function normalizeAssetSrc(html, slug) {
  return html.replace(/<img\s+([^>]*?)src=["'](.*?)["']([^>]*)>/g, (m, pre, src, post) => {
    if (/^https?:\/\//i.test(src)) return m;

    let normalized = src;

    if (
      src.startsWith('./') ||
      src.startsWith('../') ||
      (!src.includes('/') && isImageFile(src))
    ) {
      const imageName = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
      normalized = `/assets/articles/${slug}/${imageName}`;
    } else {
      if (!src.startsWith('/')) normalized = '/' + src;
      normalized = normalized.replace(/^(\/)?static\//, '/');
    }

    return `<img ${pre}src="${normalized}"${post}>`;
  });
}

function writeHtmlOutput(slug, html) {
  const outputPath = path.join(outputDir, `${slug}.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`Wrote ${outputPath}`);
  return outputPath;
}

function renderMarkdownArticle(slug, mdPath) {
  const content = fs.readFileSync(mdPath, 'utf-8');
  const { content: markdownContent } = matter(content);

  marked.use(
    markedFootnote({
      prefixId: `/blog/${slug}#footnote-`
    })
  );

  let html = marked.parse(markdownContent);
  html = normalizeAssetSrc(html, slug);
  writeHtmlOutput(slug, html);
}

function renderHtmlArticle(slug, htmlPath) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // If this is a full HTML document, keep head resources (styles/scripts/links)
  // and render body content only so it works inside the blog route shell.
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  let extracted = htmlContent;
  if (headMatch || bodyMatch) {
    const head = headMatch ? headMatch[1] : '';
    const body = bodyMatch ? bodyMatch[1] : htmlContent;
    extracted = `${head}\n${body}`;
  }

  const normalized = normalizeAssetSrc(extracted, slug);
  writeHtmlOutput(slug, normalized);
}

function cleanupStaleOutputs(generatedSlugs) {
  if (!cleanOutput) return;

  const generatedSet = new Set(generatedSlugs.map((slug) => `${slug}.html`));
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.html'));

  for (const file of files) {
    if (!generatedSet.has(file)) {
      const fullPath = path.join(outputDir, file);
      fs.rmSync(fullPath);
      console.log(`Removed stale generated article: ${file}`);
    }
  }
}

const articleDirs = listArticleDirs(inputDir);
if (articleDirs.length === 0) {
  console.log('No article folders found');
  process.exit(0);
}

const generatedSlugs = [];

for (const articleDir of articleDirs) {
  const slug = path.basename(articleDir);
  const mdPath = path.join(articleDir, 'index.md');
  const htmlPath = path.join(articleDir, 'index.html');
  const assetsPath = path.join(articleDir, 'assets');

  if (!fs.existsSync(mdPath)) {
    console.log(`Skipping ${slug} (missing index.md)`);
    continue;
  }

  if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory()) {
    const destAssetsFolder = path.join(assetsOutputDir, slug);
    console.log(`Copying assets from ${assetsPath} to ${destAssetsFolder}`);
    copyDirSync(assetsPath, destAssetsFolder);
  }

  if (fs.existsSync(htmlPath)) {
    renderHtmlArticle(slug, htmlPath);
  } else {
    renderMarkdownArticle(slug, mdPath);
  }

  generatedSlugs.push(slug);
}

cleanupStaleOutputs(generatedSlugs);

console.log('\n✓ Markdown/HTML conversion complete!');
