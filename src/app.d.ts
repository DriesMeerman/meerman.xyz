// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
/// <reference types="svelte" />
/// <reference types="svelte2tsx/svelte-jsx" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		/** Tinylytics analytics embed loaded from app.html. */
		tinylytics?: { triggerUpdate(): void };
		/** External article scripts already requested, keyed by src, so each loads once. */
		__blogExternalScriptPromises?: Map<string, Promise<void>>;
	}
}

export {};
