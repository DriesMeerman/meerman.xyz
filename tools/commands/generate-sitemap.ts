import { loadAllArticles, writeFileIfChanged } from '../lib/articles';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export async function runGenerateSitemap(): Promise<CommandResult> {
	const articles = loadAllArticles();
	const urls = [
		...siteConfig.staticPages.map((pagePath) => ({
			loc: `${siteConfig.siteUrl}${pagePath === '/' ? '' : pagePath}`,
			lastmod: undefined as string | undefined
		})),
		...articles.map((article) => ({
			loc: article.url,
			lastmod: article.date
		}))
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(({ loc, lastmod }) => {
		const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
		return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
	})
	.join('\n')}
</urlset>
`;

	writeFileIfChanged(siteConfig.sitemapPath, sitemap);
	const robots = `User-agent: *
Allow: /

Sitemap: ${siteConfig.siteUrl}/sitemap.xml
`;
	writeFileIfChanged(siteConfig.robotsPath, robots);

	console.log(`Generated sitemap with ${urls.length} URLs.`);
	return {
		name: 'generate-sitemap',
		outputPaths: [siteConfig.sitemapPath, siteConfig.robotsPath],
		timestamp: Date.now()
	};
}

if (isDirectExecution(import.meta.url)) {
	runGenerateSitemap().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
