# Lab

`/lab` is an unlinked page of small widgets meant for Obsidian Canvas embeds, plus an artsy playground. It is not in the menu or the sitemap and is marked `noindex`. The hidden way in is five quick taps on the portrait on the home page.

## Modes

- **Dashboard** (`/lab`, no `w` parameter): every widget in the layout from the original sketch, with the embed builder underneath. The builder generates links and iframe snippets and shows a live preview.
- **Embed** (`/lab?w=<id>`): only the requested widgets, without the site menu or particles, on a transparent background that fills the iframe. Several widgets can be stacked with a comma list, for example `w=year,dice`.

The lab stores nothing: no localStorage, cookies, or other browser state. Configuration lives in the URL, data lives in JSON files in the repository, and dates follow the computer clock.

## Shared parameters

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| `w` | widget ids | none | Selects embed mode |
| `theme` | `auto`, `dark`, `light` | `auto` | Auto follows the system colour scheme and leaves the site's saved preference alone |
| `frame` | `on`, `off` | `on` | Off drops the HUD panel border and background |
| `date` | `YYYY-MM-DD` | computer date | Freezes the clock, useful for previews and screenshots |

Widget-specific options are defined in each widget's `meta.js`, and the embed builder lists them with hints. Year progress, for example, takes `year=2025`: a past year shows as complete instead of rolling over to the next year.

## Code layout

- `src/routes/lab/+page.svelte`: dashboard, embed mode, and theme handling. The root layout skips its chrome when `/lab` has a `w` parameter.
- `src/lib/lab/registry.js`: widget list, option and prop types, and option resolution.
- `src/lib/lab/<widget>/meta.js` and `<Name>Widget.svelte`: one folder per widget (`year`, `calendar`, `seasons`, `dice`, `orb`). Widgets are loaded on demand, so an embed only downloads its own code. Only the dice and orb pull in three.js.
- `src/lib/lab/HudPanel.svelte` and `lab.css`: the shared frame and `--lab-*` tokens, layered on the profile palette.
- `src/lib/lab/time.js`: date helpers and meteorological seasons (March 1, June 1, September 1, December 1). January and February belong to the winter that started the previous December.

To add a widget, create a folder with a `meta.js` and a component that takes `{ options, clock, embedded }`, then register it in `registry.js`.
