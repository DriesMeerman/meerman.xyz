const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { glob } = require('glob');
const matter = require('gray-matter');

const markedFootnote = require('marked-footnote');

const inputDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, 'content/blog');
const outputDir = process.env.BLOG_HTML_OUT_DIR || path.join(__dirname, 'static/articles');
const assetsOutputDir = path.join(__dirname, 'static/assets/articles');

// Ensure the output directories exist
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

/**
 * Recursively copy a directory
 */
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

/**
 * Check if a path is an image file
 */
function isImageFile(filePath) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];
  return imageExtensions.includes(path.extname(filePath).toLowerCase());
}

/**
 * Process a markdown file and its associated assets
 */
function processMarkdownFile(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const { content: markdownContent, data: frontmatter } = matter(content);

  // Get the filename without extension (slug)
  const filename = path.basename(file, '.md');
  const slug = filename;

  // Check for an assets folder with the same name as the markdown file
  const assetsFolder = path.join(path.dirname(file), slug);
  const hasAssetsFolder = fs.existsSync(assetsFolder) && fs.statSync(assetsFolder).isDirectory();

  // Copy assets if the folder exists
  if (hasAssetsFolder) {
    const destAssetsFolder = path.join(assetsOutputDir, slug);
    console.log(`Copying assets from ${assetsFolder} to ${destAssetsFolder}`);
    copyDirSync(assetsFolder, destAssetsFolder);
  }

  // Use the filename in the prefixId for footnotes
  marked.use(markedFootnote({
    prefixId: `/blog/${filename}#footnote-`
  }));

  let html = marked.parse(markdownContent);

  // Normalize image URLs
  // Handles:
  // 1. Relative paths like ./image.png or image.png → /assets/articles/{slug}/image.png
  // 2. Existing assets/articles paths → /assets/articles/...
  // 3. External URLs (https://) → left unchanged
  html = html.replace(/<img\s+([^>]*?)src=["'](.*?)["']([^>]*)>/g, (m, pre, src, post) => {
    // Skip external URLs
    if (/^https?:\/\//i.test(src)) return m;

    let normalized = src;

    // Handle relative paths (./image.png or just image.png without any slashes)
    if (src.startsWith('./') || src.startsWith('../') || (!src.includes('/') && isImageFile(src))) {
      // This is a relative path, convert to the slug's assets folder
      const imageName = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
      normalized = `/assets/articles/${slug}/${imageName}`;
    } else {
      // Handle existing paths
      if (!src.startsWith('/')) normalized = '/' + src;
      // Clean up any static/ prefix
      normalized = normalized.replace(/^(\/)?static\//, '/');
    }

    return `<img ${pre}src="${normalized}"${post}>`;
  });

  // Write the HTML output
  const relativePath = path.relative(inputDir, file);
  const outputPath = path.join(outputDir, relativePath.replace('.md', '.html'));

  // Ensure the subdirectory exists
  const outputSubDir = path.dirname(outputPath);
  if (!fs.existsSync(outputSubDir)) {
    fs.mkdirSync(outputSubDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html);
  console.log(`Converted ${file} to ${outputPath}`);
}

// Find all markdown files
glob(`${inputDir}/**/*.md`).then(files => {

  if (files.length === 0) {
    console.log('No files found');
    return;
  }

  files.forEach(file => {
    processMarkdownFile(file);
  });

  console.log('\n✓ Markdown conversion complete!');
}).catch(err => {
  console.error('Error finding markdown files:', err);
});
