# 179: Guard daemon on a Unix socket with a thin --send client

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: cli, performance, hooks, architecture
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Host hooks spawn one process per event and close stdin, so guard --loop in hook command cannot keep warm process. Per-spawn exits cleanly (exit 0, no lingering). Latency remains ~100 ms for full CLI guard. shared stdio pipe across agents is not available from host contracts.

## Decision

Add guard --daemon listening on $RULE_MCP_HOME/state/guard.sock and guard --send which forwards one stdin payload over that socket. bin/rule-mcp.js early-dispatches guard --send before loading Commander so client stays near Node spawn floor. Host hook writers are not rewired yet: install still uses per-spawn guard until later change starts daemon and points commands at --send. Measured (scripts/bench/guard-daemon-spike.mjs): full guard ~115 ms; bin --send with warm daemon ~near thin client after dropping accidental _run.js import; thin sendGuardRequest alone ~spawn+5 ms.

## Consequences

Positive: a measured reuse path exists; writers can switch later; spawn lifecycle stays correct for the default path. Negative: someone must start --daemon (install/lazy-start not in this spike); stale socket after crash needs unlink on listen; two answer entry points to document.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Put --loop in every host hook command (false win; still one spawn; NDJSON framing risk)
1. Full CLI --send without early dispatch (measured equal to full guard; daemon unused)
1. Always-on MCP daemon reused for hooks (wrong process; different protocol)
