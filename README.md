# Meerman.xyz

[![Build and publish](https://github.com/DriesMeerman/meerman.xyz/actions/workflows/deployment.yml/badge.svg)](https://github.com/DriesMeerman/meerman.xyz/actions/workflows/deployment.yml)

My personal website - part portfolio, part resume, part blog.
Live at: https://meerman.xyz

## How to run

Running the app locally requires Node.js.

```sh
npm install
npm run dev
```

Then open [localhost:5173](http://localhost:5173)

## Building

To create a production build:

```sh
npm run build
```

You can preview the production build with:

```sh
npm run preview
```

## CI dependency install strategy

This project is developed on macOS and built in CI on Linux. Some dependencies (especially native/optional platform-specific ones) can resolve differently across those platforms when strictly reusing a lockfile generated on another OS.

For that reason, CI intentionally runs `npm install` (and regenerates `package-lock.json`) instead of `npm ci`, so dependency resolution happens in the Linux environment where the artifact is produced.

## Cross-platform build requirement

Local development happens on macOS, while the production artifact is built on Linux. Any new build step, transpiler, bundler plugin, shell script, or asset pipeline must work on both platforms.

When changing the build:

- Prefer Node-based tooling or other cross-platform dependencies over platform-specific binaries.
- Avoid relying on GNU-only or BSD-only command behavior unless the script explicitly handles both.
- If a tool needs native compilation or optional platform packages, verify it installs and runs on both macOS and Linux before adopting it.
- Keep generated output and path handling portable so local builds and server builds produce equivalent artifacts.

## Generated optimized images (`/g/assets`)

The site references optimized image variants under `/g/assets/*` (for example `servicenow_logo-400.png` and `realm_db_logo-306.png`).

Those files are generated from source files in `static/assets`, and written to `static/g/assets`:

- Run generation with `npm run build:images` (used in CI and Docker build)
- `static/g/` remains gitignored (generated artifact, not source)
- CI validates that `build/g/assets` exists and contains required optimized files before publishing the container

## Docker

### Build and run with Docker

The main `Dockerfile` uses a multi-stage build to compile the SvelteKit app and serve it with nginx.
It includes Python and build tools required by the `particles.js` dependency.

```sh
# Build the image
docker build -t meerman-xyz .

# Run the container
docker run -p 8080:80 meerman-xyz
```

Then open [localhost:8080](http://localhost:8080)

### Using pre-built artifacts

If you've already built the site externally (e.g., in CI/CD), use `Dockerfile.artifact`:

```sh
npm run build
docker build -f Dockerfile.artifact -t meerman-xyz .
docker run -p 8080:80 meerman-xyz
```

## Project Structure

- `src/` - SvelteKit application source
- `content/blog/` - Blog articles in folder-per-article format
- `static/` - Static assets served directly

## Blog

Blog articles use this structure:

`content/blog/<slug>/index.md` (required frontmatter + optional markdown body)
`content/blog/<slug>/index.html` (optional raw HTML body; if present this is rendered instead of markdown body)
`content/blog/<slug>/assets/*` (optional article-local assets)

The build process:
1. `generateBlogIndex.cjs` - Generates RSS feed and article data
2. `convertMarkdown.cjs` - Converts markdown to HTML
3. `scripts/validateBlogContent.cjs` - Validates required metadata, duplicate IDs, and duplicate slugs

These run automatically before dev/build via npm scripts.

### Creating a new article

1. Create a new folder: `content/blog/<slug>/`
2. Add `index.md` with required frontmatter:
   - `title`
   - `summary`
   - `date`
   - `author`
   - `ID`
   - `tags`
3. Choose one body format:
   - Markdown article: write body content in `index.md`
   - HTML-backed article: add `index.html` and keep markdown body empty (frontmatter is still read from `index.md`)
4. Add local media to `content/blog/<slug>/assets/` and reference them with relative paths in markdown/html.

### HTML-backed article notes

For `index.html` articles:
1. The HTML body is copied into `static/articles/<slug>.html`
2. Relative image paths are normalized to `/assets/articles/<slug>/...`
3. If `index.html` contains Tailwind CDN usage (`https://cdn.tailwindcss.com` + `tailwind.config`), the converter generates a static CSS file at build time:
   - `static/assets/articles/<slug>/tailwind.generated.css`
   - The CDN script/config are removed from generated output and replaced with a stylesheet link.

This keeps immersive/custom article styling while avoiding Tailwind CDN runtime warnings in production.

### Article authoring commands

```sh
npm run validate:blog
npm run build:index
npm run build:markdown
```

Then run `npm run dev` and check:
1. Blog list metadata/order
2. `/blog/<slug>` rendering on desktop/mobile
3. Console for unexpected errors

## Technologies

- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS
- **Deployment**: Docker / Static adapter
