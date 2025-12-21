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
- `content/blog/` - Markdown blog articles
- `static/` - Static assets served directly

## Blog

Blog articles are written in Markdown in `content/blog/`. The build process:
1. `generateBlogIndex.cjs` - Generates RSS feed and article data
2. `convertMarkdown.cjs` - Converts markdown to HTML

These run automatically before dev/build via npm scripts.

## Technologies

- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS
- **Deployment**: Docker / Static adapter
