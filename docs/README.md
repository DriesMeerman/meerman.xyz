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

### Guides
- [Style Guide](guides/STYLE_GUIDE.md) — code style conventions

## Archiving

When a document is superseded or no longer relevant, move it to `archive/` with a date prefix:

```
archive/
  2026-02-ARCHITECTURE.md      ← replaced by updated version
  2026-03-CODEBASE_ANALYSIS.md ← completed improvement pass
```
