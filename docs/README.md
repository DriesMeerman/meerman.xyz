# Documentation

Project documentation for meerman.xyz.

## Structure

```
docs/
  architecture/    ← System design, infrastructure, data flow diagrams
  analysis/        ← Codebase audits, research, improvement plans
  decisions/       ← Architecture Decision Records (ADRs)
  guides/          ← Style guides, contributing guides, how-tos
  archive/         ← Superseded or historical documents
```

## Current Documents

### Status
- **[Implementation Status](STATUS.md)** — live task tracker with checkboxes for all planned work (update when completing tasks)

### Architecture
- [Architecture Overview](architecture/ARCHITECTURE.md) — production flow, SvelteKit config, deployment pipeline, port mapping

### Analysis
- [Codebase Analysis & Improvement Plan](analysis/CODEBASE_ANALYSIS.md) — full audit with 11 confirmed decisions (D1–D11), prioritized action items across 7 phases
- [Meerman Industries Website Requirements](analysis/INDUSTRIES_WEBSITE_REQUIREMENTS.md) — Dutch business disclosures and scope for the company profile at `/industries`

### Guides
- [Deployment and Stale-site Recovery](guides/DEPLOYMENT.md) — disk-space recovery, commit-specific images, and public revision verification
- [Style Guide](guides/STYLE_GUIDE.md) — visual theme, shared profile tokens, card composition, and consistency rules
- [Leadership Card Artwork](guides/LEADERSHIP_ARTWORK.md) — asset paths, rarity choices, and image generation prompts

### Reviews
- [Personal Homepage Redesign Screenshots](reviews/home-profile-redesign/README.md) — the profile hero, biography panels, and social links in light/dark mode on desktop/mobile
- [Blog Index Redesign Screenshots](reviews/blog-index-redesign/README.md) — the shared archive design in light/dark mode on desktop/mobile
- [Company and Profile Redesign Screenshots](reviews/company-profile-redesign/README.md) — production previews of Industries, Leadership, Education, and Experience in light/dark mode on desktop/mobile

## Archiving

When a document is superseded or no longer relevant, move it to `archive/` with a date prefix:

```
archive/
  2026-02-ARCHITECTURE.md      ← replaced by updated version
  2026-03-CODEBASE_ANALYSIS.md ← completed improvement pass
```
