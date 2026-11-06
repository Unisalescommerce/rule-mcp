# 146: Every plan carries a status line, a dependency graph and checkbox steps

- **Date**: 2026-10-21
- **Status**: accepted
- **Tags**: plans, convention, format, governance, testing
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

83 plan files were written across eleven areas over several sessions. Each one invented its own head: some say 'Status: plan only', some say nothing, four have heading that mentions dependencies, none has graph, and checkbox step is only convention that survived because it was useful immediately. test cannot verify convention that does not exist, and executor cannot pick next plan from prose.

## Decision

plan file carries, in this order: H1; status line with one of five values (planned, in-progress, done, blocked, superseded) plus reason when it is blocked or superseded; a '## Dependency graph' section with free prose plus three parseable lines - Depends on, Feeds, Shared files; and checkbox steps in form - [ ] while open and - [x] when closed, lowercase x, no other marker form. progress table in _skills-plan.md keeps one row per node and verification test recomputes it, so stale row fails. node is done when its boxes are closed and gates its own plan declares have run; nothing else is needed.

**Amendment 2026-10-21 (finding F5 of `docs/reviews/plan-graph.md`):** plan that
lives inside branch carries four lines - `Depends on:`, `Feeds:`, `Shared files:`

- while document that coordinates plans across branches also carries
  `Branch:` and `Path:`. owner's decision was conditional form: six lines
  where node must be findable from another branch, four where file's location
  already says everything. `plan-of-plans.md` on `main` is six-line case.
  `CONTRACT` edge names phase (`target#2`) and is exempt from rule that a
  dependency sits in earlier stage, because what closes first is phase.

**Amendment 2026-10-31 (ASD-STE100 WS3):** an **AI-assisted development plan**
(usually `docs/plans/_*.md`, coordinated by `plan-of-plans.md`) also
carries: workstreams `WS1`..`WSn` (or `WS-A`.. when the level-0 index already uses
letters); tasks `WSi-Tj` and nested `WSi-Tj.k`; and a **dual** dependency graph -
parseable list (or edge table) **and** fenced text diagram. One workstream
owns given file set; `CONFLICT` edges serialize writers. Persona trio plans
under `docs/plans/<role>.md` remain finding checklists (ADR 59) and are not
needed to use WSn ids. scanner lives in `src/core/plans/_shape.js`
(`scanDevelopmentPlanShape`, `DEVELOPMENT_PLAN_SHAPE_GUIDE`).

## Consequences

verification test can assert format, so plan written next month fails instead of drifting. Cost: 83 files need head and graph section, added stage by stage as their work begins, and five status values are one more thing to get right on every commit. status line also makes 'blocked' explicit, which is state nine plans are in today without saying so.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Three parseable lines with no prose (rejected: prose is where reason for edge lives, and bare edge list invites deleting it)
1. machine-readable table of edges in every plan (rejected: 83 tables to maintain by hand, and orchestrator already holds graph)
1. Generate status line and graph section from _skills-plan.md (rejected: plan is record; orchestrator is summary, and reversing that makes every edit two-file edit)
1. Uppercase - [X] as closed marker (rejected: every existing file uses lowercase and test normalizes anyway)
