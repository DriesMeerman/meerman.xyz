# Lab

`/lab` is an unlinked page of small widgets meant for Obsidian Canvas embeds, plus an artsy playground. It is not in the menu or the sitemap and is marked `noindex`. The hidden way in is five quick taps on the portrait on the home page.

## Modes

- **Dashboard** (`/lab`, no `w` parameter): every widget in the layout from the original sketch, with a collapsible Settings block underneath: the embed builder and a matrix rain playground, each in its own tab. The builder generates links and iframe snippets and shows a live preview.
- **Embed** (`/lab?w=<id>`): only the requested widgets, without the site menu or particles, on a transparent background that fills the iframe. Several widgets can be stacked with a comma list, for example `w=year,dice`.

The lab stores nothing: no localStorage, cookies, or other browser state. Configuration lives in the URL, data lives in JSON files in the repository, and dates follow the computer clock.

## Shared parameters

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| `w` | widget ids | none | Selects embed mode |
| `theme` | `auto`, `dark`, `light` | `auto` | Auto follows the system colour scheme and leaves the site's saved preference alone |
| `frame` | `on`, `off` | `on` | Off drops the HUD panel border and background |
| `rain` | `on`, `off` | `on` | Faint matrix rain behind framed panels, now and then |
| `rain-every`, `rain-length`, `rain-speed`, `rain-density`, `rain-size`, `rain-strength` | numbers | see `RAIN_DEFAULTS` | Set from the Matrix rain tab; only changed values appear |
| `date` | `YYYY-MM-DD` | computer date | Freezes the clock, useful for previews and screenshots |

Widget-specific options are defined in each widget's `meta.js`, and the embed builder lists them with hints. Year progress, for example, takes `year=2025`: a past year shows as complete instead of rolling over to the next year.

## Code layout

- `src/routes/lab/+page.svelte`: dashboard, embed mode, and theme handling. The root layout skips its chrome when `/lab` has a `w` parameter.
- `src/lib/lab/registry.js`: widget list, option and prop types, and option resolution.
- `src/lib/lab/<widget>/meta.js` and `<Name>Widget.svelte`: one folder per widget (`year`, `calendar`, `seasons`, `dice`, `orb`). Widgets are loaded on demand, so an embed only downloads its own code. Only the dice and orb pull in three.js.
- `src/lib/lab/HudPanel.svelte` and `lab.css`: the shared frame and `--lab-*` tokens, layered on the profile palette.
- `src/lib/effects/matrix-rain/`: reusable background rain. `field.js` holds one simulation per page in page coordinates, so drops line up across panels and keep falling while you scroll. `MatrixRain.svelte` is a window onto a field: drop it into any positioned element and pass a shared `field`, or leave it out to give that element its own. Idle, a field only holds a timer and every canvas is 0x0. A burst runs one 24 fps loop, draws only into canvases on screen, and is skipped while the tab is hidden or reduced motion is on. Colour and strength come from `--matrix-rain-color` and `--matrix-rain-opacity`; `RAIN_DEFAULTS` holds the default timing, speed, density, size, and strength.
- `src/lib/lab/rain.svelte.js` and `RainSettings.svelte`: the lab's rain control. The page provides it through context, every framed `HudPanel` shows its field, and the particles button in the menu starts a burst. The Matrix rain tab under Settings has sliders that write `rain-*` parameters to the URL; embed links from the builder carry them too.
- `src/lib/lab/time.js`: date helpers and meteorological seasons (March 1, June 1, September 1, December 1). January and February belong to the winter that started the previous December.

To add a widget, create a folder with a `meta.js` and a component that takes `{ options, clock, embedded }`, then register it in `registry.js`.
