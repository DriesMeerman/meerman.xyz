# Architecture Overview

This document explains the full architecture of meerman.xyz, including the build process, deployment pipeline, and limitations of the current setup.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [SvelteKit Configuration](#sveltekit-configuration)
- [Server Components & SSR](#server-components--ssr)
- [Build Process](#build-process)
- [Deployment Pipeline](#deployment-pipeline)
- [Port Configuration](#port-configuration)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Internet                                                           │
│      │                                                               │
│      ▼                                                               │
│   ┌──────────────────┐                                               │
│   │  VPS nginx       │  ← Listens on port 80/443 (public)            │
│   │  (reverse proxy) │                                               │
│   └────────┬─────────┘                                               │
│            │                                                         │
│            │ proxy_pass to localhost:4337                            │
│            ▼                                                         │
│   ┌──────────────────┐                                               │
│   │  Docker Container│  ← Host port 4337 → Container port 8080       │
│   │  ┌──────────────┐│                                               │
│   │  │ nginx        ││  ← Serves static files from /usr/share/nginx  │
│   │  │ (port 8080)  ││                                               │
│   │  └──────────────┘│                                               │
│   │  ┌──────────────┐│                                               │
│   │  │ Static files ││  ← Pre-built HTML/CSS/JS (no Node.js runtime) │
│   │  │ /build/*     ││                                               │
│   │  └──────────────┘│                                               │
│   └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SvelteKit Configuration

### Current Adapter: `@sveltejs/adapter-static`

The site uses the **static adapter**, which pre-renders all pages at build time:

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({
      fallback: '200.html'  // SPA fallback for client-side routing
    })
  }
};
```

### What This Means

| Feature | Supported? | Notes |
|---------|------------|-------|
| Static pages | ✅ Yes | All pages pre-rendered at build time |
| Client-side routing | ✅ Yes | Via `200.html` fallback |
| Client-side JavaScript | ✅ Yes | Full Svelte reactivity works |
| API routes (`+server.js`) | ❌ No | No server runtime |
| Server-side rendering (SSR) | ❌ No | Pages rendered at build, not request time |
| Server load functions | ❌ No | `+page.server.js` not supported |
| Form actions | ❌ No | Requires server runtime |
| Cookies/Sessions | ❌ No | No server to manage state |

---

## Server Components & SSR

### Can We Run Server Components?

**No.** With `adapter-static`, there is no Node.js server in production. The entire site is pre-built into static HTML/CSS/JS files and served by nginx.

### What Are "Server Components" in SvelteKit?

SvelteKit doesn't use "server components" like React Server Components. Instead, it has:

1. **Server Load Functions** (`+page.server.js` / `+layout.server.js`)
   - Run on the server at request time
   - Can access databases, secrets, file system
   - **Not available with adapter-static**

2. **API Routes** (`+server.js`)
   - Define REST endpoints
   - Handle POST/PUT/DELETE requests
   - **Not available with adapter-static**

3. **Form Actions** (`+page.server.js` with `actions`)
   - Progressive enhancement for forms
   - Server-side form handling
   - **Not available with adapter-static**

### How to Enable Server Features

To use server-side features, you would need to switch to `adapter-node`:

```javascript
// svelte.config.js (NOT current configuration)
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter({
      out: 'build'
    })
  }
};
```

This would require:
- A different Dockerfile that runs Node.js instead of nginx
- The container would run: `node build/index.js`
- You'd need to handle Node.js process management (PM2, etc.)

### Current Architecture Trade-offs

| Static (Current) | Node.js Server |
|------------------|----------------|
| ✅ Simple deployment | ❌ More complex |
| ✅ No runtime dependencies | ❌ Node.js required |
| ✅ CDN-friendly | ⚠️ Needs origin server |
| ✅ Very fast (just files) | ⚠️ Server processing |
| ❌ No dynamic server logic | ✅ Full server capabilities |
| ❌ No API routes | ✅ API routes work |
| ❌ No SSR | ✅ SSR at request time |

---

## Build Process

### Local Development

```bash
npm run dev    # Starts Vite dev server with HMR
```

Development mode **does** support server features because Vite runs a Node.js server. However, these won't work in production with the static adapter.

### Production Build

```bash
npm run build  # Outputs static files to /build
```

Build steps (defined in `package.json`):
1. `prebuild`: Generate blog index and convert markdown
2. `vite build`: Compile SvelteKit app to static files

Output structure:
```
build/
├── _app/
│   ├── immutable/      # Hashed JS/CSS chunks
│   └── version.json
├── 200.html            # SPA fallback
├── articles/           # Pre-rendered blog pages
├── assets/             # Static assets
├── favicon.ico
├── feed.json           # RSS feed (JSON)
└── feed.xml            # RSS feed (XML)
```

---

## Deployment Pipeline

### GitHub Actions Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  build-website  │────▶│publish-container│────▶│     deploy      │
│                 │     │                 │     │                 │
│ • npm ci        │     │ • Download      │     │ • SSH to VPS    │
│ • npm run build │     │   artifact      │     │ • Pull image    │
│ • Upload /build │     │ • Docker build  │     │ • Restart       │
│                 │     │ • Push to Hub   │     │   container     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Triggers

- **Push to `main`**: Full pipeline (build → publish → deploy)
- **Pull request to `main`**: Build only (no deploy)
- **Manual dispatch**: Full pipeline

---

## Port Configuration

### Why Port 8080?

The container uses port 8080 internally (instead of the standard 80) to:
1. Avoid conflicts with other services on port 80
2. Prevent accidental direct exposure
3. Follow the principle of running as non-root (port 80 requires root on some systems)

### Port Mapping

| Layer | Port | Description |
|-------|------|-------------|
| Public internet | 80/443 | VPS nginx handles TLS termination |
| VPS nginx → Docker | 4337 | Internal proxy pass |
| Docker host → container | 4337:8080 | Port mapping |
| nginx inside container | 8080 | Serves static files |

### VPS nginx Configuration (Example)

```nginx
# /etc/nginx/sites-available/meerman.xyz
server {
    listen 80;
    server_name meerman.xyz www.meerman.xyz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name meerman.xyz www.meerman.xyz;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4337;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Summary

This site is a **fully static SvelteKit application**:

- **No Node.js runtime** in production
- **No server-side logic** possible (no SSR, no API routes, no form actions)
- **nginx serves pre-built files** from the Docker container
- **VPS nginx** handles public traffic and TLS, proxying to the container

If server-side features are needed in the future, the architecture would need to change to use `adapter-node` with a Node.js runtime instead of static file serving.

