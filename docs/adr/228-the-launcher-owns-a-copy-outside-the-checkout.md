# 228: The launcher owns a copy outside the checkout

- **Date**: 2026-10-30
- **Status**: accepted
- **Tags**: architecture, installer, cli, launcher
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

A PATH shim that execs node on an absolute path into a git working tree breaks when that tree changes branch: the entry point can disappear, node exits 1, and git hooks read the failure as a policy rejection. Measured 2026-10-26 on this machine. pnpm link --global was already rejected because pnpm 10+ rewrites pnpm-workspace.yaml and the lockfile of the tree being installed from. Symlinking the checkout entry has the same branch failure. Phase 1 of the stable-launcher plan measured that pnpm pack cannot start (no node_modules, no OpenTUI platform binary) and chose pnpm deploy --prod --legacy into ~/.rule-mcp/launcher/`<version>`/ with a current pointer. Phases 2-3 shipped resolution order and gate skip recording. Phase 4 adds uninstall that removes the launcher directory then the PATH shim.

## Decision

tool on PATH is installed copy under ~/.rule-mcp/launcher/, not path into any checkout. setup writes copy, current pointer, installed.json, and resolution shim. Uninstall removes ~/.rule-mcp/launcher/ before shim. Developer edits stay live only through documented fallback when current is missing and recorded checkout entry still exists. Claiming checkout itself is PATH target is out of scope.

## Consequences

Positive: branch switches no longer disable every gate that calls rule-mcp by name; doctor can name the live target; uninstall cannot leave a shim aimed at a deleted directory. Negative: disk cost of one deploy-sized copy (~85 MB); a stale copy can keep running until the next setup, which doctor and the skip log surface.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. pnpm link --global
1. Symlink PATH to `<checkout>`/bin/rule-mcp.js
1. Keep naming checkout from shim and only improve error codes
