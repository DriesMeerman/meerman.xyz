import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { load as loadHtml } from 'cheerio';
import matter from 'gray-matter';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { copyDirSync, ensureDir, listArticleSlugs, listFilesRecursive } from '../lib/articles';
import { getCommandCache, hashFiles, isCacheEntryValid, loadBuildCache, removeOutputs, saveBuildCache } from '../lib/cache';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

const cleanOutput = process.env.BLOG_CLEAN_OUTPUT === '1';
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif']);

function createMarkedRenderer(slug: string) {
	const marked = new Marked({ gfm: true, breaks: true });
	marked.use(markedFootnote({ prefixId: `/blog/${slug}#footnote-` }));
	return marked;
}

function normalizeRelativeAssetSource(src: string, slug: string) {
	if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;

	if (src.startsWith('./') || src.startsWith('../') || (!src.includes('/') && imageExtensions.has(path.extname(src).toLowerCase()))) {
		const imageName = src.replace(/^\.\//, '').replace(/^\.\.\//, '');
		return `/assets/articles/${slug}/${imageName}`;
	}

	return `/${src.replace(/^static\//, '')}`;
}

function normalizeAssetSources(html: string, slug: string) {
	const $ = loadHtml(html, { decodeEntities: false }, false);
	$('img').each((_, element) => {
		const src = $(element).attr('src');
		if (src) $(element).attr('src', normalizeRelativeAssetSource(src, slug));
	});
	return $.root().html() ?? html;
}

function parseTailwindConfig(scriptBody: string) {
	const sandbox = { tailwind: {}, window: {} };
	vm.createContext(sandbox);
	vm.runInContext(scriptBody, sandbox, { timeout: 1000 });
	const tailwindWindow = sandbox.window as { tailwind?: { config?: object } };
	const tailwindGlobal = sandbox.tailwind as { config?: object };
	return tailwindGlobal.config || tailwindWindow.tailwind?.config || {};
}

function isInsideKeyframes(rule: import('postcss').Rule) {
	let parent = rule.parent;
	while (parent) {
		if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return true;
		parent = parent.parent;
	}
	return false;
}

function scopeCssToArticle(css: string) {
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

async function generateTailwindStylesheet(slug: string, htmlForScan: string, tailwindConfig: object) {
	const result = await postcss([
		tailwindcss({
			content: [{ raw: htmlForScan, extension: 'html' }],
			...(tailwindConfig as object)
		})
	]).process('@tailwind utilities;\n', { from: undefined });

	const outputDir = path.join(siteConfig.articleAssetDir, slug);
	const outputPath = path.join(outputDir, 'tailwind.generated.css');
	ensureDir(outputDir);
	fs.writeFileSync(outputPath, scopeCssToArticle(result.css));
	console.log(`Generated Tailwind CSS: ${outputPath}`);
	return {
		href: `/assets/articles/${slug}/tailwind.generated.css`,
		outputPath
	};
}

function writeHtmlOutput(slug: string, html: string) {
	const outputPath = path.join(siteConfig.articleHtmlDir, `${slug}.html`);
	ensureDir(siteConfig.articleHtmlDir);
	fs.writeFileSync(outputPath, html);
	console.log(`Wrote ${outputPath}`);
	return outputPath;
}

function cleanupStaleOutputs(generatedSlugs: string[]) {
	if (!cleanOutput || !fs.existsSync(siteConfig.articleHtmlDir)) return;

	const expectedFiles = new Set(generatedSlugs.map((slug) => `${slug}.html`));
	for (const file of fs.readdirSync(siteConfig.articleHtmlDir)) {
		if (file.endsWith('.html') && !expectedFiles.has(file)) {
			fs.rmSync(path.join(siteConfig.articleHtmlDir, file), { force: true });
			console.log(`Removed stale generated article: ${file}`);
		}
	}
}

function renderMarkdownArticle(slug: string, markdownPath: string) {
	const rawMarkdown = fs.readFileSync(markdownPath, 'utf8');
	const { content } = matter(rawMarkdown);
	const marked = createMarkedRenderer(slug);
	return writeHtmlOutput(slug, normalizeAssetSources(marked.parse(content), slug));
}

async function renderHtmlArticle(slug: string, htmlPath: string) {
	const source = fs.readFileSync(htmlPath, 'utf8');
	const document = loadHtml(source, { decodeEntities: false });
	const head = document('head');
	const body = document('body');
	let headHtml = head.length > 0 ? head.html() ?? '' : '';
	let bodyHtml = body.length > 0 ? body.html() ?? '' : source;

	const tailwindScript = head
		.find('script[src]')
		.filter((_, element) => (document(element).attr('src') ?? '').includes('https://cdn.tailwindcss.com'))
		.first();
	const configScript = head
		.find('script')
		.filter((_, element) => (document(element).html() ?? '').includes('tailwind.config'))
		.first();

	if (tailwindScript.length > 0 && configScript.length > 0) {
		try {
			const tailwindConfig = parseTailwindConfig(configScript.html() ?? '');
			tailwindScript.remove();
			configScript.remove();
			headHtml = head.html() ?? '';
			const generatedStylesheet = await generateTailwindStylesheet(slug, `${headHtml}\n${bodyHtml}`, tailwindConfig);
			headHtml = `<link rel="stylesheet" href="${generatedStylesheet.href}">\n${headHtml}`;
			const htmlOutputPath = writeHtmlOutput(slug, normalizeAssetSources(`${headHtml}\n${bodyHtml}`, slug));
			return [htmlOutputPath, generatedStylesheet.outputPath];
		} catch (error) {
			console.warn(`Tailwind static generation failed for ${slug}; falling back to runtime script.`);
			console.warn(error instanceof Error ? error.message : error);
			headHtml = head.length > 0 ? head.html() ?? '' : '';
			bodyHtml = body.length > 0 ? body.html() ?? '' : source;
		}
	}

	return [writeHtmlOutput(slug, normalizeAssetSources(`${headHtml}\n${bodyHtml}`, slug))];
}

export async function runConvertArticles(): Promise<CommandResult> {
	ensureDir(siteConfig.articleHtmlDir);
	ensureDir(siteConfig.articleAssetDir);

	const articleSlugs = listArticleSlugs();
	const outputPaths: string[] = [];
	const buildCache = loadBuildCache();
	const commandCache = getCommandCache(buildCache, 'convert-articles');
	if (articleSlugs.length === 0) {
		console.log('No article folders found');
		return { name: 'convert-articles', outputPaths, timestamp: Date.now() };
	}

	const currentKeys = new Set<string>();

	for (const slug of articleSlugs) {
		currentKeys.add(slug);
		const articleDir = path.join(siteConfig.contentDir, slug);
		const markdownPath = path.join(articleDir, 'index.md');
		const htmlPath = path.join(articleDir, 'index.html');
		const assetsPath = path.join(articleDir, 'assets');

		if (!fs.existsSync(markdownPath)) {
			console.log(`Skipping ${slug} (missing index.md)`);
			continue;
		}

		const sourcePaths = [
			markdownPath,
			...(fs.existsSync(htmlPath) ? [htmlPath] : []),
			...listFilesRecursive(assetsPath)
		];
		const sourceHash = hashFiles(sourcePaths);
		const cacheEntry = commandCache[slug];
		if (isCacheEntryValid(cacheEntry, sourceHash)) {
			console.log(`Skipping ${slug} (unchanged)`);
			outputPaths.push(...cacheEntry.outputPaths);
			continue;
		}

		if (cacheEntry) {
			removeOutputs(cacheEntry.outputPaths);
		}

		const articleOutputPaths: string[] = [];
		if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory()) {
			const destination = path.join(siteConfig.articleAssetDir, slug);
			fs.rmSync(destination, { recursive: true, force: true });
			console.log(`Copying assets from ${assetsPath} to ${destination}`);
			articleOutputPaths.push(...copyDirSync(assetsPath, destination));
		}

		articleOutputPaths.push(
			...(fs.existsSync(htmlPath)
				? await renderHtmlArticle(slug, htmlPath)
				: [renderMarkdownArticle(slug, markdownPath)])
		);
		commandCache[slug] = {
			sourceHash,
			outputPaths: articleOutputPaths,
			timestamp: Date.now()
		};
		outputPaths.push(...articleOutputPaths);
	}

	for (const key of Object.keys(commandCache)) {
		if (!currentKeys.has(key)) {
			removeOutputs(commandCache[key].outputPaths);
			delete commandCache[key];
		}
	}

	cleanupStaleOutputs(articleSlugs);
	saveBuildCache(buildCache);
	console.log('\n✓ Markdown/HTML conversion complete!');
	return { name: 'convert-articles', outputPaths, timestamp: Date.now() };
}

if (isDirectExecution(import.meta.url)) {
	runConvertArticles().catch((error) => {
		console.error('Markdown/HTML conversion failed:', error);
		process.exit(1);
	});
}
