import { validateArticleTree } from '../lib/articles';
import { isDirectExecution } from '../lib/config';
import type { CommandResult } from '../lib/types';

export async function runValidate(): Promise<CommandResult> {
	const { slugs, errors } = validateArticleTree();

	if (errors.length > 0) {
		console.error('Blog content validation failed:');
		for (const error of errors) {
			console.error(`- ${error}`);
		}
		throw new Error(`Validation failed for ${errors.length} issue(s).`);
	}

	console.log(`Blog content validation passed for ${slugs.length} article(s).`);
	return { name: 'validate', outputPaths: [], timestamp: Date.now() };
}

if (isDirectExecution(import.meta.url)) {
	runValidate().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
