# Blog Article HTML Integration + Style Evolution Plan (`blog-article-integration-plan.md`)

## Summary
This plan adds the `context-based-engineering` article style and content model to `meerman.xyz` while preserving static build compatibility (`adapter-static`), existing CLI workflows, feed/index generation, and page transitions.
Chosen defaults from this planning session:
1. Content model: **Dual-file mode** (`.md` and `.html` as article sources).
2. Customization policy: **Allow full custom CSS/JS per article**.
3. Plan doc location: **`/Users/dries/projects/meerman.xyz/blog-article-integration-plan.md`**.
4. Style direction: keep **multiple options documented** with clear tradeoffs before implementation choice.

## Research: Context-Based-Engineering Source
Reference folder: `/Users/dries/Downloads/context-based-engineering`.

Key findings:
1. Primary artifact is a single handcrafted HTML page: `index.html`, no build step, heavy visual styling, custom fonts, animation-driven storytelling.
2. Supporting content exists in:
`/Users/dries/Downloads/context-based-engineering/research/website-content-final.md`,
`/Users/dries/Downloads/context-based-engineering/writing/writer-output.md`,
`/Users/dries/Downloads/context-based-engineering/writing/editor-output.md`,
and `presentation-context.md`.
3. Design system traits to potentially reuse:
dark editorial theme, strong typography pairing, semantic color tokens, reveal animations, code/terminal motifs, section-based narrative flow.
4. Porting risk:
current article uses inline styles/scripts and external Tailwind CDN/font links; direct embedding inside existing blog route can cause style collisions and global side effects.

## Research: Existing `meerman.xyz` Blog Implementation
Key code paths:
1. Source content: [`content/blog`](/Users/dries/projects/meerman.xyz/content/blog).
2. Markdown-to-HTML conversion and asset copy: [`convertMarkdown.cjs`](/Users/dries/projects/meerman.xyz/convertMarkdown.cjs).
3. Feed/index generation from markdown metadata: [`generateBlogIndex.cjs`](/Users/dries/projects/meerman.xyz/generateBlogIndex.cjs).
4. Article page loader/renderer: [`src/routes/blog/[slug]/+page.js`](/Users/dries/projects/meerman.xyz/src/routes/blog/[slug]/+page.js), [`src/routes/blog/[slug]/+page.svelte`](/Users/dries/projects/meerman.xyz/src/routes/blog/[slug]/+page.svelte).
5. Blog index UI: [`src/routes/blog/+page.svelte`](/Users/dries/projects/meerman.xyz/src/routes/blog/+page.svelte).
6. Build guarantees:
`predev` and `prebuild` run index generation + markdown conversion; static output required for deployment.

Observed constraints:
1. Current pipeline assumes metadata source is `.md` frontmatter only.
2. Article renderer injects trusted HTML via `{@html htmlContent}`.
3. Tailwind typography is available globally but article-level theming is not structured.
4. Existing static artifacts include stale files in `static/articles` not represented in `content/blog`; cleanup policy should be defined.

## Option Set (with Tradeoffs)

### A. Content Ingestion Architecture
1. **Dual-file mode (selected default)**
Allow `.md` and `.html` in `content/blog`.
Upsides: straightforward for raw HTML article import, incremental migration, minimal disruption.
Downsides: parser complexity rises; metadata extraction must support two formats.
Each article gets its own folder that contains md, assets, and optionally HTML;
if there's html the MD should only contain frontmatter and its content should be ignored.


### B. Visual Direction for Blog


3. **Full redesign toward context-based-engineering**
Blog list and article pages pivot to the newer visual language.
But rewriting the HTML so it makes use of tools in the webiste like the pre-exisitng tailwind.
Lets first propose an architecture for that path; lets allow the whole of the blog part to be rewritten visually while keeping the rest intact; I do want to add animations when switching between blog and the rest and back. but the new style is fine; as long as both old and new articles look good in it.

### C. Per-Article Customization Policy

3. **Full custom CSS/JS (selected default)**
Upsides: maximum creative freedom and easy portability from context-based-engineering.
Downsides: style/script leakage risk, performance variability, higher QA burden.

## Selected Implementation Direction (Decision-Complete)
1. Implement **Dual-file mode** with unified metadata model.
2. Support **raw HTML articles with frontmatter-equivalent metadata**.
3. Allow **full per-article CSS/JS**, but isolate execution to avoid breaking global site behavior.
4. Keep existing build scripts and static output behavior fully working.
5. Produce a style-option framework that supports Minimal, Hybrid, and Full redesign tracks before final visual commitment.

## Public API / Interface / Type Changes
None since the changes are in overal site structure; and in the build pipeline there are no changes in url routing etc; only change that we can process both and update total styling in a good architectural way.

## Architecture

### 1) Content and Source Layout

Each article lives in its own directory under `content/blog/`:

`content/blog/<slug>/`
1. `index.md` for frontmatter (required)
2. `index.html` for raw HTML body (optional)
3. `assets/` for article-local media (optional)

Authoring rules:
1. `index.md` is always the metadata source of truth.
2. If `index.html` exists, rendered article body comes from `index.html`; markdown body content is ignored.
3. If `index.html` does not exist, markdown body in `index.md` is rendered as today.
4. Asset URLs are normalized to `/assets/articles/<slug>/...` during build.

### 2) Build Pipeline Architecture

Two build scripts remain the entry points, but are upgraded for folder-based dual-mode articles:
1. `generateBlogIndex.cjs`
2. `convertMarkdown.cjs`

Responsibilities:
1. `generateBlogIndex.cjs`
   1. Discover `content/blog/*/index.md`.
   2. Parse frontmatter and validate required metadata fields.
   3. Infer `sourceType` (`html` if `index.html` exists, else `md`).
   4. Generate `static/feed.json`, `static/feed.xml`, and `src/lib/data/articleData.js`.
2. `convertMarkdown.cjs`
   1. For markdown articles: render markdown body to `static/articles/<slug>.html`.
   2. For html articles: copy/normalize `index.html` to `static/articles/<slug>.html`.
   3. Copy `content/blog/<slug>/assets/*` to `static/assets/articles/<slug>/`.
   4. Optionally clean stale generated files with a safe allowlist strategy.

### 3) Runtime Rendering Architecture (SvelteKit)

Route contract remains unchanged: `/blog/<slug>`.

Flow:
1. `src/routes/blog/[slug]/+page.js`
   1. Load metadata from `/feed.json`.
   2. Resolve article by slug.
   3. Return metadata including `sourceType`.
2. `src/routes/blog/[slug]/+page.svelte`
   1. Fetch `/articles/<slug>.html`.
   2. Render inside the unified blog article shell.
   3. Apply article-level style/script hooks when enabled by metadata.

### 4) Blog Visual Redesign Boundary

Scope decision:
1. Blog section can be fully redesigned.
2. Non-blog pages (`/`, `/skills`, `/experience`, `/education`, `/tools`) remain visually intact.

Design boundaries:
1. Introduce a blog-specific design token layer (typography, spacing, colors, motion) without changing global app base styles.
2. Build a reusable blog layout shell used by both markdown and HTML articles.
3. Keep navigation/menu component behavior consistent across the site.

### 5) Animation and Transition Architecture

Transition goals:
1. Smooth transitions between blog pages and non-blog pages.
2. Preserve readability/performance for long-form content.

Implementation approach:
1. Add route-level transition wrapper for blog entry/exit states.
2. Keep transitions CSS-driven where possible.
3. Respect reduced-motion preferences.
4. Ensure animations do not depend on article-specific scripts.

### 6) Custom CSS/JS Safety Envelope

Because full custom CSS/JS is allowed, isolate blast radius:
1. Require explicit metadata flags to enable article scripts/styles.
2. Prefer scoping conventions (for example a root article container ID/class).
3. Block mutation of global layout containers from article scripts by convention and review gate.
4. Add a strict acceptance checklist for scripted articles: nav works, dark mode works, back navigation works, no console errors.

### 7) Data Contract

Metadata required in `index.md` frontmatter:
1. `title`
2. `summary`
3. `date`
4. `author`
5. `ID`
6. `tags`

Optional:
1. `themeVariant`
2. `enableCustomCss`
3. `enableCustomJs`
4. `heroImage`
5. `respectsDarkMode`

Generated metadata should include:
1. `slug`
2. `sourceType`
3. `url`
4. canonical existing fields already used by blog index and feed generation

## Ordered Implementation Tasks
After a phase if the build succeeds still commit.

### Phase 0: Baseline and Safety Snapshot (before changes)

- [x] Run and log baseline outputs:
  1. `npm run build:index`
  2. `npm run build:markdown`
  3. `npm run build`
- [ ] Capture baseline behavior checks:
  1. Existing markdown article list ordering.
  2. Existing article rendering for at least `dr-001`, `dr-006`, `dr-007`.
  3. RSS and feed generation validity (`feed.json`, `feed.xml` present and parseable).
- [x] Add/confirm a quick validation script (or checklist) that checks:
  1. duplicate IDs,
  2. duplicate slugs,
  3. missing required metadata fields.

### Phase 1: Content Structure Migration

- [x] Introduce folder-based content structure for articles.
- [x] Migrate existing flat markdown files to `content/blog/<slug>/index.md`.
- [x] Move existing article image folders to `content/blog/<slug>/assets/`.
- [x] Add migration notes in this plan file (or README) so future authoring is consistent.
- [x] Confirm no URL changes in `/blog/<slug>`.

### Phase 2: Build Script Refactor

- [x] Refactor `generateBlogIndex.cjs` to discover `content/blog/*/index.md`.
- [x] Add `sourceType` inference (`html` if `index.html` exists).
- [x] Keep generated output files unchanged in location:
  1. `static/feed.json`
  2. `static/feed.xml`
  3. `src/lib/data/articleData.js`
- [x] Refactor `convertMarkdown.cjs`:
  1. render markdown when no `index.html`,
  2. use `index.html` when present,
  3. copy `assets/` for each slug,
  4. normalize asset references.
- [x] Add stale artifact cleanup strategy and guardrails.

### Phase 3: Route and Rendering Compatibility

- [x] Update `src/routes/blog/[slug]/+page.js` to consume enriched metadata fields.
- [x] Update `src/routes/blog/[slug]/+page.svelte` to support the new source model.
- [x] Keep current image enlarge UX working for both article types.
- [x] Ensure metadata-driven `<svelte:head>` remains correct for SEO.
- [x] Confirm graceful handling for missing article html file.

### Phase 4: Blog Redesign Foundation

- [x] Introduce blog-specific token system (CSS variables + typography choices).
- [ ] Create a new blog shell layout component for:
  1. article pages,
  2. blog listing page.
- [x] Update `src/routes/blog/+page.svelte` to match the redesigned style.
- [x] Ensure both old markdown and new HTML article output look good in the same shell.
- [x] Keep non-blog routes visually unchanged.

### Phase 5: Transition and Motion Improvements

- [x] Add route transitions for entering/leaving blog pages.
- [x] Add article load animation for long-form readability.
- [ ] Add reduced-motion fallback behavior.
- [ ] Verify no layout shift/jank on first paint.

### Phase 6: Context-Based-Engineering Article Import

- [x] Create new article folder `content/blog/<new-slug>/`.
- [x] Add `index.md` with full frontmatter.
- [x] Add `index.html` adapted from `/Users/dries/Downloads/context-based-engineering/index.html`.
- [ ] Migrate required assets/fonts strategy into project-owned assets where needed.
- [ ] Normalize external dependencies so the article is reliable in static build output.

### Phase 7: Validation and Regression Tasks (after changes)

- [x] Build and pipeline checks:
  1. `npm run build:index`
  2. `npm run build:markdown`
  3. `npm run build`
- [x] Content checks:
  1. markdown-only article renders correctly,
  2. html-backed article renders correctly,
  3. mixed list ordering by date is correct.
- [x] Feed checks:
  1. all articles appear in `feed.json`,
  2. RSS XML validates and includes new article,
  3. title/summary/date/author fields are accurate.
- [ ] UX checks:
  1. transitions between blog and non-blog pages are smooth,
  2. menu, dark mode, and particles toggles still behave correctly,
  3. no console errors during navigation.
- [x] Asset checks:
  1. article-local images resolve in both md and html modes,
  2. no broken references in build output.
- [ ] Performance checks:
  1. first article render remains acceptable,
  2. no excessive blocking scripts on load for regular markdown articles.

### Phase 8: Optional Hardening Tasks

- [ ] Add a dry-run command to preview parsed metadata and detected source type for every article.
- [ ] Add CI gate for duplicate IDs/slugs and missing metadata.
- [ ] Add CI gate that verifies each slug has either markdown body or html file body.
- [ ] Add a small authoring guide for creating future HTML-backed posts.
