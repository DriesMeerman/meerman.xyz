# Codebase Analysis & Improvement Plan

**Date:** 2026-02-28
**Project:** meerman.xyz (SvelteKit personal website + blog)

---

## Table of Contents

1. [Decisions](#decisions)
2. [Resolved Questions](#resolved-questions)
3. [Executive Summary](#executive-summary)
4. [Architecture Overview](#architecture-overview)
5. [Visual Regression Testing](#visual-regression-testing)
6. [Build Pipeline Analysis](#build-pipeline-analysis)
7. [Build Tooling Architecture](#build-tooling-architecture)
8. [Image Pipeline Analysis](#image-pipeline-analysis)
9. [Particles.js Replacement](#particlesjs-replacement)
10. [Dead Code & Unused Files](#dead-code--unused-files)
11. [Code Quality & Modernization](#code-quality--modernization)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Performance](#performance)
14. [Prioritized Action Items](#prioritized-action-items)

---

## Decisions

Confirmed decisions that guide the implementation work.

### D1: Particles — Custom Canvas renderer ✅

**Decision:** Replace the `particles.js` fork with a custom, minimal Canvas-based particle renderer written in TypeScript as a Svelte component.

**Rationale:**
- The fork (`github:DriesMeerman/particles.js`) is unmaintained dead code with custom patches
- Only a small feature subset is used: circles, linked lines, hover repulse, click push, dark/light color switching
- `@tsparticles/slim` (the smallest tsParticles bundle with linked-lines) is ~40 KB gzipped — roughly 3x larger than what we have now
- A custom implementation targeting exactly these features should be ~200-300 lines of TypeScript and < 3 KB gzipped
- Gives full control over the API, performance tuning, and dark mode integration

**Scope:** New `src/lib/Particles.svelte` component backed by a `<canvas>` element. Remove `particles.js` dependency, remove `src/particle.config.json`.

**Prerequisite:** Visual regression testing (D3) must be in place first so we can validate the particle effect looks equivalent in both light and dark mode before/after.

### D2: Build tooling — Dedicated `tools/` directory with TypeScript ✅

**Decision:** Move all build/content-processing scripts into a dedicated `tools/` directory, rewritten in TypeScript with shared modules.

**Rationale:**
- Current 4 scripts (3 CJS + 1 Bash) duplicate ~60% of their logic
- CJS files can't share code with the ESM project
- No type safety — errors only surface at runtime
- Bash image script requires external tools (ImageMagick, cwebp)

**Architecture:** See [Build Tooling Architecture](#build-tooling-architecture) for the full design.

### D3: Visual regression testing before visual changes ✅

**Decision:** Set up a Playwright-based visual regression testing suite *before* making any visual changes (particles, images, dark mode, etc.).

**Rationale:**
- The particles replacement (D1) changes a visual element that spans every page in both light and dark mode
- Image optimization, `<picture>` elements, and responsive images all change how pages render
- Need a reliable way to capture before/after screenshots and detect regressions
- Screenshots can be reviewed by an LLM to validate that changes are intentional

**Scope:** See [Visual Regression Testing](#visual-regression-testing) for the full design.

### D4: Sitemap generation ✅

**Decision:** Generate a `sitemap.xml` for crawlers (web archive, search engines, etc.).

**Requirements:**
- Include all public pages (home, experience, education, skills, tools, cats, blog listing, individual articles)
- Include non-active/experimental pages (e.g., canvas test) so they're discoverable
- Exclude downloadable files (PDFs, fonts) from the sitemap
- The sitemap should double as a page registry for the Playwright e2e test matrix — tests can read the sitemap to discover which pages to screenshot, eliminating the need to maintain a separate list

**Implementation:** Add a `generate-sitemap.ts` command to the `tools/` pipeline. Output to `static/sitemap.xml`. Reference it in `robots.txt`.

### D5: Svelte 5 runes for state management ✅

**Decision:** Migrate `src/lib/state.js` from Svelte 4 `writable()` stores to Svelte 5 runes (`$state`, `$derived`).

**Rationale:** The particles component (D1) will be rewritten from scratch, making this a natural time to modernize state. The rest of the codebase already uses `$props()` and `$effect()`, so stores are the last Svelte 4 holdover.

### D6: Tailwind CSS — Stay on v3 ✅

**Decision:** Skip Tailwind v4 migration for now. Stay on v3.

**Rationale:** LLM tooling has known issues with Tailwind v4 class generation. Revisit when v4 support matures.

### D7: Image formats — WebP + AVIF ✅

**Decision:** Generate both WebP and AVIF variants in the image pipeline using `sharp`.

### D8: Cat/avatar images — include in pipeline ✅

**Decision:** Route cat photos and avatar through the `getImage()` pipeline to serve optimized variants. Currently 10.4 MB of uncompressed images.

### D9: Skill logos — build pipeline download tool ✅

**Decision:** Add a `tools/commands/fetch-external-assets.ts` command that downloads external image URLs (from `skillData.js` etc.), saves them locally to `static/assets/logos/`, and updates the data file to reference the local path. Fetched assets then flow through the normal image compression pipeline.

**Usage:** `npx tsx tools/build.ts fetch-assets` — a one-off/periodic command, not part of every build.

### D10: Font — Convert to WOFF2, keep self-hosted ✅

**Decision:** Convert `BrunoAce-Regular.ttf` (55 KB) to WOFF2 (~30 KB) and continue self-hosting. Remove the TTF file after conversion.

### D11: PDFs — Keep in repo ✅

**Decision:** Keep thesis PDFs in the repo and Docker image. They're intentional downloads and the simplicity is worth the 5.4 MB.

---

## Resolved Questions

All open questions have been answered. Kept here for reference.

| # | Question | Decision | Reference |
|---|----------|----------|-----------|
| Q1 | Tailwind v3 → v4? | **Skip for now** — stay on v3 | D6 |
| Q2 | Svelte 5 runes? | **Yes** — migrate alongside particles rewrite | D5 |
| Q3 | Self-host skill logos? | **Yes** — build tool to download + localize | D9 |
| Q4 | Image formats? | **WebP + AVIF** | D7 |
| Q5 | Cat/avatar in pipeline? | **Yes** — serve optimized variants | D8 |
| Q6 | Font handling? | **Convert to WOFF2, keep self-hosted** | D10 |
| Q7 | PDFs? | **Keep in repo** | D11 |


---

## Executive Summary

The meerman.xyz codebase is a SvelteKit 2 static site with a blog system, portfolio sections, and a particle background effect. It's well-structured overall, but has accumulated technical debt in its build pipeline, image handling, and dependency management. All open questions have been resolved into 11 confirmed decisions (D1–D11). Key work:

- **D1: Custom particle renderer** — replace the unmaintained particles.js fork with a ~250-line Canvas-based TypeScript implementation (~2-3 KB gzipped vs ~15 KB current)
- **D2: Unified build tooling** — consolidate 4 build scripts (3 CJS + 1 Bash) into a TypeScript `tools/` directory with shared modules, replacing ImageMagick/cwebp with `sharp`
- **D3: Visual regression testing** — Playwright screenshot suite (32 screenshots per run) with a local web viewer for before/after comparison, gating all visual changes
- **D4: Sitemap** — auto-generated sitemap that doubles as the e2e test page registry
- **D5: Svelte 5 runes** — migrate state management from `writable()` stores to modern runes
- **D7+D8: Image pipeline** — WebP + AVIF generation for all images including cats/avatar (saving ~10 MB per visit)
- **D9: Skill logos** — build tool to download and localize external CDN images

---

## Architecture Overview

```
content/blog/       → Markdown/HTML articles (source of truth)
    ↓ [generateBlogIndex.cjs]    → static/feed.json, feed.xml, src/lib/data/articleData.js
    ↓ [convertMarkdown.cjs]      → static/articles/*.html
static/assets/      → Source images
    ↓ [generate-optimized-images.sh] → static/g/assets/ (resized + WebP)
src/                → SvelteKit application
    ↓ [vite build]               → build/ (static output)
build/              → Docker image → nginx
```

### Tech Stack
- **Framework:** SvelteKit 2 + Svelte 5 (adapter-static)
- **Styling:** Tailwind CSS 3 + PostCSS + autoprefixer
- **Build:** Vite 7
- **Server:** nginx (Docker container)
- **CI/CD:** GitHub Actions → Docker Hub → SSH deploy

---

## Visual Regression Testing

### Why This Comes First

Before touching particles, images, dark mode, or any visual component, we need a safety net. A Playwright-based screenshot suite lets us:

1. **Capture baseline screenshots** of every page in both light and dark mode
2. **Run after changes** to generate comparison reports
3. **Feed before/after pairs to an LLM** for semantic validation ("does this still look right?")

### Proposed Setup

```
e2e/
  playwright.config.ts       ← Playwright configuration
  visual-regression.spec.ts  ← Main test file
  screenshots/
    baseline/                ← Committed reference screenshots
    current/                 ← Generated during test runs (gitignored)
    diffs/                   ← Visual diff images (gitignored)
  report/
    report.json              ← Structured comparison data for LLM review
```

### Test Matrix

Every page × 2 color modes × 2 viewports:

| Page | Light | Dark | Mobile (390px) | Desktop (1280px) |
|------|-------|------|----------------|-------------------|
| `/` (home) | ✓ | ✓ | ✓ | ✓ |
| `/experience` | ✓ | ✓ | ✓ | ✓ |
| `/education` | ✓ | ✓ | ✓ | ✓ |
| `/skills` | ✓ | ✓ | ✓ | ✓ |
| `/tools` | ✓ | ✓ | ✓ | ✓ |
| `/cats` | ✓ | ✓ | ✓ | ✓ |
| `/blog` | ✓ | ✓ | ✓ | ✓ |
| `/blog/dr-001` (sample article) | ✓ | ✓ | ✓ | ✓ |

**= 32 screenshots per run** (8 pages × 2 modes × 2 viewports)

### Key Design Decisions

**Particles handling:** Disable particles during page screenshot capture (set `particlesEnabled` to `false` via JS injection). This keeps screenshots deterministic since particle positions are random each frame.

A **separate particles smoke test** validates the particle system independently:
- Confirm the `<canvas>` element is present and has non-zero dimensions
- Confirm particles are rendering (canvas pixel data is not blank)
- Confirm `pointer-events: none` is set (particles don't block content interaction)
- Confirm content behind particles is still clickable (click a nav link through the particle layer)
- Run in both light and dark mode to verify color switching

**Screenshot timing:** Wait for:
- Network idle (images loaded)
- Font rendering complete
- CSS transitions settled (use `animation: none !important` override)

**Threshold:** Use Playwright's built-in `toHaveScreenshot()` with a pixel diff threshold (~0.5%) to absorb minor antialiasing differences.

### Workflow

```
1. npm run test:visual:baseline    → Capture baseline screenshots (committed)
2. [make visual changes]
3. npm run test:visual             → Capture current screenshots, generate diffs
4. npm run test:visual:report      → Generate JSON report of changes
5. [LLM reviews report + diff images to validate]
```

### Report & Review

The report generator produces two outputs:

**1. JSON report** (`e2e/report/report.json`) — structured data for LLM review and the web viewer:

```json
{
  "timestamp": "2026-02-28T12:00:00Z",
  "summary": { "total": 32, "changed": 3, "unchanged": 29, "new": 0 },
  "changes": [
    {
      "page": "/",
      "mode": "dark",
      "viewport": "desktop",
      "baseline": "screenshots/baseline/home-dark-desktop.png",
      "current": "screenshots/current/home-dark-desktop.png",
      "diff": "screenshots/diffs/home-dark-desktop-diff.png",
      "pixelDiffPercent": 2.3,
      "status": "changed"
    }
  ]
}
```

**2. Local web viewer** (`tools/report-viewer/`) — a minimal static HTML page that loads the JSON report and displays:
- Side-by-side baseline vs current screenshots
- Diff overlay with a slider
- Filter by status (changed / unchanged / new)
- Summary stats

This lives in the `tools/` directory as part of the build tooling. Opened via `npm run test:visual:report` which generates the JSON and launches the viewer in a browser.

The LLM can be prompted with the JSON: *"Review these visual changes. For each changed screenshot, describe what differs and whether the change looks intentional given that we replaced the particle background renderer."*

### npm Scripts

```json
{
  "test:visual:baseline": "playwright test --update-snapshots",
  "test:visual": "playwright test",
  "test:visual:report": "npx tsx tools/commands/visual-report.ts"
}
```

### Dependencies

```
devDependencies:
  @playwright/test
```

---

## Build Pipeline Analysis

### Current State

The build pipeline spans **4 separate files in 2 languages**:

| File | Language | Lines | Purpose |
|------|----------|-------|---------|
| `generateBlogIndex.cjs` | JS (CJS) | 144 | Blog index + RSS feed generation |
| `convertMarkdown.cjs` | JS (CJS) | 275 | Markdown/HTML → static HTML |
| `scripts/validateBlogContent.cjs` | JS (CJS) | 87 | Content validation |
| `scripts/generate-optimized-images.sh` | Bash | 58 | Image optimization |

**Total: ~564 lines across 4 files.**

### Problems

#### 1. Massive code duplication between files

`generateBlogIndex.cjs` and `validateBlogContent.cjs` duplicate:
- Article directory listing (`listArticleDirs`)
- Frontmatter field validation (same `REQUIRED_FIELDS` list)
- Date validation
- Tag normalization/validation
- Duplicate ID/slug checking

`generateBlogIndex.cjs` and `convertMarkdown.cjs` both:
- Implement `listArticleDirs()` separately
- Read the same markdown files independently
- Parse frontmatter independently

#### 2. CJS in an ESM project

All build scripts use `require()` (CommonJS) while the project is `"type": "module"`. This forces the `.cjs` extension and prevents sharing code with the ESM source files.

#### 3. No TypeScript

Build scripts are plain JavaScript with no type checking. Errors in frontmatter parsing, path manipulation, or config handling only surface at runtime.

#### 4. Sequential processing, synchronous I/O

`convertMarkdown.cjs` processes articles one-at-a-time in a `for` loop using `fs.readFileSync`/`fs.writeFileSync`. With 8+ articles (some with heavy Tailwind processing), this is unnecessarily slow.

#### 5. Fragile HTML parsing via regex

```js
const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
```

Regex-based HTML parsing breaks on edge cases (nested tags, attributes containing `>`, etc.).

#### 6. `vm` sandbox for Tailwind config parsing

```js
const sandbox = { tailwind: {}, window: {} };
vm.createContext(sandbox);
vm.runInContext(scriptBody, sandbox, { timeout: 1000 });
```

Executing arbitrary script content in a VM sandbox to extract Tailwind config is fragile and a potential security concern.

#### 7. No incremental builds

Every run reprocesses all articles and all images from scratch. The `articleData.js` has a content-hash check to avoid unnecessary rewrites, but everything else regenerates unconditionally.

#### 8. `generate-optimized-images.sh` has hard-coded values

```bash
SIZES=(400 306)
```

Sizes are hard-coded. The script deletes and regenerates the entire output directory (`rm -rf "$TARGET_DIR"`) on every run.

### Recommended: Unified TypeScript Build Pipeline

Rewrite all 4 files as a single TypeScript-based build tool:

```
scripts/
  build.ts              ← Single entry point
  lib/
    articles.ts         ← Article discovery, parsing, validation
    markdown.ts         ← Markdown → HTML conversion
    html-processor.ts   ← HTML article processing (Tailwind, etc.)
    images.ts           ← Image optimization (using sharp instead of ImageMagick)
    feeds.ts            ← RSS/JSON feed generation
    types.ts            ← Shared types (Article, FrontMatter, etc.)
```

**Benefits:**
- Type safety across the entire pipeline
- Shared article discovery and validation logic (eliminate duplication)
- Use `sharp` instead of ImageMagick/cwebp (no external tool dependencies)
- Parallel processing with `Promise.all()`
- Incremental builds via content hashing
- Use a proper HTML parser (`cheerio`) instead of regex
- Single `npm run build:content` command

---

## Build Tooling Architecture

### Design Goals

1. **Single language** — TypeScript, runnable via `tsx` (no compile step needed)
2. **Shared core** — article discovery, frontmatter parsing, validation written once
3. **Zero system dependencies** — `sharp` replaces ImageMagick/cwebp, `cheerio` replaces regex HTML parsing
4. **Composable commands** — each task can run independently or as part of a full pipeline
5. **Incremental** — skip work when source files haven't changed

### Directory Structure

```
tools/
  tsconfig.json              ← TypeScript config for the tools directory
  build.ts                   ← Orchestrator: runs all steps or selected ones
  commands/
    validate.ts              ← Blog content validation (replaces validateBlogContent.cjs)
    generate-index.ts        ← Article index + RSS feeds (replaces generateBlogIndex.cjs)
    convert-articles.ts      ← Markdown/HTML → static HTML (replaces convertMarkdown.cjs)
    optimize-images.ts       ← Image optimization (replaces generate-optimized-images.sh)
    generate-sitemap.ts      ← Sitemap generation (D4, new)
    fetch-external-assets.ts ← Download external images to local assets (D9, new)
    visual-report.ts         ← Generate visual regression report + launch viewer (D3)
  lib/
    articles.ts              ← Article discovery + frontmatter parsing (shared)
    types.ts                 ← FrontMatter, Article, ImageVariant types
    config.ts                ← Paths, sizes, formats — single source of truth
    markdown.ts              ← Marked setup + footnotes
    html-processor.ts        ← HTML article processing (Tailwind extraction, asset normalization)
    images.ts                ← sharp-based image processing (resize, WebP, AVIF)
    feeds.ts                 ← RSS/JSON feed generation
    cache.ts                 ← Content hashing for incremental builds
  report-viewer/
    index.html               ← Local web viewer for visual regression reports
    viewer.js                ← Loads report.json, renders side-by-side comparisons
```

### How It Maps to Current Code

| Current File | Becomes | Shared From |
|-------------|---------|-------------|
| `generateBlogIndex.cjs` | `commands/generate-index.ts` | `lib/articles.ts`, `lib/feeds.ts` |
| `convertMarkdown.cjs` | `commands/convert-articles.ts` | `lib/articles.ts`, `lib/markdown.ts`, `lib/html-processor.ts` |
| `scripts/validateBlogContent.cjs` | `commands/validate.ts` | `lib/articles.ts` |
| `scripts/generate-optimized-images.sh` | `commands/optimize-images.ts` | `lib/images.ts` |
| *(new)* | `commands/generate-sitemap.ts` | `lib/config.ts` (site URL, page list) |
| *(new)* | `commands/fetch-external-assets.ts` | `lib/images.ts`, `lib/config.ts` |
| *(new)* | `commands/visual-report.ts` | Standalone (reads Playwright output) |

### Shared Module: `lib/articles.ts`

This is the key module that eliminates duplication. It owns:

```typescript
interface FrontMatter {
  title: string;
  summary: string;
  date: string;
  author: string;
  ID: string | number;
  tags: string[];
  slug: string;
  sourceType: 'md' | 'html';
  // optional fields
  enableCustomJs?: boolean;
  enableCustomCss?: boolean;
  respectsDarkMode?: boolean;
}

interface Article {
  slug: string;
  dir: string;           // absolute path to content/blog/{slug}/
  mdPath: string;        // path to index.md
  htmlPath?: string;     // path to index.html (if exists)
  assetsPath?: string;   // path to assets/ (if exists)
  frontmatter: FrontMatter;
}

// Used by ALL commands
function discoverArticles(contentDir: string): Article[]
function validateArticle(article: Article): ValidationError[]
function validateUniqueness(articles: Article[]): ValidationError[]
```

### Shared Config: `lib/config.ts`

Single source of truth for paths and settings:

```typescript
export const config = {
  contentDir: 'content/blog',
  outputDir: 'static/articles',
  assetsOutputDir: 'static/assets/articles',
  imageSourceDir: 'static/assets',
  imageOutputDir: 'static/g/assets',
  dataOutputDir: 'src/lib/data',
  feedOutputDir: 'static',

  imageSizes: [400, 306],
  imageFormats: ['original', 'webp', 'avif'] as const,
  webpQuality: 82,
  avifQuality: 60,

  siteUrl: 'https://meerman.xyz',
  siteName: 'Meerman',
  siteAuthor: 'Dries Meerman',
};
```

### Orchestrator: `build.ts`

```typescript
// Usage:
//   npx tsx tools/build.ts              ← run all steps
//   npx tsx tools/build.ts validate     ← run only validation
//   npx tsx tools/build.ts articles     ← generate-index + convert-articles
//   npx tsx tools/build.ts images       ← optimize images only

import { validate } from './commands/validate';
import { generateIndex } from './commands/generate-index';
import { convertArticles } from './commands/convert-articles';
import { optimizeImages } from './commands/optimize-images';

const command = process.argv[2] ?? 'all';

const steps: Record<string, () => Promise<void>> = {
  validate,
  index: generateIndex,
  articles: convertArticles,
  images: optimizeImages,
  all: async () => {
    await validate();
    await Promise.all([
      generateIndex(),
      convertArticles(),
    ]);
    // images can run in parallel with articles since they're independent
  },
};
```

### npm Script Changes

```json
{
  "predev": "npx tsx tools/build.ts articles",
  "prebuild": "npx tsx tools/build.ts all",
  "build:validate": "npx tsx tools/build.ts validate",
  "build:index": "npx tsx tools/build.ts index",
  "build:articles": "npx tsx tools/build.ts articles",
  "build:images": "npx tsx tools/build.ts images",
  "build:sitemap": "npx tsx tools/build.ts sitemap",
  "fetch-assets": "npx tsx tools/commands/fetch-external-assets.ts"
}
```

### Incremental Builds: `lib/cache.ts`

```typescript
// Stores content hashes in a .cache/build-hashes.json file
// Each command checks: has the source changed since last run?
// If not, skip. If yes, process and update the hash.

interface CacheEntry {
  sourceHash: string;   // SHA-256 of source file(s)
  outputPaths: string[]; // what was generated
  timestamp: number;
}
```

### Migration Plan

The rewrite can be done incrementally — old and new can coexist:

1. **Phase 1:** Create `tools/` directory, `lib/articles.ts`, `lib/types.ts`, `lib/config.ts`
2. **Phase 2:** Port `validateBlogContent.cjs` → `commands/validate.ts` (simplest, good test of shared lib)
3. **Phase 3:** Port `generateBlogIndex.cjs` → `commands/generate-index.ts`
4. **Phase 4:** Port `convertMarkdown.cjs` → `commands/convert-articles.ts` (largest, most complex)
5. **Phase 5:** Port `generate-optimized-images.sh` → `commands/optimize-images.ts` (introduces `sharp`, adds AVIF)
6. **Phase 6:** Add `commands/generate-sitemap.ts` (D4)
7. **Phase 7:** Add `commands/fetch-external-assets.ts` (D9)
8. **Phase 8:** Add `build.ts` orchestrator, update npm scripts, delete old files
9. **Phase 9:** Update CI pipeline (remove imagemagick/webp install), update README

Each phase is independently deployable — the old scripts can stay until their replacement is verified.

### New Dependencies

```
devDependencies:
  tsx          ← Run TypeScript directly without a compile step
  sharp        ← Image processing (replaces ImageMagick + cwebp)
  cheerio      ← HTML parsing (replaces regex)
```

`gray-matter`, `marked`, `marked-footnote`, `rss`, `postcss`, and `tailwindcss` are already in the project.

---

## Image Pipeline Analysis

### Current State

| Metric | Value |
|--------|-------|
| Source images (`static/assets/`) | ~25 MB |
| Cat photos (unoptimized) | 7.1 MB (2 files: 3.4 MB + 3.8 MB) |
| Avatar (unoptimized) | 3.2 MB |
| Blog article images | 8.9 MB |
| Generated sizes | 400px, 306px |
| Generated formats | Original + WebP |
| AVIF support | None |

### Problems

#### 1. Enormous unoptimized cat/avatar images served directly

The cats page loads `Fenry.jpeg` (3.4 MB) and `Gina.jpeg` (3.8 MB) directly from `/assets/cats/`. These images are **never run through the optimization pipeline** because the cats page doesn't use the `getImage()` service. Same for the avatar (3.2 MB).

**Impact:** A user visiting `/cats` downloads ~7.2 MB of images. The avatar on the home page is 3.2 MB.

#### 2. No responsive images (`<picture>`, `srcset`)

Images are served at a single size regardless of screen width. A mobile user downloading 400px-width images at 2x density gets the same file as a desktop user.

#### 3. Missing `loading="lazy"` on several pages

Only `StyledTimeLine.svelte` uses `loading="lazy"`. Missing from:
- `cats/+page.svelte` (3.4 MB + 3.8 MB images!)
- `home/Person.svelte` (3.2 MB avatar)
- `TradingCard.svelte` (skill card images)

#### 4. No AVIF generation

WebP is good, but AVIF offers 20-50% better compression. Modern browsers (95%+ support) handle it well.

#### 5. External tool dependencies

Requires ImageMagick and `cwebp` to be installed. This complicates CI (needs `apt-get install`) and developer onboarding. Once replaced with `sharp`, update the CI pipeline to remove `apt-get install imagemagick webp` and update the README with the simplified local dev setup for macOS.

#### 6. Font file in assets

`BrunoAce-Regular.ttf` (55 KB) is stored in `static/assets/` and loaded via `@font-face` in `SkillCard.svelte`. **Decision (D10):** Convert to WOFF2 (~30 KB) and keep self-hosted. Delete the TTF after conversion.

### Recommended Improvements

1. **Replace ImageMagick/cwebp with `sharp`** — Node.js native, no system dependencies, faster
2. **Add AVIF generation** — `sharp` supports AVIF natively
3. **Process ALL images** — include cats, avatar, and article images in the pipeline
4. **Add `<picture>` elements** with WebP/AVIF sources and fallbacks
5. **Add `loading="lazy"`** to all below-the-fold images
6. **Add `srcset`** for 1x/2x density and responsive widths
7. **Incremental processing** — skip images whose source hasn't changed
8. **Convert font to WOFF2** — smaller file, keep self-hosted (D10)

---

## Particles.js Replacement

> **Decision: Custom Canvas renderer (Option C)** — see [Decisions](#decisions)

### Current Implementation

- **Library:** Custom fork at `github:DriesMeerman/particles.js`
- **Bundle size:** ~49 KB (unminified ESM), ~12-15 KB gzipped
- **Custom modifications:** `setParticleColor(hex)` and `modifyParticles(modifier)` functions
- **Features used:** Circles, linked lines, hover repulse, click push, color changes

### Why Not tsParticles

| Package | Minified | Gzipped | Features |
|---------|----------|---------|----------|
| Current `particles.js` fork | ~49 KB (unminified) | ~15 KB (est.) | Circle + links + basic interactions |
| `@tsparticles/basic` | 87 KB | **24 KB** | Circle + basic updaters (no links!) |
| `@tsparticles/slim` | 142 KB | **40 KB** | Basic + links + all interactions |
| **Custom Canvas renderer** | ~5-8 KB (unminified) | **~2-3 KB** | Exactly what we need |

`@tsparticles/slim` is the smallest bundle that includes linked-lines — and it's ~40 KB gzipped, roughly 3x the current fork. Going from a 49 KB unmaintained fork to a 142 KB maintained library would be a lateral move at best.

### Custom Renderer Specification

The replacement must reproduce these behaviors from the current `particle.config.json`:

| Feature | Current Config | Implementation |
|---------|---------------|----------------|
| Particle count | 60, density-based | Scale count by canvas area |
| Shape | Circle, radius 1-5px (random) | `arc()` on canvas |
| Color | `#000` (light) / `#01b3b5` (dark) | Reactive to dark mode |
| Opacity | 0.5 | Global alpha |
| Linked lines | Distance 300px, opacity 0.4, width 2 | Draw lines between nearby particles |
| Movement | Speed 6, direction none, out_mode "out" | Wrap or exit at edges |
| Hover interaction | Repulse, distance 120px, duration 0.4s | Push particles away from cursor |
| Click interaction | Push 4 new particles | Add particles at click position |
| Retina | Enabled | Use `devicePixelRatio` |
| Canvas | Full-screen, fixed, z-index 0, pointer-events none | `<canvas>` element |

### Architecture

```
src/lib/
  Particles.svelte           ← Svelte component (canvas element + lifecycle)
  particles/
    engine.ts                ← Core simulation: Particle class, update loop, spatial queries
    renderer.ts              ← Canvas 2D drawing: particles, lines
    interactions.ts          ← Mouse tracking, repulse force, click-to-push
    types.ts                 ← ParticleConfig, Particle, Vec2
```

The component will:
- Use `requestAnimationFrame` for the render loop
- Use `$effect()` to react to dark mode changes (Svelte 5 runes)
- Accept config as props with sensible defaults matching current behavior
- Clean up properly on unmount (cancel animation frame, remove listeners)
- Handle canvas resize via `ResizeObserver`

### Files to Remove After Migration

- `src/particle.config.json`
- `particles.js` dependency from `package.json`
- The `node_modules/particles.js/` fork

---

## Dead Code & Unused Files

### Confirmed Dead/Stale

| File | Issue | Action |
|------|-------|--------|
| `static/articles/cr-008.html` | Generated HTML with no matching `content/blog/cr-008/` directory. Content appears to be a "Codex reflection" draft. Not in `articleData.js`. | **Delete** |
| `static/articles/cr-009.html` | Same — identical content to cr-008. No source directory. | **Delete** |
| `static/articles/dr-008-research.html` | No matching content directory `dr-008-research/`. Appears to be a research draft. | **Delete** |
| `src/lib/index.js` | Contains only a comment: `// place files you want to import through the $lib alias in this folder.` Does nothing. | **Delete** |

### Code That Could Be Simplified

| File | Issue | Action |
|------|-------|--------|
| `src/lib/model/Skill.js` | `Skill` class with a `getHash()` method. `getHash()` is **never called** anywhere in the codebase. The entire class is just a wrapper around plain objects — `Skill.fromJSON()` just copies properties. | Replace with plain objects; remove `getHash()` |
| `generateBlogIndex.cjs` ↔ `validateBlogContent.cjs` | ~60% code overlap (validation logic, dir listing, frontmatter parsing) | Merge into shared module |

### Unused Config Properties

`particle.config.json` will be deleted entirely as part of D1 (custom particle renderer). For reference, it contains unused config that was never cleaned up from the particles.js defaults: `shape.image` (references non-existent `img/github.svg`), `shape.polygon`, `interactivity.modes.grab/bubble/remove`.

### Non-Image Files in Assets

| File | Size | Action |
|------|------|--------|
| `static/assets/BrunoAce-Regular.ttf` | 55 KB | **Convert to WOFF2** (~30 KB), delete TTF (D10) |
| `static/assets/Third_party_tool_integration_in_a_service_based_cloud_ecosystem.pdf` | 4.2 MB | Keep in repo (D11) |
| `static/assets/Thesis_Risk_assessment_in_agile_software_development.pdf` | 1.2 MB | Keep in repo (D11) |

---

## Code Quality & Modernization

### 1. Svelte 5 Migration Completeness

The project uses Svelte 5 but still uses Svelte 4 patterns:
- `src/lib/state.js` uses `writable()` stores from `svelte/store` instead of Svelte 5 runes (`$state`, `$derived`)
- `Particles.svelte` uses `darkMode.subscribe()` (store pattern) instead of `$derived` or reactive `$effect`
- Layout and other components mix `$props()` (Svelte 5) with store subscriptions (Svelte 4)

**Decision:** Migrate to Svelte 5 runes — confirmed as D5. Pairs naturally with the particles rewrite (D1).

### 2. Tailwind CSS v3 → v4

The project uses Tailwind v3 with a separate `postcss.config.cjs` and `tailwind.config.js`. Tailwind v4 (released 2025) eliminates the need for PostCSS config and uses CSS-native configuration.

**Decision:** Skip for now (D6). LLM tooling has issues with v4 class generation. Revisit later.

### 3. `articleData.js` Generation Pattern

```js
const articlesString = `[...]`;
export const articles = JSON.parse(articlesString);
```

This generates a JS file that contains a JSON string, which is then parsed at runtime. This is an unusual pattern — it would be cleaner to:
- Generate a `.json` file and import it, or
- Generate a proper ES module with the data directly exported

### 4. Image Service Returns Only Strings

```js
export function getImage(name, ext, size) {
    return `/g/assets/${name}-${imageSize}.${extension}`;
}
```

This only returns a URL string. It doesn't provide `srcset`, WebP/AVIF alternatives, or width/height metadata. A richer image service could return structured data for `<picture>` elements.

### 5. Skills Data Loads External Images

`skillData.js` references ~25 external URLs for skill logos (wikimedia, flaticon, cdn-icons-png, etc.). If any of these URLs go down, skill images break. Consider:
- Downloading and self-hosting critical logos
- Adding fallback images
- At minimum, using `loading="lazy"` and `alt` text

### 6. `package-lock.json` Is Deleted in CI

```yaml
- name: Npm install
  run: rm package-lock.json && npm install
```

This is a code smell. The lockfile should be committed and used via `npm ci` for reproducible builds. Deleting it means every CI run can get different dependency versions.

---

## CI/CD Pipeline

### Current Issues & Decisions

1. **No caching** — `npm install` runs from scratch every build. **Intentional** — development is on macOS, CI runs on Linux, so node_modules aren't transferable. Keep as-is.

2. **Lockfile deletion** — `rm package-lock.json && npm install` means no reproducible builds. **Fix:** Keep the current `rm && install` pattern (needed for cross-platform), but **save the generated `package-lock.json` as a build artifact** on main branch builds. This provides an audit trail of what was actually installed.

3. **Outdated actions** — Uses `actions/checkout@v3`. **Fix:** Update to `actions/checkout@v4`.

4. **Debug steps in production** — `debug pre downloadartifact` and `Debug downloadartifact` steps are still present. **Fix:** Remove them.

5. **SSH deployment with password** — Consider SSH key auth. Low priority, works for now.

6. **No health check after deploy** — No verification the new container is serving. **Fix:** Add a post-deploy `curl -f https://meerman.xyz/` step.

7. **Docker hardcoded username** — `docker pull chrozera/meerman.xyz:latest` has the username inline. **Acceptable** — it's a public image.

### New: Tagged Version Releases

**Decision:** Create a separate GitHub Actions workflow that triggers on version tags (e.g., `v3.2.0`). It should:
- Build the site
- Push a Docker image tagged with the version number (e.g., `chrozera/meerman.xyz:3.2.0`)
- Also push as `latest`

This gives rollback capability via tagged Docker images.

### Recommended Improvements

1. Save generated `package-lock.json` as build artifact on main
2. Update to `actions/checkout@v4`
3. Remove debug steps
4. Add post-deploy health check
5. Add tagged-release workflow for versioned Docker images

---

## Performance

### Bundle Size

The site is a static SvelteKit app — bundle sizes are generally good. The main concern is:
- particles.js at ~49 KB (dynamic import, not blocking)
- External skill logos (25+ network requests to various CDNs)

### Largest Downloads per Page

| Page | Largest Assets | Total |
|------|---------------|-------|
| `/cats` | Fenry.jpeg (3.4 MB) + Gina.jpeg (3.8 MB) | **~7.2 MB** |
| `/` (home) | avatar.jpg (3.2 MB) | **~3.2 MB** |
| `/blog/dr-008` | dr-008.html (120 KB) + article assets | ~500 KB |
| `/skills` | BrunoAce.ttf (55 KB) + 25 external logo fetches | Variable |

### Quick Performance Wins

1. **Optimize cat images** — serve WebP at max 800px width: ~200 KB total instead of 7.2 MB
2. **Optimize avatar** — serve WebP at 400px: ~30 KB instead of 3.2 MB
3. **Add `loading="lazy"`** to cat and skill images
4. **Self-host critical skill logos** — reduce DNS lookups and external dependencies

---

## Prioritized Action Items

Reordered to respect decision dependencies. Visual regression testing (D3) gates visual changes; build tooling (D2) is a parallel workstream. All questions resolved — no blockers.

### Phase 0: Quick Wins (no visual changes)

| # | Action | Decision | Effort |
|---|--------|----------|--------|
| 1 | **Delete stale files** (`cr-008.html`, `cr-009.html`, `dr-008-research.html`, `src/lib/index.js`) | — | 5 min |
| 2 | **Save generated `package-lock.json` as CI artifact** on main builds | — | 10 min |
| 3 | **Update `actions/checkout` to v4**, remove debug steps | — | 10 min |
| 4 | **Simplify Skill model** — remove unused `getHash()`, consider plain objects | — | 30 min |
| 5 | **Switch BrunoAce font to Google Fonts CDN**, remove TTF | D10 | 15 min |
| 6 | **Clean `particle.config.json`** — remove unused shape/mode configs | — | 5 min |

### Phase 1: Visual Regression Testing (D3)

| # | Action | Effort |
|---|--------|--------|
| 7 | **Set up Playwright** — install, configure, write screenshot spec for all pages × light/dark × mobile/desktop | 1-2 hrs |
| 8 | **Particles smoke test** — canvas present, rendering, pointer-events none, content clickable, color switch | 30 min |
| 9 | **Build report viewer** — JSON report + local web viewer in `tools/report-viewer/` with side-by-side comparison | 1-2 hrs |
| 10 | **Capture baseline screenshots** (32 screenshots committed as reference) | 15 min |

### Phase 2: Particles Replacement (D1 + D5) — requires Phase 1

| # | Action | Effort |
|---|--------|--------|
| 11 | **Migrate state to Svelte 5 runes** — `writable()` → `$state`/`$derived` in `state.js` | 1 hr |
| 12 | **Write custom Canvas particle engine** (`engine.ts`, `renderer.ts`, `interactions.ts`, `types.ts`) | 2-3 hrs |
| 13 | **Replace `Particles.svelte`** — integrate custom renderer, wire up dark mode via runes | 1 hr |
| 14 | **Run visual regression + particles smoke test** — validate rendering matches | 30 min |
| 15 | **Remove `particles.js` fork** — delete dependency, `particle.config.json` | 10 min |

### Phase 3: Build Tooling (D2 + D4) — independent of Phase 2

| # | Action | Effort |
|---|--------|--------|
| 16 | **Scaffold `tools/` directory** — tsconfig, `lib/types.ts`, `lib/config.ts`, `lib/articles.ts` | 1 hr |
| 17 | **Port validation** → `commands/validate.ts` | 1 hr |
| 18 | **Port blog index generation** → `commands/generate-index.ts` | 1-2 hrs |
| 19 | **Port markdown conversion** → `commands/convert-articles.ts` (use `cheerio` for HTML parsing) | 2-3 hrs |
| 20 | **Port image optimization** → `commands/optimize-images.ts` (introduces `sharp`, WebP + AVIF) | 1-2 hrs |
| 21 | **Add sitemap generation** → `commands/generate-sitemap.ts` | 1 hr |
| 22 | **Add external asset fetcher** → `commands/fetch-external-assets.ts` (D9) | 1-2 hrs |
| 23 | **Add orchestrator** (`build.ts`), update npm scripts, delete old CJS files + bash script | 1 hr |
| 24 | **Update CI pipeline** — remove `apt-get install imagemagick webp`, update README for macOS dev | 30 min |

### Phase 4: Image & Performance (D7 + D8) — requires Phase 1 + Phase 3

| # | Action | Effort |
|---|--------|--------|
| 25 | **Route cat + avatar images through pipeline** — serve optimized WebP/AVIF variants | 30 min |
| 26 | **Add `loading="lazy"`** to cat page, Person.svelte, TradingCard.svelte | 10 min |
| 27 | **Add `<picture>` elements** with WebP/AVIF sources and fallbacks | 1-2 hrs |
| 28 | **Run `fetch-external-assets`** to localize skill logos (D9) | 30 min |
| 29 | **Run visual regression** to validate all image/layout changes | 30 min |

### Phase 5: CI/CD Improvements

| # | Action | Effort |
|---|--------|--------|
| 30 | **Add post-deploy health check** (`curl -f https://meerman.xyz/`) | 15 min |
| 31 | **Create tagged-release workflow** — on version tag, build + push versioned Docker image | 1 hr |

### Phase 6: Nice to Have

| # | Action | Effort |
|---|--------|--------|
| 32 | **Add responsive `srcset`** for different screen densities | 2 hrs |
| 33 | **Change `articleData.js` generation** to export data directly instead of JSON.parse trick | 30 min |
| 34 | **Add incremental builds** (content hashing) to tools pipeline | 2-3 hrs |
| 35 | **Enhance image service** — return structured data for `<picture>` elements (srcset, width, height) | 1-2 hrs |

---

## Appendix: Bundle Size Data

### Current particles.js
- Package: `github:DriesMeerman/particles.js` (custom fork)
- Raw ESM: 49,708 bytes (~49 KB)
- Estimated gzipped: ~12-15 KB

### tsParticles alternatives
- `@tsparticles/basic` v3.9.1: 87 KB min / **24 KB gzip** (no linked-lines)
- `@tsparticles/slim` v3.9.1: 142 KB min / **40 KB gzip** (includes linked-lines)
- Custom Canvas renderer: estimated **2-3 KB gzip**

### Image sizes (source, unoptimized)
- `cats/Fenry.jpeg`: 3.4 MB
- `cats/Gina.jpeg`: 3.8 MB
- `avatar.jpg`: 3.2 MB
- `articles/dr-007/ideas-abstract.png`: 2.2 MB
- `articles/dr-005/hero_image.png`: 2.0 MB
- `articles/dr-003/vaporwave_computer.png`: 1.4 MB
