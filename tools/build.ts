import { runConvertArticles } from './commands/convert-articles';
import { runFetchExternalAssets } from './commands/fetch-external-assets';
import { runGenerateIndex } from './commands/generate-index';
import { runGenerateSitemap } from './commands/generate-sitemap';
import { runOptimizeImages } from './commands/optimize-images';
import { runValidate } from './commands/validate';
import { isDirectExecution } from './lib/config';

const pipelines = {
	validate: async () => [await runValidate()],
	index: async () => [await runGenerateIndex()],
	articles: async () => [await runConvertArticles()],
	images: async () => [await runOptimizeImages()],
	sitemap: async () => [await runGenerateSitemap()],
	'fetch-assets': async () => [await runFetchExternalAssets()],
	content: async () => [await runValidate(), await runGenerateIndex(), await runConvertArticles(), await runGenerateSitemap()],
	all: async () => [
		await runValidate(),
		await runGenerateIndex(),
		await runConvertArticles(),
		await runOptimizeImages(),
		await runGenerateSitemap()
	]
} as const;

export async function runBuild(target: keyof typeof pipelines = 'all') {
	if (!(target in pipelines)) {
		throw new Error(`Unknown build target "${target}". Expected one of: ${Object.keys(pipelines).join(', ')}`);
	}

	const startedAt = Date.now();
	const results = await pipelines[target]();
	console.log(`Completed "${target}" in ${Date.now() - startedAt}ms.`);
	return results;
}

if (isDirectExecution(import.meta.url)) {
	const target = (process.argv[2] as keyof typeof pipelines | undefined) ?? 'all';
	runBuild(target).catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
