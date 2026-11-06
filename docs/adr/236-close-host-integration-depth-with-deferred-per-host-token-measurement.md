# 236: Close host integration depth with deferred per-host token measurement

- **Date**: 2026-10-30
- **Status**: accepted
- **Tags**: architecture, installer, hooks, measurement
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Workstream WS-A on plan-of-plans closes docs/plans/_mcp-host-integration-depth.md. Phases 0-6 and the measured hook-cost path (ADR 187-189: skip bootstrap for guard, no --loop in host writers, daemon plus guard --send) already landed. Two Phase 5 checkboxes remained open in the plan text: (1) the hook process-cost item whose nested evidence already records the daemon wiring as complete, and (2) tokens-per-turn on claude, codex and pi. Nothing in this repository drives those three agents end to end, so a per-host figure would be invented. The 2026-10-25 idle-floor spawn story was remasured 2026-10-27 and does not decide further levers.

## Decision

Mark mcp-host-integration-depth done at 37/37. Treat the hook-cost checkbox as closed by the daemon path already accepted in ADR 187-189. Explicitly defer per-host token measurement on claude, codex and pi until an in-repo E2E host driver exists; until then the shared floor is the in-repo bench (hook-lifecycle and guard-daemon spikes), not a claimed per-host number. Residual ownership of the deferral lives in this ADR and in plan-of-plans WS-A closeout notes, not as an open plan checkbox.

## Consequences

Positive: WS-A can finish; plan-of-plans can advance to WS-B without a forever-open host checkbox; readers see the deferral as an ADR decision rather than unfinished work. Negative: no per-host token/turn evidence until an E2E driver lands; any future claim of claude/codex/pi token cost must cite a new measurement, not this closeout.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave the plan in-progress at 35/37 until someone builds an E2E host driver
1. Invent per-host token numbers from the shared bench floor
1. Open a new plan solely for per-host measurement
