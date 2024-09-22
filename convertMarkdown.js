const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { glob } = require('glob');
const matter = require('gray-matter'); // Add this line

const markedFootnote = require('marked-footnote');

const inputDir = 'src/routes/blog'; // Adjust this to your markdown files location
const outputDir = 'static/'; // Adjust this to your desired output location




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

    const html = marked.parse(markdownContent);

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




