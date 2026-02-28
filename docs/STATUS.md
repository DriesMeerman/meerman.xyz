# Implementation Status

Tracks the execution of the [Codebase Analysis & Improvement Plan](analysis/CODEBASE_ANALYSIS.md).

> **When completing a task**, check its box (`- [x]`), add the completion date, and note any follow-ups or deviations from the plan. If a task spawns new work, add it to the appropriate phase or to **Unplanned Work** at the bottom.

**Last updated:** 2026-02-28

---

## Phase 0: Quick Wins ✅

No visual changes.

- [x] Delete stale files — `static/articles/cr-008.html`, `cr-009.html`, `dr-008-research.html`, `src/lib/index.js`
- [x] Save generated `package-lock.json` as CI artifact on main builds (retention: 90 days)
- [x] Update `actions/checkout` to v4, remove debug steps from deployment.yml
- [x] Simplify Skill model — removed `Skill` class, `getHash()`, `fromJSON()`; now re-exports plain objects from `skillData.js`
- [x] Convert BrunoAce font from TTF (55 KB) to WOFF2 (20 KB), delete TTF — D10
- [x] SKIPPED — Clean `particle.config.json` — will be removed entirely in Phase 2 (D1). Cleaned anyway as it was trivial.

---

## Phase 1: Visual Regression Testing (D3) ✅

Safety net before any visual changes. Blocks Phase 2 and Phase 4.

- [x] Set up Playwright — install, `playwright.config.ts`, screenshot spec for all pages × light/dark × mobile/desktop
- [x] Particles smoke test — canvas present, initialized, `pointer-events: none`, content clickable, dark/light mode
- [x] Build report viewer — JSON report generator (`tools/commands/visual-report.ts`) + local web viewer in `tools/report-viewer/`
- [x] Capture baseline screenshots — 32 screenshots committed as reference

---

## Phase 2: Particles Replacement (D1 + D5)

Requires: Phase 1 complete.

- [x] Migrate state to Svelte 5 runes — `writable()` → `$state`/`$derived` in `state.svelte.js` — D5
- [x] Write custom Canvas particle engine — `engine.ts`, `renderer.ts`, `interactions.ts`, `types.ts` — D1 — completed 2026-02-28
- [x] Replace `Particles.svelte` — integrate custom renderer, wire up dark mode via runes — completed 2026-02-28
- [x] Run visual regression + particles smoke test — validate rendering matches — completed 2026-02-28 (`npm run test:particles`, `npm run test:visual`)
- [x] Remove `particles.js` fork — delete dependency, remove `particle.config.json` — completed 2026-02-28

---

## Phase 3: Build Tooling (D2 + D4)

Independent of Phase 2. Can run in parallel.

- [x] Scaffold `tools/` directory — `tsconfig.json`, `lib/types.ts`, `lib/config.ts`, `lib/articles.ts` — completed 2026-02-28
- [x] Port validation → `commands/validate.ts` — completed 2026-02-28
- [x] Port blog index generation → `commands/generate-index.ts` — completed 2026-02-28
- [x] Port markdown conversion → `commands/convert-articles.ts` (use `cheerio` for HTML parsing) — completed 2026-02-28
- [x] Port image optimization → `commands/optimize-images.ts` (introduces `sharp`, WebP + AVIF) — D7 — completed 2026-02-28
- [x] Add sitemap generation → `commands/generate-sitemap.ts` — D4 — completed 2026-02-28
- [x] Add external asset fetcher → `commands/fetch-external-assets.ts` — D9 — completed 2026-02-28 (command added; not executed yet)
- [x] Add orchestrator (`build.ts`), update npm scripts, delete old CJS files + bash script — completed 2026-02-28
- [x] Update CI pipeline — remove `apt-get install imagemagick webp`, update README for macOS dev — completed 2026-02-28

---

## Phase 4: Image & Performance (D7 + D8)

Requires: Phase 1 + Phase 3 complete.

- [x] Route cat + avatar images through pipeline — serve optimized WebP/AVIF variants — D8 — completed 2026-02-28
- [x] Add `loading="lazy"` to cat page, `Person.svelte`, `TradingCard.svelte` — completed 2026-02-28
- [x] Add `<picture>` elements with WebP/AVIF sources and fallbacks — completed 2026-02-28
- [x] Run `fetch-external-assets` to localize skill logos — D9 — completed 2026-02-28
- [x] Run visual regression to validate all image/layout changes — completed 2026-02-28 (`npm run test:visual`)

---

## Phase 5: CI/CD Improvements

No hard dependencies. Can start after Phase 3 (for the pipeline changes).

- [x] Add post-deploy health check (`curl -f https://meerman.xyz/`) — completed 2026-02-28
- [x] Create tagged-release workflow — on version tag, build + push versioned Docker image — completed 2026-02-28

---

## Phase 6: Nice to Have

Low priority. Pick up as time allows.

- [x] Add responsive `srcset` for different screen densities — completed 2026-02-28
- [x] Change `articleData.js` generation to export data directly instead of JSON.parse trick — completed 2026-02-28
- [x] Add incremental builds (content hashing) to tools pipeline — completed 2026-02-28 (`.cache/build-hashes.json` now skips unchanged article and image work)
- [x] Enhance image service — return structured data for `<picture>` elements (srcset, width, height) — completed 2026-02-28

---

## Unplanned Work

Tasks that came up during implementation. Add items here as they're discovered.

| Date | Task | Phase | Status |
|------|------|-------|--------|
| 2026-02-28 | Fix flaky visual regression tests — particles canvas bled through in light-mode screenshots; replaced MutationObserver-based hiding with CSS + DOM removal of canvas after navigation | Phase 1 | Done |
| 2026-02-28 | Regenerate baseline screenshots after bug fix | Phase 1 | Done |
| 2026-02-28 | Replace `particles.js` with a local canvas engine and remove `particle.config.json` | Phase 2 | Done |
| 2026-02-28 | Replace legacy blog/image build scripts with the `tools/` TypeScript pipeline | Phase 3 | Done |
| 2026-02-28 | Route homepage/cat images through the generated asset pipeline and localize skill logos | Phase 4 | Done |
| 2026-02-28 | Add deploy health check and tagged Docker release workflow | Phase 5 | Done |
| 2026-02-28 | Add content-hash cache for incremental article and image builds | Phase 6 | Done |
| 2026-02-28 | Add responsive image srcsets, generated image manifest, and direct article data export | Phase 6 | Done |

---

## Completion Log

Record completed phases and any notable outcomes.

| Phase | Completed | Notes |
|-------|-----------|-------|
| Phase 0 | | |
| Phase 1 | | |
| Phase 2 | 2026-02-28 | Custom canvas particle renderer replaces `particles.js`; smoke and visual regression suites passed |
| Phase 3 | 2026-02-28 | TypeScript `tools/` pipeline replaces legacy CJS/bash build scripts; build, validation, and sitemap generation pass |
| Phase 4 | 2026-02-28 | Cat/avatar images now use generated AVIF/WebP fallbacks, skill logos are localized, and visual regression passed |
| Phase 5 | 2026-02-28 | Deploys now verify the live site and version tags publish both versioned and latest Docker images |
| Phase 6 | 2026-02-28 | Responsive image metadata is now generated into `imageData.js`, picture helpers expose srcset/dimensions, and `articleData.js` exports directly |
