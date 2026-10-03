# Site history

`/site-history` is an unlinked, prerendered visual archive. It is included in the sitemap and inherits the shared profile design and the global theme toggle.

## Releases and screenshots

The first entry is **v0**, captured from `https://old.meerman.xyz/` on 2026-10-04. Its repository and release date are unverified, so it is labelled "Before v1". The source address is displayed without a live link, so the archive does not depend on that site remaining online. It is a single page with About, Contact, and expandable Skills sections, built with Bootstrap and a particle background.

The original has one fixed dark appearance and no theme switch or color-scheme styles. Its two assets, `0/home-original.webp` and `0/home-original-full.webp`, are used in both archive themes. The screenshot preserves the live page's dynamically calculated age at capture time. The HTML's Last-Modified header reports 2020-11-22, which is not treated as a release date.

| Tag | Source revision | Date | Pages |
|-----|-----------------|------|-------|
| `1.1.0` | `cdf63e2304087e11d87f68ae5dbc4374c41dc3a3` | 2023-06-21 | Home, Skills, Experience, Education, Blog |
| `2.2.0` | `95b7d56b895375b4708bf0d1968a37f1c6d4cca6` | 2023-12-13 | Home, Skills, Experience, Education, Blog |
| `3.1.0` | `6392e617279012412299c78d3e824e27e114bc3c` | 2026-02-26 | The five original pages plus Tools |
| `4.0.0` | `f47a6ce1d91ca66117abfd7a260d37a5c5c9eeae` | 2026-10-04 | The six previous pages plus Industries and Cats |

`1.0.0` is intentionally omitted because it closely resembles `1.1.0`. Dates are the tagged commits' dates. The `4.0.0` tag identifies the release even though its package file still contains `3.2.0`.

Release metadata and page lists live in `src/lib/data/siteHistory.js`. Product images live in `static/site-history/<tag>/`:

- `<page>-<theme>.webp`: a 1440 by 1000 desktop viewport.
- `<page>-<theme>-full.webp`: the full page at the same desktop width.

There are 25 pages across five versions: the original single page and 24 pages in tagged releases. Tagged pages have both themes and a viewport and full-page image for each, giving 96 WebP assets. The two original-theme v0 assets bring the total to 98. WebP quality is 88. These images are product content and belong in Git. Raw captures, capture scripts, and before/after review images remain in ignored `.cache/` storage.

## Capture provenance

The historical releases were exported into isolated directories under `.cache/site-history/releases/` with `git archive`. The older releases use hash routes such as `/#/education`; the SvelteKit releases use `/education`.

For `1.1.0`, the obsolete native `node-sass` dependency was replaced with Dart Sass in the temporary build. The older image processor used the installed Sharp version. These adjustments affect build compatibility, not page content. For `3.1.0`, the expected 306px and 400px image variants were generated from that release's original assets before serving the production preview.

External skill-logo requests were fulfilled from the matching original logo files preserved in the current repository. This avoids missing images from old external hosts while preserving the historical cards. The `4.0.0` pages were captured from the working tree at its tagged revision before the history route was introduced.

## Capturing another release

1. Fetch the tag, record its source revision and commit date, and export it to an isolated temporary directory. Do not check out an old release over ongoing work.
2. Install the release's dependencies and build it with its own styles, content, and assets. Keep compatibility adjustments in the temporary directory.
3. Serve the release locally. Use a Chromium browser with a 1440 by 1000 viewport and device scale factor 1.
4. Capture each main route twice, setting `localStorage.theme` to `light` or `dark` before loading. Match the browser color scheme to the chosen theme. Wait for fonts, scroll through the page to load lazy images, and verify every image has a nonzero natural width.
5. Preserve the final visible state of entrance animations. In `3.1.0`, disabling animation leaves `.timeline-item` at its initial `opacity: 0`; apply a capture-only `opacity: 1` and `transform: none` override or wait for animations to finish. Check that the timeline cards are visible before capturing.
6. Return to the top and capture both the viewport and the full page. Preserve particles; use a seeded random source for consistent captures. Block analytics requests during local capture.
7. Convert the captures to WebP, put the product images in the release directory, and add the release metadata and available pages to `siteHistory.js`. Do not add pages that did not exist in that release.
8. Review the images visually. Verify direct loading in dark mode, theme switching, arrow wrapping, keyboard navigation, the full-page dialog, narrow layouts, and the sitemap.

`e2e/site-history.spec.ts` covers the gallery behavior. The page explicitly prerenders because the navigation does not link to it.
