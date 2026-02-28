import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');

export const siteConfig = {
	repoRoot,
	siteUrl: 'https://meerman.xyz',
	contentDir: process.env.BLOG_MARKDOWN_DIR || path.join(repoRoot, 'content/blog'),
	staticDir: path.join(repoRoot, 'static'),
	staticAssetDir: path.join(repoRoot, 'static/assets'),
	optimizedAssetDir: path.join(repoRoot, 'static/g/assets'),
	buildCachePath: path.join(repoRoot, '.cache/build-hashes.json'),
	articleHtmlDir: process.env.BLOG_HTML_OUT_DIR || path.join(repoRoot, 'static/articles'),
	articleAssetDir: path.join(repoRoot, 'static/assets/articles'),
	feedJsonPath: path.join(repoRoot, 'static/feed.json'),
	feedXmlPath: path.join(repoRoot, 'static/feed.xml'),
	sitemapPath: path.join(repoRoot, 'static/sitemap.xml'),
	robotsPath: path.join(repoRoot, 'static/robots.txt'),
	articleDataModulePath: process.env.BLOG_DATA_OUT_DIR
		? path.join(process.env.BLOG_DATA_OUT_DIR, 'articleData.js')
		: path.join(repoRoot, 'src/lib/data/articleData.js'),
	skillDataPath: path.join(repoRoot, 'src/lib/data/skillData.js'),
	imageSizes: [400, 306],
	staticPages: ['/', '/skills', '/experience', '/education', '/tools', '/cats', '/blog']
} as const;

export function isDirectExecution(moduleUrl: string) {
	const entry = process.argv[1];
	return Boolean(entry && pathToFileURL(entry).href === moduleUrl);
}
