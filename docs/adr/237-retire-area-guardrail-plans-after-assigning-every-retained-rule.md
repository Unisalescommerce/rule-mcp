# 237: Retire area guardrail plans after assigning every retained rule

- **Date**: 2026-11-05
- **Status**: accepted
- **Tags**: plans, guardrails, catalog
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 166 removed six area-level guardrail plans from executable catalog, but verification found that only AI rule set had moved into skill plans. backend, data, devops, frontend, and meta plans still held 68 rule IDs with no explicit owner in replacement plans.

## Decision

Assign all 76 retained rule IDs to explicit owning skill plans, guard mapping with plan test, then delete six area-level plan files and remove their references from catalog. ADRs 136 through 141 remain rationale records for proposed rule families.

## Consequences

Positive: deletion no longer loses executable backlog, and each retained rule has one skill-plan owner. Positive: the catalog has one planning surface per skill. Negative: detailed retired prose is available only in Git history, while current plans keep identifiers, ownership, and executable phases.

## What would end this

retained rule ID is intentionally removed or reassigned through later accepted decision, and ownership regression test changes with that decision.

## Alternatives Considered

1. Delete all six plans immediately and accept losing 68 unassigned rule IDs.
1. Keep all six superseded plans indefinitely as duplicate executable backlogs.
1. Delete only AI plan and postpone other five.
