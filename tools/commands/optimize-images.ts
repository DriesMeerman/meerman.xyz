import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ensureDir, listFilesRecursive, writeFileIfChanged } from '../lib/articles';
import { getCommandCache, hashFiles, isCacheEntryValid, loadBuildCache, removeOutputs, saveBuildCache } from '../lib/cache';
import { isDirectExecution, siteConfig } from '../lib/config';
import type { CommandResult } from '../lib/types';

const rasterExtensions = new Set(['.png', '.jpg', '.jpeg']);
const IMAGE_PIPELINE_SIGNATURE = JSON.stringify({
	sizes: siteConfig.imageSizes,
	webpQuality: 82,
	avifQuality: 55
});

type ImageVariant = {
	width: number;
	height: number;
	fallback: string;
	webp: string;
	avif: string;
};

type ImageManifestEntry = {
	extension: string;
	fallback: string;
	fallbackSrcset: string;
	webp: string;
	webpSrcset: string;
	avif: string;
	avifSrcset: string;
	width: number | null;
	height: number | null;
	variants: ImageVariant[];
};

function toPublicAssetPath(outputPath: string) {
	return outputPath.replace(siteConfig.staticDir, '').split(path.sep).join('/');
}

function getTargetWidths(originalWidth: number) {
	const widths = new Set(siteConfig.imageSizes.filter((size) => size <= originalWidth));
	if (widths.size === 0) {
		widths.add(originalWidth);
	}
	return [...widths].sort((left, right) => left - right);
}

function formatSrcset(variants: ImageVariant[], key: 'fallback' | 'webp' | 'avif') {
	return variants.map((variant) => `${variant[key]} ${variant.width}w`).join(', ');
}

function getVariantHeight(width: number, originalWidth: number, originalHeight: number) {
	return Math.round((originalHeight * width) / originalWidth);
}

async function buildManifestEntry(sourcePath: string, outputPath: string): Promise<ImageManifestEntry> {
	const extension = path.extname(sourcePath).toLowerCase();
	if (!rasterExtensions.has(extension)) {
		return {
			extension: extension.slice(1),
			fallback: toPublicAssetPath(outputPath),
			fallbackSrcset: '',
			webp: '',
			webpSrcset: '',
			avif: '',
			avifSrcset: '',
			width: null,
			height: null,
			variants: []
		};
	}

	const metadata = await sharp(sourcePath, { failOn: 'none' }).rotate().metadata();
	if (!metadata.width) {
		return {
			extension: extension.slice(1),
			fallback: toPublicAssetPath(outputPath),
			fallbackSrcset: '',
			webp: '',
			webpSrcset: '',
			avif: '',
			avifSrcset: '',
			width: null,
			height: null,
			variants: []
		};
	}

	const basePath = outputPath.slice(0, -extension.length);
	const targetWidths = getTargetWidths(metadata.width);
	const variants = targetWidths.map((width) => ({
		width,
		height: getVariantHeight(width, metadata.width!, metadata.height ?? metadata.width!),
		fallback: toPublicAssetPath(`${basePath}-${width}${extension}`),
		webp: toPublicAssetPath(`${basePath}-${width}.webp`),
		avif: toPublicAssetPath(`${basePath}-${width}.avif`)
	}));
	const defaultVariant = variants.find((variant) => variant.width === 400) ?? variants[variants.length - 1];

	return {
		extension: extension.slice(1),
		fallback: defaultVariant.fallback,
		fallbackSrcset: formatSrcset(variants, 'fallback'),
		webp: defaultVariant.webp,
		webpSrcset: formatSrcset(variants, 'webp'),
		avif: defaultVariant.avif,
		avifSrcset: formatSrcset(variants, 'avif'),
		width: defaultVariant.width,
		height: defaultVariant.height,
		variants
	};
}

async function copyAndOptimizeImage(sourcePath: string, outputPath: string) {
	const image = sharp(sourcePath, { failOn: 'none' }).rotate();
	const metadata = await image.metadata();
	const extension = path.extname(sourcePath).toLowerCase();

	if (!metadata.width) {
		fs.copyFileSync(sourcePath, outputPath);
		return {
			outputPaths: [outputPath],
			manifestEntry: {
				extension: extension.slice(1),
				fallback: toPublicAssetPath(outputPath),
				fallbackSrcset: '',
				webp: '',
				webpSrcset: '',
				avif: '',
				avifSrcset: '',
				width: null,
				height: null,
				variants: []
			} satisfies ImageManifestEntry
		};
	}

	fs.copyFileSync(sourcePath, outputPath);
	const outputs = [outputPath];
	const basePath = outputPath.slice(0, -extension.length);
	const targetWidths = getTargetWidths(metadata.width);
	const variants: ImageVariant[] = [];

	for (const width of targetWidths) {
		const nativePath = `${basePath}-${width}${extension}`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width })
			.withMetadata()
			.toFile(nativePath);
		outputs.push(nativePath);

		const webpPath = `${basePath}-${width}.webp`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width })
			.webp({ quality: 82 })
			.toFile(webpPath);
		outputs.push(webpPath);

		const avifPath = `${basePath}-${width}.avif`;
		await sharp(sourcePath, { failOn: 'none' })
			.rotate()
			.resize({ width })
			.avif({ quality: 55 })
			.toFile(avifPath);
		outputs.push(avifPath);

		variants.push({
			width,
			height: getVariantHeight(width, metadata.width, metadata.height ?? metadata.width),
			fallback: toPublicAssetPath(nativePath),
			webp: toPublicAssetPath(webpPath),
			avif: toPublicAssetPath(avifPath)
		});
	}

	const defaultVariant = variants.find((variant) => variant.width === 400) ?? variants[variants.length - 1];
	return {
		outputPaths: outputs,
		manifestEntry: {
			extension: extension.slice(1),
			fallback: defaultVariant.fallback,
			fallbackSrcset: formatSrcset(variants, 'fallback'),
			webp: defaultVariant.webp,
			webpSrcset: formatSrcset(variants, 'webp'),
			avif: defaultVariant.avif,
			avifSrcset: formatSrcset(variants, 'avif'),
			width: defaultVariant.width,
			height: defaultVariant.height,
			variants
		} satisfies ImageManifestEntry
	};
}

export async function runOptimizeImages(): Promise<CommandResult> {
	ensureDir(siteConfig.optimizedAssetDir);

	const buildCache = loadBuildCache();
	const commandCache = getCommandCache(buildCache, 'optimize-images');
	const outputPaths: string[] = [];
	const sourceFiles = listFilesRecursive(siteConfig.staticAssetDir);
	const currentKeys = new Set<string>();
	const imageManifest: Record<string, ImageManifestEntry> = {};

	for (const sourcePath of sourceFiles) {
		const relativePath = path.relative(siteConfig.staticAssetDir, sourcePath);
		currentKeys.add(relativePath);
		const sourceHash = `${hashFiles([sourcePath])}:${IMAGE_PIPELINE_SIGNATURE}`;
		const cacheEntry = commandCache[relativePath];
		const targetPath = path.join(siteConfig.optimizedAssetDir, relativePath);
		imageManifest[relativePath] = await buildManifestEntry(sourcePath, targetPath);

		if (isCacheEntryValid(cacheEntry, sourceHash)) {
			console.log(`Skipping image ${relativePath} (unchanged)`);
			outputPaths.push(...cacheEntry.outputPaths);
			continue;
		}

		if (cacheEntry) {
			removeOutputs(cacheEntry.outputPaths);
		}

		ensureDir(path.dirname(targetPath));
		const extension = path.extname(sourcePath).toLowerCase();
		let normalizedOutputPaths: string[];
		if (rasterExtensions.has(extension)) {
			const optimizedImage = await copyAndOptimizeImage(sourcePath, targetPath);
			normalizedOutputPaths = optimizedImage.outputPaths;
		} else {
			fs.copyFileSync(sourcePath, targetPath);
			normalizedOutputPaths = [targetPath];
		}
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

	const imageData = `// Generated at ${new Date().toISOString()}
export const imageManifest = ${JSON.stringify(imageManifest, null, 2)};
`;
	const wroteImageData = writeFileIfChanged(siteConfig.imageDataModulePath, imageData);
	if (wroteImageData) {
		console.log('imageData.js written');
	} else {
		console.log('imageData.js content unchanged; skipping rewrite (timestamp preserved).');
	}

	saveBuildCache(buildCache);
	console.log(`Generated optimized images in ${siteConfig.optimizedAssetDir}`);

	return {
		name: 'optimize-images',
		outputPaths: [...outputPaths, siteConfig.imageDataModulePath],
		timestamp: Date.now()
	};
}

if (isDirectExecution(import.meta.url)) {
	runOptimizeImages().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
