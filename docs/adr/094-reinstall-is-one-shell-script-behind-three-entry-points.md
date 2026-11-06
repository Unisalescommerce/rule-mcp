# 094: Reinstall is one shell script behind three entry points

- **Date**: 2026-09-17
- **Status**: accepted
- **Tags**: cli, installer, devx
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

from-scratch reinstall on dev machine needs three steps: purge node_modules and pnpm-lock.yaml, pnpm install, then refresh global rule-mcp bin. Three surfaces already exist (pnpm scripts, scripts/*.sh bootstraps, rule-mcp CLI), and global bin in place is `pnpm install -g .` from existing postinstall, not `pnpm link --global` (ADR 038 warns that pnpm 10/11 rewrites pnpm-workspace.yaml and lockfile). CLI handler doing purge itself is fragile: it would delete node_modules of running process.

## Decision

`scripts/reinstall.sh` owns sequence and runs from checkout it lives in; it refuses directory without package.json. `package.json` exposes it as `pnpm reinstall`, and `rule-mcp reinstall` (registrar plus handler with injectable spawn) delegates to same script with inherited stdio, so CLI is third door to one implementation rather than second purge.

## Consequences

One implementation, three entry points, so purge cannot drift. CLI survives its own purge because handler imports only Node built-ins and delegates to child process. reinstall is POSIX-only (bash), like mcp:install; on Windows it needs Git Bash. Tests execute script inside scratch copy with fake pnpm on PATH, so real node_modules are never touched.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. CLI handler performing purge itself: it would delete node_modules of process it is running in.
1. inline package.json one-liner (rm -rf...): not Windows-safe and not testable without running it.
1. pnpm link --global for bin: ADR 038 records that pnpm 10/11 then rewrites pnpm-workspace.yaml and lockfile.
