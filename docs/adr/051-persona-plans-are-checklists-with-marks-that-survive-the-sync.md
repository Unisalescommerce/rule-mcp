# 051: Persona plans are checklists with marks that survive the sync

- **Date**: 2026-09-07
- **Status**: accepted
- **Tags**: documentation, personas, plans
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`rule_tool_plan_docs` rendered `docs/plans/<role>.md` as markdown table (Step, Finding,
Severity, What it takes). table cannot record execution: nothing marks step as done, so
progress lived only in reader's head, while hand-maintained
`docs/plans/execution-plan.md` already tracked its phases with `- [ ]` checkboxes and proved
affordance works. Worse, plan is re-derived from open findings on every sync, so any
ad-hoc mark someone added would have been erased by next run.

## Decision

The plan renderer emits a checklist instead of a table: one
`- [ ] **Step N - <finding-id> (<severity>)**: <what it takes>` item per open finding, worst
first, under `## Steps` heading - metadata of old table folded into item's bold
prefix. `planFindingIds` reads both checklist and legacy table so validateTrio
gate keeps working across transition, and new `planCheckedIds` feeds sync: step
marked `[x]` stays marked while its finding is open, and disappears with finding. The
audit and review keep their tables - they are data, not work to tick off.

## Consequences

Positive: executed steps are markable in place, the mark survives re-syncs, and every
persona plan reads like execution-plan.md. Negative: one more parser shape to maintain, and
hand-combined step (`**Step 1 - DOC-1, DOC-2 (high)**`) must keep id list inside the
bold prefix for gate to see it.

## What would end this

plan surface that tracks execution outside file (issues, tasks), making in-file marks
redundant.

## Alternatives Considered

1. Keep table and add Status column - not clickable in editors and previews, and the
   sync would still have to parse cell text to preserve it.
1. separate checklist file beside plan - two files to drift apart instead of one that
   cannot.
