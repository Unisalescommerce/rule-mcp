# 176: Lifecycle wiring ships only where a measurement moves

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: hooks, performance, hooks-lifecycle
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

handoff recorded "MCP-performance lifecycle hooks inventory only; not implemented" as open gap, and host plan listed five wiring items to close it: warm on SessionStart, prefetch on UserPromptSubmit, invalidate on PostToolUse, overlay by additionalContext, and statusMessage on every hook. last two were already shipped (ADR 121, ADR 170). other three touch tool cache, whose behaviour decides whether they can pay: decision-cache replay is behind RULE_MCP_DECISION_CACHE_REPLAY and ADR 157 keeps it off, and cacheGet evicts entry whose dependencies moved on read that found it.

## Decision

Measure first, with scripts/bench/hook-lifecycle.mjs, and drop what does not move. Measured medians: session-start 891 ms and 1164 injected characters (~291 tokens), prompt-submit 1056 ms and 185 characters (~46 tokens), structure/write/bash 588-647 ms with 2-character silent allow. Prefetch rejected: replay is off, so warmed decision has no reader, and it would add work to hook that runs on every prompt. Warm rejected: hook process exits, so warming memory serves nobody. Invalidate rejected: cacheGet already evicts on read that finds dependency stale, which bench asserts rather than assumes. No environment switch was added, because nothing changed behaviour.

## Consequences

measured cost is process spawn, not context: bare node -e 0 takes 1.3-2.4 s under load here, so hook's own work is fraction of what every event pays. That produced new item plan did not have - hook's own process cost, with number to beat - and per-host token measurement on claude, codex and pi is recorded as not run, because nothing in this repository drives those agents end to end.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Implement all five behind RULE_MCP_HOST_LIFECYCLE and let switch be safety: rejected, because switch nobody flips is inventory-only gap wearing flag
1. Implement prefetch anyway, for day replay turns on: rejected, because replay is off by decision and reader would pay 1056 ms for it today
1. Keep eager invalidation as belt and braces: rejected, because it duplicates check that already runs and bench shows stale read is not served
