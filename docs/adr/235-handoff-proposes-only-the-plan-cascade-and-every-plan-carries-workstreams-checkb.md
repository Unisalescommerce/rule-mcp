# 235: Handoff proposes only the plan cascade, and every plan carries workstreams, checkboxes and a graph

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: plans, handoff, dependency-graph, conventions
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Two gaps surfaced when plan catalog was audited. handon listed every open plan, top-level only, so 84 skill plans were invisible and session could start work whose prerequisite was still open. And plan generators were uneven: write_plan enforced workstreams and graph, but persona plan was flat checklist with no graph, and nothing needed Markdown link to references plan leans on.

## Decision

1. Every handoff and handon reads plan graph deterministically: all plans recursively, edges parsed from `Depends on:`, dependency satisfied only when its plan has no open step or closeout ADR retired it. Unknown edges and cycles are named, never guessed.
2. proposal is cascade frontier: open plans whose HARD edges are met, ordered by graph level then date, twelve at time. superseded plan and plan with nothing open propose nothing. blocked plan is counted, not offered.
3. Every retired plan leaves two documents: ADR that holds decision, and one handoff of its own under docs/handoff/plans/ that records closure and points at ADR.
4. Every plan is Markdown with workstreams, Markdown checkbox tasks, `## Dependency graph` with parseable edge list and fenced diagram, and at least one link to reference file. write_plan refuses body that misses one and names miss; persona plan groups its findings into one workstream per severity and carries same graph.

## Consequences

handoff can no longer propose work out of order, and plan that cannot be marked or does not point at its references is refused at write time. cost is stricter generator: every plan carries graph, and persona plan's shape changed, so existing review plan is re-rendered on its next sync.

## What would end this

plan graph where hard edges cannot be parsed from files themselves, or plan whose work checkbox cannot express, so cascade and checklist stop describing it.

## Alternatives Considered

1. Leave graph out of handoff and let session pick work by hand: it started four plans whose prerequisites were still open.
1. Keep old 'Next from plans' list of every open plan: 88 proposals, no order, no blockers.
1. One session handoff for all retired plans: closure of plan was line in document about something else.
1. Let plan generators write free prose: plan whose tasks are not checkboxes cannot be marked, and plan with no link hides its references.
