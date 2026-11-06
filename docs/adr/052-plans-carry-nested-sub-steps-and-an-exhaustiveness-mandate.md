# 052: Plans carry nested sub-steps and an exhaustiveness mandate

- **Date**: 2026-09-07
- **Status**: accepted
- **Tags**: documentation, personas, plans
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 051 made persona plans checklists, but every step was one flat line: step hiding five
actions ("rename, update links, fix writers, add test number, run gates")
could only be marked done as whole, and its detail lived in prose blob. Runs also tended
to produce uniformly short roadmaps - nothing in machinery caps step count, but
nothing in persona contract demanded more either, so plans read like summaries instead
of development-ready documents 25-to-30-year expert would hand over.

## Decision

finding passed to `rule_tool_plan_docs` may carry `steps` array; renderer nests each
entry as `  - [ ] **N.M**: <action>` under its step, and `planCheckedIds` keys sub-step marks
as `id#M` so marked sub-step survives sync exactly like marked step. persona
plan contract (filled role template and tool's follow-up text) now states the
expectation explicitly: as many steps as the findings demand - no fixed count - each split
into sub-steps whenever it hides more than one action, naming files, commands and
gate that proves step done.

## Consequences

Positive: execution is trackable at the action level, plans are development-ready documents
rather than summaries, and uncapped-steps expectation is written where every persona
reads it. Negative: sub-step marks are keyed by ordinal, so reordering finding's `steps`
array between runs re-derives marks below it; parser gains second line shape.

## What would end this

Task tracking moving out of plan files entirely (issues, task tools), making in-file
sub-step marks redundant.

## Alternatives Considered

1. Free-form nested bullets without `N.M` key - unparseable, so marks could not survive
   sync.
1. separate tasks file per plan - two files to drift apart instead of one that cannot.
