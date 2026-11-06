# 227: Close host integration depth with deferred per-host token measurement

- **Date**: 2026-10-30
- **Status**: accepted
- **Tags**: architecture, installer, hooks, measurement
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Workstream WS-on plan-of-plans closes docs/plans/_mcp-host-integration-depth.md. Phases 0-6 and measured hook-cost path (ADR 178-189: skip bootstrap for guard, no --loop in host writers, daemon plus guard --send) already landed. Two Phase 5 checkboxes remained open in plan text: (1) hook process-cost item whose nested evidence already records daemon wiring as complete, and (2) tokens-per-turn on claude, codex and pi. Nothing in this repository drives those three agents end to end, so per-host figure would be invented. 2026-10-25 idle-floor spawn story was remasured 2026-10-27 and does not decide further levers.

## Decision

Mark mcp-host-integration-depth done at 37/37. Treat hook-cost checkbox as closed by daemon path already accepted in ADR 178-189. Explicitly defer per-host token measurement on claude, codex and pi until in-repo E2E host driver exists; until then shared floor is in-repo bench (hook-lifecycle and guard-daemon spikes), not claimed per-host number. Residual ownership of deferral lives in this ADR and in plan-of-plans WS-closeout notes, not as open plan checkbox.

## Consequences

Positive: WS-A can finish; plan-of-plans can advance to WS-B without a forever-open host checkbox; readers see the deferral as an ADR decision rather than unfinished work. Negative: no per-host token/turn evidence until an E2E driver lands; any future claim of claude/codex/pi token cost must cite a new measurement, not this closeout.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave plan in-progress at 35/37 until someone builds E2E host driver
1. Invent per-host token numbers from shared bench floor
1. Open new plan solely for per-host measurement
