# 187: Guard skips core-tool bootstrap; optional persistent --loop

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: cli, performance, hooks, architecture
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Host hooks spawn `rule-mcp guard` on every prompt. The CLI preAction hook always called bootstrapCoreTools (gateway + apply), which guard never uses. Phase 5 remasure and scripts/bench/hook-spawn-spike.mjs showed spawn floor ~40-55 ms and that a daemon-shaped in-process call is ~0.1 ms after cold import; bootstrapping core tools on the guard path was pure wall time.

## Decision

1) shouldBootstrapCoreTools returns false when the Commander action command is named guard, so preAction skips bootstrapCoreTools for that command only. 2) guard gains an optional --loop that reads NDJSON lines and answers one JSON object per line via runGuard({ payload }), keeping one warm process. Host hook writers stay on per-spawn until a later rewire measures the install path.

## Consequences

Positive: every guard spawn avoids registering gateway/apply; --loop exists for hosts that can keep a pipe open; tests lock the skip and the loop framing. Negative: --loop is unused by installers until rewired; two answer shapes (single JSON vs NDJSON lines) must stay documented; other CLI commands still pay bootstrap.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Thin dedicated bin that only imports runGuard (marginal once bootstrap is skipped; still pays spawn)
1. Always-on guard daemon service like the MCP daemon (larger surface; host rewire required before any win)
1. Leave bootstrap on every command for uniformity (measured cost with no benefit for guard)
