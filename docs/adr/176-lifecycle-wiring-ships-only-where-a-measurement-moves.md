# 176: Lifecycle wiring ships only where a measurement moves

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: hooks, performance, hooks-lifecycle
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

A handoff recorded "MCP-performance lifecycle hooks inventory only; not implemented" as an open gap, and the host plan listed five wiring items to close it: warm on SessionStart, prefetch on UserPromptSubmit, invalidate on PostToolUse, overlay by additionalContext, and a statusMessage on every hook. The last two were already shipped (ADR 121, ADR 170). The other three touch the tool cache, whose behaviour decides whether they can pay: the decision-cache replay is behind RULE_MCP_DECISION_CACHE_REPLAY and ADR 157 keeps it off, and cacheGet evicts an entry whose dependencies moved on the read that found it.

## Decision

Measure first, with scripts/bench/hook-lifecycle.mjs, and drop what does not move. Measured medians: session-start 891 ms and 1164 injected characters (~291 tokens), prompt-submit 1056 ms and 185 characters (~46 tokens), structure/write/bash 588-647 ms with a 2-character silent allow. Prefetch rejected: replay is off, so a warmed decision has no reader, and it would add work to a hook that runs on every prompt. Warm rejected: the hook process exits, so warming memory serves nobody. Invalidate rejected: cacheGet already evicts on the read that finds the dependency stale, which the bench asserts rather than assumes. No environment switch was added, because nothing changed behaviour.

## Consequences

The measured cost is the process spawn, not the context: a bare node -e 0 takes 1.3-2.4 s under load here, so the hook's own work is a fraction of what every event pays. That produced a new item the plan did not have - the hook's own process cost, with the number to beat - and the per-host token measurement on claude, codex and pi is recorded as not run, because nothing in this repository drives those agents end to end.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Implement all five behind RULE_MCP_HOST_LIFECYCLE and let the switch be the safety: rejected, because a switch nobody flips is the inventory-only gap wearing a flag
1. Implement the prefetch anyway, for the day the replay turns on: rejected, because the replay is off by decision and a reader would pay 1056 ms for it today
1. Keep the eager invalidation as belt and braces: rejected, because it duplicates a check that already runs and the bench shows the stale read is not served
