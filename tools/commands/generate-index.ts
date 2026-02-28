import fs from 'node:fs';
import RSS from 'rss';
import { loadAllArticles, writeFileIfChanged } from '../lib/articles';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

export async function runGenerateIndex(): Promise<CommandResult> {
	const articles = loadAllArticles();
	if (articles.length === 0) {
		console.log('No articles found, stopping...');
		return { name: 'generate-index', outputPaths: [], timestamp: Date.now() };
	}

	const seenIds = new Set<string>();
	const seenSlugs = new Set<string>();
	for (const article of articles) {
		const idKey = String(article.ID);
		if (seenIds.has(idKey)) throw new Error(`Duplicate article ID detected: ${String(article.ID)}`);
		if (seenSlugs.has(article.slug)) throw new Error(`Duplicate article slug detected: ${article.slug}`);
		seenIds.add(idKey);
		seenSlugs.add(article.slug);
	}

	fs.writeFileSync(siteConfig.feedJsonPath, JSON.stringify(articles));

	const feed = new RSS({
		title: 'Meerman',
		description: 'Meerman.xyz website and blog',
		feed_url: `${siteConfig.siteUrl}/feed.xml`,
		site_url: `${siteConfig.siteUrl}/`,
		managingEditor: 'Dries Meerman',
		webMaster: 'Dries Meerman',
		ttl: '180'
	});

	for (const article of articles) {
		feed.item({
			title: article.title,
			description: article.summary,
			url: article.url,
			date: new Date(article.date)
		});
	}

	fs.writeFileSync(siteConfig.feedXmlPath, feed.xml());

	const articlesJson = JSON.stringify(articles, null, 2);
	const articleData = `// Generated at ${new Date().toISOString()}
const articlesString = \`${articlesJson}\`;
export const articles = JSON.parse(articlesString);
`;
	const wroteArticleData = writeFileIfChanged(siteConfig.articleDataModulePath, articleData);
	if (wroteArticleData) {
		console.log('articleData.js written');
	} else {
		console.log('articleData.js content unchanged; skipping rewrite (timestamp preserved).');
	}

	console.log(`Indexed ${articles.length} article(s).`);
	return {
		name: 'generate-index',
		outputPaths: [siteConfig.feedJsonPath, siteConfig.feedXmlPath, siteConfig.articleDataModulePath],
		timestamp: Date.now()
	};
}

if (isDirectExecution(import.meta.url)) {
	runGenerateIndex().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
