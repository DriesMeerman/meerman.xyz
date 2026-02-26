const fs = require('fs');
const path = require('path');
const vm = require('vm');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
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

function parseTailwindConfigFromScript(scriptBody) {
  const sandbox = { tailwind: {}, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(scriptBody, sandbox, { timeout: 1000 });

  return sandbox.tailwind?.config || sandbox.window?.tailwind?.config || null;
}

function isInsideKeyframes(rule) {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function scopeCssToArticle(css) {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (isInsideKeyframes(rule)) return;
    if (!Array.isArray(rule.selectors) || rule.selectors.length === 0) return;

    rule.selectors = rule.selectors.map((selector) => {
      const trimmed = selector.trim();
      if (!trimmed || trimmed.startsWith('.article-content')) return selector;
      return `.article-content ${trimmed}`;
    });
  });
  return root.toString();
}

async function generateTailwindStylesheet(slug, htmlForScan, tailwindConfig) {
  // Avoid injecting an extra global Tailwind preflight/base layer from article HTML.
  // The app already ships site-level Tailwind styles; article-specific utilities are enough.
  const cssInput = '@tailwind utilities;\n';
  const config = {
    content: [{ raw: htmlForScan, extension: 'html' }],
    ...tailwindConfig
  };

  const result = await postcss([tailwindcss(config)]).process(cssInput, { from: undefined });
  const scopedCss = scopeCssToArticle(result.css);

  const destDir = path.join(assetsOutputDir, slug);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const outFile = path.join(destDir, 'tailwind.generated.css');
  fs.writeFileSync(outFile, scopedCss);

  console.log(`Generated Tailwind CSS: ${outFile}`);
  return `/assets/articles/${slug}/tailwind.generated.css`;
}

function extractHeadAndBody(htmlContent) {
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  return {
    head: headMatch ? headMatch[1] : '',
    body: bodyMatch ? bodyMatch[1] : htmlContent
  };
}

async function renderHtmlArticle(slug, htmlPath) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const { head, body } = extractHeadAndBody(htmlContent);

  let finalHead = head;
  let finalBody = body;

  const tailwindCdnRegex = /<script[^>]+src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/i;
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

  let tailwindConfigScript = null;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(head)) !== null) {
    if (scriptMatch[1] && scriptMatch[1].includes('tailwind.config')) {
      tailwindConfigScript = scriptMatch[0];
      break;
    }
  }

  const hasTailwindRuntime = tailwindCdnRegex.test(head) && tailwindConfigScript;

  if (hasTailwindRuntime) {
    try {
      const configBodyMatch = tailwindConfigScript.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const configBody = configBodyMatch ? configBodyMatch[1] : '';
      const tailwindConfig = parseTailwindConfigFromScript(configBody) || {};

      finalHead = finalHead.replace(tailwindCdnRegex, '');
      finalHead = finalHead.replace(tailwindConfigScript, '');

      const cssHref = await generateTailwindStylesheet(slug, `${finalHead}\n${finalBody}`, tailwindConfig);
      finalHead = `<link rel="stylesheet" href="${cssHref}">\n${finalHead}`;
    } catch (err) {
      console.warn(`Tailwind static generation failed for ${slug}; falling back to runtime script.`);
      console.warn(err?.message || err);
      finalHead = head;
      finalBody = body;
    }
  }

  let extracted = `${finalHead}\n${finalBody}`;
  extracted = normalizeAssetSrc(extracted, slug);

  writeHtmlOutput(slug, extracted);
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

async function run() {
  const articleDirs = listArticleDirs(inputDir);
  if (articleDirs.length === 0) {
    console.log('No article folders found');
    return;
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
      await renderHtmlArticle(slug, htmlPath);
    } else {
      renderMarkdownArticle(slug, mdPath);
    }

    generatedSlugs.push(slug);
  }

  cleanupStaleOutputs(generatedSlugs);
  console.log('\n✓ Markdown/HTML conversion complete!');
}

run().catch((err) => {
  console.error('Markdown/HTML conversion failed:', err);
  process.exit(1);
});
