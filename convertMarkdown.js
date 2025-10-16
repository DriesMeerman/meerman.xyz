const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { glob } = require('glob');
const matter = require('gray-matter'); // Add this line

const markedFootnote = require('marked-footnote');

const inputDir = process.env.BLOG_MARKDOWN_DIR || path.join(__dirname, 'src/routes/blog');
const outputDir = process.env.BLOG_HTML_OUT_DIR || path.join(__dirname, 'sveltekit/static');




// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const marked = new Marked({
  gfm: true,
  breaks: true
});




// Find all markdown files
glob(`${inputDir}/**/*.md`).then(files => {

  if (files.length === 0) {
    console.log('No files found');
    return;
  }

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const { content: markdownContent, data: frontmatter } = matter(content); // Add this line

    // Get the filename without extension
    const filename = path.basename(file, '.md');

    // Use the filename in the prefixId
    marked.use(markedFootnote({
      prefixId: `/blog/${filename}#footnote-`
    }));

    let html = marked.parse(markdownContent);

    // Normalize image URLs: make root-relative and point to /assets if not absolute
    html = html.replace(/<img\s+([^>]*?)src=["'](.*?)["']([^>]*)>/g, (m, pre, src, post) => {
      if (/^https?:\/\//i.test(src)) return m; // external, leave as is
      let normalized = src;
      if (!src.startsWith('/')) normalized = '/' + src;
      // if it's under src/static/assets in original project, ensure /assets prefix
      normalized = normalized.replace(/^(\/)?static\//, '/');
      return `<img ${pre}src="${normalized}"${post}>`;
    });

    const relativePath = path.relative(inputDir, file);
    const outputPath = path.join(outputDir, relativePath.replace('.md', '.html'));

    // Ensure the subdirectory exists
    const outputSubDir = path.dirname(outputPath);
    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`Converted ${file} to ${outputPath}`);
  });
}).catch(err => {
  console.error('Error finding markdown files:', err);
});




