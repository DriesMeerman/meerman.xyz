# Meerman.xyz Style Guide

This guide documents the current visual system and sets rules for keeping light mode, dark mode, profile pages, and immersive blog articles consistent.

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

The blog index uses the shared `--profile-*` tokens from `src/lib/styles/profile.css`, documented in section 4.4. It has no separate page background or palette. Article pages keep their existing scoped typography and immersive artwork.

## 3. Typography and Spacing

1. Primary UI text should stay in the current sans-serif stack for consistency.
2. Hero headings can be larger and tighter (`letter-spacing` slightly negative), but body copy must stay comfortable.
3. Keep paragraph line height around `1.45-1.75`.
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

## 4.4 Shared Pages: Home, Industries, Education, Experience, Blog Index

These pages share the Industries design language: precise corporate panels with a restrained cyberpunk influence. Use fine borders, inset frames, compact technical labels, and a single cyan corner accent. Keep the handmade character of the skills cards; avoid adding generic glass panels or large neon glows to these pages.

### Shared theme source

`src/lib/styles/profile.css`, imported by `src/app.css`, owns the profile palette. Tokens apply only beneath `.profile-theme`; dark values follow the existing `.dark` ancestor. Reuse these tokens rather than copying route-specific hex values.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--profile-ink` | `#20333f` | `#eef2f3` | Headings and primary text |
| `--profile-muted` | `#526572` | `#c2cdd4` | Supporting copy |
| `--profile-accent` | `#087b83` | `#82e6ed` | Dates, small labels, focus outlines, corner marks |
| `--profile-line` | `#78999f66` | `#8cbac04d` | Panel borders and dividers |
| `--profile-surface` | `#edf4f0e8` | `#303b45ec` | Main card surface |
| `--profile-inset` | `#e1eae9` | `#202d38` | Logo frames and inset controls |
| `--profile-cyan` | `#a8ede7` | `#91e4e1` | Artwork accents |
| `--profile-pink` | `#f0b5cd` | `#e6a6c4` | Secondary artwork accents |

Shared shape tokens are `--profile-radius: .9rem` and `--profile-shadow: 1px 2px 5px #174c4c22`. Bruno Ace is loaded once in this stylesheet and exposed as `--profile-display-font`. `--profile-meta-font` uses the system monospace stack.

### Page and card composition

1. Use `ProfilePage.svelte` for a standard header: small `MEERMAN / PAGE` marker and cross, a thin divider, a left-aligned Bruno Ace heading with an accent dot, then supporting copy. Its optional `marker` prop separates a short route label (such as `Blog`) from a longer display title (such as `Digital Reflections`). Long titles wrap on narrow screens. Home and Industries retain custom portrait/company headers while consuming the same tokens.
2. Keep content within `1120px`. Use `.profile-section`, `.profile-section-head`, `.profile-section-title`, and `.profile-section-count` for numbered sections with a subdued entry count. Section labels are metadata, not large display headings.
3. Use `StyledTimeLine.svelte` for dated education, internship, or experience entries. From `1024px` upward, cards alternate right/left around a central rail, with short connectors and diamond nodes. Smaller screens use one column beside a left rail. Keep DOM order chronological at every width; the breakpoint prevents cramped columns on tablets.
4. Main cards combine the shared surface, a faint cyan-to-blue wash, a thin border, the shared radius/shadow, and one small top-right corner mark. The `.profile-panel` class provides this base surface for new panels, including the homepage portrait and biography cards; set padding locally. Use `1.25rem` padding for alternating desktop cards, `1.5rem` for wider single-column cards, and `.85rem-1.1rem` on mobile. Hover lifts at most `1px`; disable that motion when reduced motion is requested. Static biography panels need no hover effect.
5. Frame organization logos in an inset square with `object-fit: contain`; do not stretch, recolor, or crop them. Entries without artwork still align naturally. Decorative logos use an empty `alt` when the adjacent heading already names the organization.
6. Reserve Bruno Ace for page and card headings. Dates, section markers, and highlight chips use monospace; descriptions and roles use the normal sans-serif stack. Body copy stays around `.9rem`, with `1.75` line height for longer descriptions.
7. Highlight chips use small rectangular corners (`.15rem`), a fine border, and a faint inset surface. Allow wrapping and keep complete text readable. Initially show three highlights; disclose the remaining count and reveal the rest when details open.
8. Use native `details`/`summary` for expandable content, with a visible plus/minus indicator, a contextual accessible name, and a clear focus outline. Only add a disclosure when there is more content to reveal. Document links belong inside the expanded content and retain their labels.

### Review checklist

- Check light and dark mode at `320px`, `390px`, `768px`, `1024px`, and wider desktop widths. Verify the single-column to alternating transition at `1024px`. Long organization names, role names, chips, and document links must wrap without horizontal scrolling.
- Keep the small marker, date, and section metadata legible; do not use display fonts for paragraphs.
- Verify mouse and keyboard disclosure behavior, visible focus, expanded highlights, and document links.
- Confirm shared token changes also work on Industries and leave the global navigation and other routes intact.

### Blog index cards

1. Use the shared header and numbered section heading for the article archive. Place the entry count and RSS link alongside the section label, with enough room for both at mobile widths.
2. Article cards use the same surface wash, thin border, corner accent, radius, shadow, and restrained hover as timeline cards. Use a responsive grid with a `300px` minimum card width capped at `100%`; narrow screens use one column. Keep newest entries first.
3. Each card starts with a monospace article ID, a small rectangular inset format badge, and a publication date. Use a semantic `time` with an ISO `datetime`; format the visible date in UTC for consistent rendering.
4. Keep full titles readable in Bruno Ace and excerpts in the normal sans-serif stack. Titles wrap rather than truncate. Clamp excerpts consistently to four lines, with `1.75` line height, and align the bottom `Read article` row across cards.
5. Make the whole card one link with its article title as the accessible name. Use a visible keyboard focus outline; the corner decoration must not intercept clicks. RSS remains a normal link to `/feed.xml`.
6. Loading, empty, and error states use the shared panel surface and readable text. Provide a retry control after a feed failure. Avoid entry animation that delays reading and disable card hover motion for reduced motion.
7. Keep index CSS scoped to the index components. Applying the shared palette must not change article content, syntax highlighting, image dialogs, or immersive article layouts.

### Personal homepage

1. Keep the personal profile at `/`. Start with the name, current engineering/leadership role, a concise introduction, and the real portrait. The homepage also links directly to work and writing; the longer background and interests follow below.
2. `home/Person.svelte` renders a named `heading` snippet, the introduction/actions as its `children`, and the existing responsive portrait. At desktop widths the portrait sits beside the introduction. Smaller screens use a compact portrait beside the name, with introduction text spanning the full width beneath them.
3. Use the same inset image frame, thin border, corner mark, and technical caption as the shared design. Preserve the photograph's natural proportions and colours. Load this visible portrait eagerly with responsive AVIF/WebP/fallback sources and high fetch priority.
4. Split the biography into Background and Off the clock cards. Use real paragraphs and clear headings; keep body copy left-aligned at `1.75` line height. Preserve the personal voice, hobbies, and playful details while making the text easy to scan.
5. `home/Socials.svelte` uses labelled inset links with the existing social icons and destinations. Four links fit in one row from `1280px`; narrower widths use two columns, and long labels wrap. Keep a discreet company-details link beneath these links.
6. The hero's two links and the social links have visible keyboard focus. Apply small hover motion only to interactive social links and respect reduced motion. Keep the shared navigation stable.

## 5. Consistency Improvement Backlog

1. Extend the central profile tokens to other routes when those routes are redesigned; Home, Industries, Education, Experience, and the Blog index already share them.
2. Standardize remaining non-blog panels on the shared radius and shadow when appropriate; preserve the distinctive trading cards on Skills.
3. Review heading scale on Skills when that page is redesigned; Home and the Blog index already use the shared display font and responsive scale.
4. Create shared utility classes for:
   - section panels
   - subdued label text
   - chip/pill metadata
5. Add a small visual regression checklist:
   - light/dark screenshots for home, skills, industries, education, experience, blog index, article page
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
