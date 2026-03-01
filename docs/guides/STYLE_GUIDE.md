# Meerman.xyz Style Guide

This guide documents the current visual system and sets rules for keeping light mode, dark mode, and immersive blog articles consistent.

## 1. Design Principles

1. Keep the site readable first, expressive second.
2. Use the existing particle-inspired cyan/teal/sky accents as the shared brand thread.
3. Preserve clear mode contrast:
   - light mode should feel bright and calm
   - dark mode should feel deep and low-glare
4. Keep nav and page structure stable across all routes.
5. Immersive blog posts can be stylistically unique, but must not break global UI.

## 2. Core Theme Tokens

## 2.1 Global App Tokens

Defined by current layout/menu behavior:

- Light mode:
  - `body bg`: `#f5f5f5`
  - `body text`: `#1f2937`
  - `nav border`: `#14b8a6` (`teal-500`)
  - `nav link hover`: `#0d9488`
  - `link underline`: `#60a5fa`

- Dark mode:
  - `body bg`: `#52525b`
  - `body text`: `#e5e7eb`
  - `nav border`: `#0284c7` (`sky-600`)
  - `nav link hover`: `#38bdf8`

## 2.2 Blog Index Tokens (`/blog`)

- Light mode:
  - `--blog-bg`: `#eef3fb`
  - `--blog-panel`: `#ffffff`
  - `--blog-border`: `#d5deec`
  - `--blog-ink`: `#1f2937`
  - `--blog-muted`: `#5e6b82`
  - `--blog-accent`: `#168fc7`

- Dark mode:
  - `--blog-bg`: `#1f2230`
  - `--blog-panel`: `#262a39`
  - `--blog-border`: `#3d4354`
  - `--blog-ink`: `#e7ebf3`
  - `--blog-muted`: `#bcc4d4`
  - `--blog-accent`: `#5cb7db`

## 3. Typography and Spacing

1. Primary UI text should stay in the current sans-serif stack for consistency.
2. Hero headings can be larger and tighter (`letter-spacing` slightly negative), but body copy must stay comfortable.
3. Keep paragraph line height around `1.45-1.65`.
4. Use rounded panels/cards (`0.85rem-1rem`) as the shared container shape language.
5. Prefer subtle elevation:
   - light mode: soft cool shadows
   - dark mode: lower blur, lower alpha, avoid heavy glow

## 4. Component Rules

## 4.1 Navigation

1. Nav layout and controls (menu links, particles toggle, theme toggle) are global and must remain untouched by route-specific styles.
2. Route CSS must never target bare `nav`, `body`, or generic utility classes globally.
3. Mobile nav behavior must be unchanged by page-level styles.

## 4.2 Cards and Panels

1. Use border + subtle gradient/surface contrast, not strong neon effects.
2. Hover motion should be minimal (`translateY(-1px)` range).
3. Keep summary truncation consistent in blog cards.

## 4.3 Motion

1. Keep transitions under ~300ms for UI interactions.
2. Page entry effects should be short and not delay readability.
3. Respect reduced-motion preference when adding new animation.

## 5. Consistency Improvement Backlog

1. Move shared color tokens from component-local CSS into one central theme source.
2. Standardize panel/card border radius and shadow values across non-blog routes.
3. Normalize heading scale between home, skills, and blog pages.
4. Create shared utility classes for:
   - section panels
   - subdued label text
   - chip/pill metadata
5. Add a small visual regression checklist:
   - light/dark screenshots for home, skills, blog index, article page
   - mobile screenshot for nav expanded/collapsed
6. Add reduced-motion handling to all route transitions.

## 6. Immersive Blog Article Standards

Immersive article = folder with `index.md` + `index.html` (example: `dr-008`).

1. Metadata remains in `index.md` frontmatter.
2. `index.html` is allowed to be highly custom, but must be isolated.
3. Tailwind CDN usage in source HTML is converted to static generated CSS at build time.
4. Generated article utilities must be scoped to `.article-content` to avoid global collisions.
5. No immersive script or style may alter:
   - global nav behavior
   - global body/html layout
   - theme toggle controls
6. Immersive pages should still support:
   - correct direct-load/refresh rendering
   - mobile readability
   - image enlargement behavior
   - reading-time label at top

