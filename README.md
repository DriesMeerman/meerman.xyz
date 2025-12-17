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

## Project Structure

- `src/` - SvelteKit application source
- `content/blog/` - Markdown blog articles
- `static/` - Static assets served directly

## Blog

Blog articles are written in Markdown in `content/blog/`. The build process:
1. `generateBlogIndex.js` - Generates RSS feed and article data
2. `convertMarkdown.js` - Converts markdown to HTML

These run automatically before dev/build via npm scripts.

## Technologies

- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS
- **Deployment**: Docker / Static adapter
