# Contributing

## Local setup

```sh
npm install
npm run dev
```

## Blog article workflow

Each article must live in:

`content/blog/<slug>/`

Required:
1. `index.md` with frontmatter:
   - `title`
   - `summary`
   - `date`
   - `author`
   - `ID`
   - `tags`

Optional:
1. `index.html` for raw HTML-backed content
2. `assets/` for article-local images/files

Behavior:
1. `index.md` is always the metadata source of truth.
2. If `index.html` exists, it is used as the rendered body.
3. If `index.html` is missing, markdown body from `index.md` is rendered.

## HTML-backed article guidance

If you need immersive styling:
1. Keep frontmatter in `index.md`.
2. Put full article markup in `index.html`.
3. Put local files in `assets/` and use relative references.

Tailwind-specific behavior:
1. You can author with `https://cdn.tailwindcss.com` and inline `tailwind.config` inside `index.html`.
2. During `npm run build:markdown` (and predev/prebuild), Tailwind CDN/config are converted to static generated CSS at:
   - `static/assets/articles/<slug>/tailwind.generated.css`
3. Generated article output removes the CDN script to avoid production runtime warnings.

## Validation checklist before commit

Run:

```sh
npm run validate:blog
npm run build:index
npm run build:markdown
npm run build
```

Verify:
1. No duplicate IDs/slugs or missing metadata.
2. Article renders correctly via direct URL and in-site navigation.
3. No unexpected console errors on blog pages.
4. Mobile layout has no horizontal overflow.
