# 115: Start the six case-study apps with one port-allocating command

- **Date**: 2026-09-23
- **Status**: accepted
- **Tags**: tooling, case-studies, dev-server, pnpm, electron
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

six case-study apps (3 bookmarks web apps, 3 phonebook Electron apps) each hardcode dev ports (Vite 3000/3001/5173, APIs 4000/3002/8787) and Electron mains hardcoded their renderer URL. Starting them from six terminals collided on ports, and one app (phonebook-ds4-flash) declared "type": "module" while its electron/main.js used need.

## Decision

Add `pnpm case-studies` (scripts/case-studies/index.mjs) as single entry point. script allocates one Vite port and one API port per app from per-app bases, exports them as environment variables (VITE_PORT, PORT, VITE_API_ORIGIN, VITE_API_URL, CORS origins, ELECTRON_RENDERER_URL), starts six apps in parallel, prefixes every log line with app label, and kills all process groups on Ctrl-C. apps read ports from environment and keep their old defaults for standalone runs; phonebook-ds4-flash gets electron/package.json with "type": "commonjs" so its CommonJS main loads.

## Consequences

Positive: one command starts all six without port collisions; one Ctrl-C stops everything; the apps stay runnable standalone with their original defaults; missing node_modules install automatically with --ignore-workspace so the nested workspace root is not used. Negative: the case-study configs now carry env-aware ports, and phonebook-ds4-flash carries a nested package.json that only exists to satisfy its CommonJS Electron tree.

## What would end this

Evidence that case-study app needs fixed port no environment can move (tool that only accepts 5173), or that case studies leave this repository and are launched from their own workspace.

## Alternatives Considered

1. Assign fixed ports per app in each config (rejected: still collides with user's other processes and needs manual edits when port is busy)
1. Keep six terminals and document ports (rejected: collision and ds4 ESM bug remain)
1. Use concurrently at root with hardcoded ports (rejected: does not resolve Electron renderer URL or API proxy targets)
