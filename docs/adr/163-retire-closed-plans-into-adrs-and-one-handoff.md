# 163: Retire closed plans into ADRs and one handoff

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: plans, process, governance, docs
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`docs/plans` holds 100 Markdown files: two closed plans (`plan-of-plans.md`, `_plan-of-plans-reference.md`), two catalog documents (`skills/README.md`, `skills/DEPENDENCIES.md`), 10 open non-skill plans (146 open boxes) and 86 open skill plans (1,336 open boxes). reference carries eight more follow-ups. plan-of-plans is `Status: done`; other 98 plan files are not. user chose to retire only closed plans and keep open roadmap.

## Decision

Turn each closed plan into an ADR: 170 for the plan-of-plans, 171 for the reference. Add one handoff, 27, that indexes every plan and carries the eight reference follow-ups. Delete only the two closed plan files. Keep the 96 open plans and the two catalog documents. Delete the plan-of-plans test and its cross-branch helper; keep the skills plan test. Regenerate the ADR and handoff indexes with the docs-numbering doctor. The release PR #9 remains a separate release; the plan-of-plans and reference were already excluded from it.

## Consequences

closed decisions are durable ADRs; open roadmap stays in place with 1,490 open items (146 non-skill, 1,336 skill, 8 reference follow-ups), indexed by handoff 27. plan-of-plans and reference paths disappear from `feat/evolution`; their links in historical reviews, ADRs and open plans remain as historical text, which release tree already tolerated. five pre-existing file-size offenders remain, including `tests/plans/skills-plan.test.mjs`.

## What would end this

policy would change if closed plan could not be compressed into ADR without losing decision, or if open plan had to be deleted before its work shipped. observation is ADR that cannot state plan's context, decision and consequences.

## Alternatives Considered

1. Delete every plan (1,490 open items would lose their detail)
1. Keep every plan (closed files would stay as stale competition for handoff)
1. Delete only closed files without ADRs (decisions would be lost)
