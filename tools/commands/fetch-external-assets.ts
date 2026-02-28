import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from '../lib/articles';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

const imageFieldPattern = /"image":\s*"(https?:\/\/[^"]+)"/g;

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
}

function inferExtension(url: string, contentType: string | null) {
	const fromContentType = contentType?.split('/')[1]?.split(';')[0]?.trim().toLowerCase();
	if (fromContentType === 'svg+xml') return 'svg';
	if (fromContentType && /^[a-z0-9]+$/i.test(fromContentType)) return fromContentType;
	const extension = path.extname(new URL(url).pathname).replace('.', '').toLowerCase();
	return extension || 'png';
}

function buildReplacement(assetName: string, extension: string) {
	if (extension === 'svg') {
		return `"/g/assets/logos/${assetName}.svg"`;
	}
	return `getImage("logos/${assetName}", "${extension}", 400)`;
}

export async function runFetchExternalAssets(): Promise<CommandResult> {
	const source = fs.readFileSync(siteConfig.skillDataPath, 'utf8');
	const matches = [...source.matchAll(imageFieldPattern)];
	if (matches.length === 0) {
		console.log('No external image URLs found.');
		return { name: 'fetch-external-assets', outputPaths: [], timestamp: Date.now() };
	}

	const urlToAsset = new Map<string, { assetName: string; extension: string; outputPath: string }>();
	const outputPaths: string[] = [];

	for (const [index, match] of matches.entries()) {
		const url = match[1];
		if (urlToAsset.has(url)) continue;

		console.log(`Downloading ${url}`);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
		}

		const extension = inferExtension(url, response.headers.get('content-type'));
		const basename = path.basename(new URL(url).pathname, path.extname(new URL(url).pathname));
		const assetName = `${slugify(basename) || 'logo'}_${String(index + 1).padStart(2, '0')}`;
		const outputPath = path.join(siteConfig.staticAssetDir, 'logos', `${assetName}.${extension}`);

		ensureDir(path.dirname(outputPath));
		fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));

		urlToAsset.set(url, { assetName, extension, outputPath });
		outputPaths.push(outputPath);
	}

	let updatedSource = source;
	for (const [url, asset] of urlToAsset) {
		const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		updatedSource = updatedSource.replace(new RegExp(`"image":\\s*"${escapedUrl}"`, 'g'), `"image": ${buildReplacement(asset.assetName, asset.extension)}`);
	}

	fs.writeFileSync(siteConfig.skillDataPath, updatedSource);
	console.log(`Localized ${urlToAsset.size} external asset(s).`);

	return {
		name: 'fetch-external-assets',
		outputPaths: [siteConfig.skillDataPath, ...outputPaths],
		timestamp: Date.now()
	};
}

if (isDirectExecution(import.meta.url)) {
	runFetchExternalAssets().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
