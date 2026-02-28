export type ArticleSourceType = 'md' | 'html';

export type ArticleMeta = {
	title: string;
	summary: string;
	date: string;
	author: string;
	ID: number | string;
	tags: string[];
	[key: string]: unknown;
};

export type ArticleRecord = ArticleMeta & {
	slug: string;
	filename: string;
	sourceType: ArticleSourceType;
	url: string;
	dir: string;
	mdPath: string;
	htmlPath: string;
	assetsDir: string;
	markdownBody: string;
	rawMarkdown: string;
};

export type CommandResult = {
	name: string;
	outputPaths: string[];
	timestamp: number;
};

export type ImageVariant = {
	size: number;
	format: 'native' | 'webp' | 'avif';
	outputPath: string;
};
