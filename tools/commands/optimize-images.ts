import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ensureDir, listFilesRecursive } from '../lib/articles';
import { getCommandCache, hashFiles, isCacheEntryValid, loadBuildCache, removeOutputs, saveBuildCache } from '../lib/cache';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

const rasterExtensions = new Set(['.png', '.jpg', '.jpeg']);

async function copyAndOptimizeImage(sourcePath: string, outputPath: string) {
	const image = sharp(sourcePath, { failOn: 'none' }).rotate();
	const metadata = await image.metadata();

	if (!metadata.width) {
		fs.copyFileSync(sourcePath, outputPath);
		return [outputPath];
	}

	fs.copyFileSync(sourcePath, outputPath);
	const outputs = [outputPath];
	const extension = path.extname(sourcePath).toLowerCase();
	const basePath = outputPath.slice(0, -extension.length);

	for (const size of siteConfig.imageSizes) {
		const nativePath = `${basePath}-${size}${extension}`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width: size, withoutEnlargement: true })
			.withMetadata()
			.toFile(nativePath);
		outputs.push(nativePath);

		const webpPath = `${basePath}-${size}.webp`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width: size, withoutEnlargement: true })
			.webp({ quality: 82 })
			.toFile(webpPath);
		outputs.push(webpPath);

		const avifPath = `${basePath}-${size}.avif`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width: size, withoutEnlargement: true })
			.avif({ quality: 55 })
			.toFile(avifPath);
		outputs.push(avifPath);
	}

	return outputs;
}

function getExpectedOutputPaths(sourcePath: string) {
	const relativePath = path.relative(siteConfig.staticAssetDir, sourcePath);
	const targetPath = path.join(siteConfig.optimizedAssetDir, relativePath);
	const extension = path.extname(sourcePath).toLowerCase();

	if (!rasterExtensions.has(extension)) {
		return [targetPath];
	}

	const basePath = targetPath.slice(0, -extension.length);
	const outputPaths = [targetPath];
	for (const size of siteConfig.imageSizes) {
		outputPaths.push(`${basePath}-${size}${extension}`);
		outputPaths.push(`${basePath}-${size}.webp`);
		outputPaths.push(`${basePath}-${size}.avif`);
	}

	return outputPaths;
}

export async function runOptimizeImages(): Promise<CommandResult> {
	ensureDir(siteConfig.optimizedAssetDir);

	const buildCache = loadBuildCache();
	const commandCache = getCommandCache(buildCache, 'optimize-images');
	const outputPaths: string[] = [];
	const sourceFiles = listFilesRecursive(siteConfig.staticAssetDir);
	const currentKeys = new Set<string>();

	for (const sourcePath of sourceFiles) {
		const relativePath = path.relative(siteConfig.staticAssetDir, sourcePath);
		currentKeys.add(relativePath);
		const sourceHash = hashFiles([sourcePath]);
		const cacheEntry = commandCache[relativePath];

		if (isCacheEntryValid(cacheEntry, sourceHash)) {
			console.log(`Skipping image ${relativePath} (unchanged)`);
			outputPaths.push(...cacheEntry.outputPaths);
			continue;
		}

		if (cacheEntry) {
			removeOutputs(cacheEntry.outputPaths);
		}

		const targetPath = path.join(siteConfig.optimizedAssetDir, relativePath);
		ensureDir(path.dirname(targetPath));
		const extension = path.extname(sourcePath).toLowerCase();
		const normalizedOutputPaths = rasterExtensions.has(extension)
			? await copyAndOptimizeImage(sourcePath, targetPath)
			: (fs.copyFileSync(sourcePath, targetPath), [targetPath]);
		commandCache[relativePath] = {
			sourceHash,
			outputPaths: normalizedOutputPaths,
			timestamp: Date.now()
		};
		outputPaths.push(...normalizedOutputPaths);
	}

	for (const key of Object.keys(commandCache)) {
		if (!currentKeys.has(key)) {
			removeOutputs(commandCache[key].outputPaths);
			delete commandCache[key];
		}
	}

	saveBuildCache(buildCache);
	console.log(`Generated optimized images in ${siteConfig.optimizedAssetDir}`);

	return { name: 'optimize-images', outputPaths, timestamp: Date.now() };
}

if (isDirectExecution(import.meta.url)) {
	runOptimizeImages().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
