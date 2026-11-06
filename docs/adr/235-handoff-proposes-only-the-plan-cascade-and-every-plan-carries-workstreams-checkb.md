# 235: Handoff proposes only the plan cascade, and every plan carries workstreams, checkboxes and a graph

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: plans, handoff, dependency-graph, conventions
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Two gaps surfaced when the plan catalog was audited. The handon listed every open plan, top-level only, so 84 skill plans were invisible and a session could start work whose prerequisite was still open. And the plan generators were uneven: write_plan enforced workstreams and a graph, but the persona plan was a flat checklist with no graph, and nothing required a Markdown link to the references a plan leans on.

## Decision

1. Every handoff and handon reads the plan graph deterministically: all plans recursively, edges parsed from `Depends on:`, a dependency satisfied only when its plan has no open step or a closeout ADR retired it. Unknown edges and cycles are named, never guessed.
2. The proposal is the cascade frontier: open plans whose HARD edges are met, ordered by graph level then date, twelve at a time. A superseded plan and a plan with nothing open propose nothing. A blocked plan is counted, not offered.
3. Every retired plan leaves two documents: the ADR that holds the decision, and one handoff of its own under docs/handoff/plans/ that records the closure and points at the ADR.
4. Every plan is Markdown with workstreams, Markdown checkbox tasks, a `## Dependency graph` with a parseable edge list and a fenced diagram, and at least one link to a reference file. write_plan refuses a body that misses one and names the miss; the persona plan groups its findings into one workstream per severity and carries the same graph.

## Consequences

A handoff can no longer propose work out of order, and a plan that cannot be marked or does not point at its references is refused at write time. The cost is a stricter generator: every plan carries a graph, and the persona plan's shape changed, so an existing review plan is re-rendered on its next sync.

## What would end this

A plan graph where the hard edges cannot be parsed from the files themselves, or a plan whose work a checkbox cannot express, so the cascade and the checklist stop describing it.

## Alternatives Considered

1. Leave the graph out of the handoff and let a session pick work by hand: it started four plans whose prerequisites were still open.
1. Keep the old 'Next from the plans' list of every open plan: 88 proposals, no order, no blockers.
1. One session handoff for all retired plans: the closure of a plan was a line in a document about something else.
1. Let plan generators write free prose: a plan whose tasks are not checkboxes cannot be marked, and a plan with no link hides its references.
