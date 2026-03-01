import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './articles';
import { siteConfig } from './config';

type CacheEntry = {
	sourceHash: string;
	outputPaths: string[];
	timestamp: number;
};

type CacheFile = {
	version: number;
	commands: Record<string, Record<string, CacheEntry>>;
};

const CACHE_VERSION = 1;

function emptyCache(): CacheFile {
	return {
		version: CACHE_VERSION,
		commands: {}
	};
}

export function loadBuildCache() {
	if (!fs.existsSync(siteConfig.buildCachePath)) {
		return emptyCache();
	}

	try {
		const parsed = JSON.parse(fs.readFileSync(siteConfig.buildCachePath, 'utf8')) as CacheFile;
		if (parsed.version !== CACHE_VERSION || typeof parsed.commands !== 'object' || !parsed.commands) {
			return emptyCache();
		}
		return parsed;
	} catch {
		return emptyCache();
	}
}

export function saveBuildCache(cache: CacheFile) {
	if (fs.existsSync(siteConfig.buildCachePath)) {
		try {
			const current = JSON.parse(fs.readFileSync(siteConfig.buildCachePath, 'utf8')) as CacheFile;
			if (current.version === CACHE_VERSION && typeof current.commands === 'object' && current.commands) {
				cache.commands = {
					...current.commands,
					...cache.commands
				};
			}
		} catch {
			// Ignore malformed on-disk cache and overwrite it.
		}
	}

	ensureDir(path.dirname(siteConfig.buildCachePath));
	fs.writeFileSync(siteConfig.buildCachePath, JSON.stringify(cache, null, 2));
}

export function getCommandCache(cache: CacheFile, commandName: string) {
	cache.commands[commandName] ||= {};
	return cache.commands[commandName];
}

export function hashFiles(filePaths: string[]) {
	const hash = crypto.createHash('sha256');

	for (const filePath of [...filePaths].sort()) {
		hash.update(filePath);
		hash.update('\0');
		hash.update(fs.readFileSync(filePath));
		hash.update('\0');
	}

	return hash.digest('hex');
}

export function isCacheEntryValid(entry: CacheEntry | undefined, sourceHash: string) {
	return Boolean(
		entry &&
		entry.sourceHash === sourceHash &&
		entry.outputPaths.length > 0 &&
		entry.outputPaths.every((outputPath) => fs.existsSync(outputPath))
	);
}

export function removeOutputs(outputPaths: string[]) {
	for (const outputPath of outputPaths) {
		fs.rmSync(outputPath, { recursive: true, force: true });
	}
}
