import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { siteConfig } from './config';
import type { ArticleMeta, ArticleRecord } from './types';

export const REQUIRED_FIELDS = ['title', 'summary', 'date', 'author', 'ID', 'tags'] as const;

export function ensureDir(dirPath: string) {
	fs.mkdirSync(dirPath, { recursive: true });
}

export function listArticleSlugs(rootDir = siteConfig.contentDir) {
	if (!fs.existsSync(rootDir)) return [];

	return fs
		.readdirSync(rootDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

export function normalizeTags(tags: unknown, slug: string) {
	if (Array.isArray(tags)) {
		return tags.map((tag) => String(tag).trim()).filter(Boolean);
	}

	if (typeof tags === 'string') {
		return tags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);
	}

	throw new Error(`Article "${slug}" has invalid tags. Expected array or comma-separated string.`);
}

export function hasHtmlBody(html: string) {
	const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
	const bodyMatch = withoutComments.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	const content = bodyMatch ? bodyMatch[1] : withoutComments;
	return content.trim().length > 0;
}

export function validateArticleMeta(meta: Partial<ArticleMeta>, slug: string) {
	const errors: string[] = [];

	for (const field of REQUIRED_FIELDS) {
		if (meta[field] === undefined || meta[field] === null || meta[field] === '') {
			errors.push(`[${slug}] missing required field: ${field}`);
		}
	}

	const date = new Date(String(meta.date ?? ''));
	if (Number.isNaN(date.getTime())) {
		errors.push(`[${slug}] invalid date: ${String(meta.date)}`);
	}

	if (!Array.isArray(meta.tags) && typeof meta.tags !== 'string') {
		errors.push(`[${slug}] tags must be an array or comma-separated string`);
	}

	return errors;
}

export function loadArticle(slug: string, rootDir = siteConfig.contentDir): ArticleRecord | null {
	const dir = path.join(rootDir, slug);
	const mdPath = path.join(dir, 'index.md');
	const htmlPath = path.join(dir, 'index.html');
	const assetsDir = path.join(dir, 'assets');

	if (!fs.existsSync(mdPath)) return null;

	const rawMarkdown = fs.readFileSync(mdPath, 'utf8');
	const { data, content } = matter(rawMarkdown);
	const meta: ArticleMeta = {
		...data,
		tags: normalizeTags(data.tags, slug),
		date: new Date(String(data.date)).toISOString()
	} as ArticleMeta;

	return {
		slug,
		filename: `${slug}.md`,
		sourceType: fs.existsSync(htmlPath) ? 'html' : 'md',
		url: `${siteConfig.siteUrl}/blog/${slug}`,
		dir,
		mdPath,
		htmlPath,
		assetsDir,
		markdownBody: content,
		rawMarkdown,
		...meta
	};
}

export function loadAllArticles(rootDir = siteConfig.contentDir) {
	return listArticleSlugs(rootDir)
		.map((slug) => loadArticle(slug, rootDir))
		.filter((article): article is ArticleRecord => article !== null);
}

export function validateArticleTree(rootDir = siteConfig.contentDir) {
	const slugs = listArticleSlugs(rootDir);
	const errors: string[] = [];
	const seenIds = new Map<string, string>();
	const seenSlugs = new Set<string>();

	for (const slug of slugs) {
		const dir = path.join(rootDir, slug);
		const mdPath = path.join(dir, 'index.md');
		const htmlPath = path.join(dir, 'index.html');

		if (!fs.existsSync(mdPath)) {
			errors.push(`[${slug}] missing index.md`);
			continue;
		}

		if (seenSlugs.has(slug)) {
			errors.push(`[${slug}] duplicate slug`);
		}
		seenSlugs.add(slug);

		const raw = fs.readFileSync(mdPath, 'utf8');
		const { data, content } = matter(raw);
		errors.push(...validateArticleMeta(data as Partial<ArticleMeta>, slug));

		const markdownHasBody = content.trim().length > 0;
		const htmlHasBody = fs.existsSync(htmlPath) ? hasHtmlBody(fs.readFileSync(htmlPath, 'utf8')) : false;
		if (!markdownHasBody && !htmlHasBody) {
			errors.push(`[${slug}] missing article body: add markdown content in index.md or html body in index.html`);
		}

		const idKey = String(data.ID);
		if (seenIds.has(idKey)) {
			errors.push(`[${slug}] duplicate ID ${String(data.ID)} (also in ${seenIds.get(idKey)})`);
		} else {
			seenIds.set(idKey, slug);
		}
	}

	return { slugs, errors };
}

export function copyDirSync(sourceDir: string, targetDir: string) {
	if (!fs.existsSync(sourceDir)) return [];

	ensureDir(targetDir);
	const outputPaths: string[] = [];
	for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
		const sourcePath = path.join(sourceDir, entry.name);
		const targetPath = path.join(targetDir, entry.name);

		if (entry.isDirectory()) {
			outputPaths.push(...copyDirSync(sourcePath, targetPath));
		} else if (entry.name !== '.DS_Store') {
			fs.copyFileSync(sourcePath, targetPath);
			outputPaths.push(targetPath);
		}
	}

	return outputPaths;
}

export function listFilesRecursive(rootDir: string) {
	if (!fs.existsSync(rootDir)) return [];

	const filePaths: string[] = [];
	for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
		const fullPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			filePaths.push(...listFilesRecursive(fullPath));
		} else if (entry.name !== '.DS_Store') {
			filePaths.push(fullPath);
		}
	}

	return filePaths.sort();
}

function normalizeGeneratedTimestamp(content: string) {
	return content.replace(
		/^(\/\/ Generated at |<!-- Generated at )\d{4}-\d{2}-\d{2}T[^ \n]+( -->)?$/m,
		(_, prefix: string, suffix?: string) => `${prefix}__TIMESTAMP__${suffix ?? ''}`
	);
}

export function writeFileIfChanged(filePath: string, content: string) {
	if (fs.existsSync(filePath)) {
		const existingContent = fs.readFileSync(filePath, 'utf8');
		if (existingContent === content) {
			return false;
		}

		if (normalizeGeneratedTimestamp(existingContent) === normalizeGeneratedTimestamp(content)) {
			return false;
		}
	}

	ensureDir(path.dirname(filePath));
	fs.writeFileSync(filePath, content);
	return true;
}
