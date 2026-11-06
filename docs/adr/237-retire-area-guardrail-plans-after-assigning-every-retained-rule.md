# 237: Retire area guardrail plans after assigning every retained rule

- **Date**: 2026-11-05
- **Status**: accepted
- **Tags**: plans, guardrails, catalog
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 166 removed six area-level guardrail plans from the executable catalog, but verification found that only the AI rule set had moved into skill plans. The backend, data, devops, frontend, and meta plans still held 68 rule IDs with no explicit owner in the replacement plans.

## Decision

Assign all 76 retained rule IDs to explicit owning skill plans, guard the mapping with a plan test, then delete the six area-level plan files and remove their references from the catalog. ADRs 136 through 141 remain the rationale records for the proposed rule families.

## Consequences

Positive: deletion no longer loses executable backlog, and each retained rule has one skill-plan owner. Positive: the catalog has one planning surface per skill. Negative: detailed retired prose is available only in Git history, while current plans keep identifiers, ownership, and executable phases.

## What would end this

A retained rule ID is intentionally removed or reassigned through a later accepted decision, and the ownership regression test changes with that decision.

## Alternatives Considered

1. Delete all six plans immediately and accept losing 68 unassigned rule IDs.
1. Keep all six superseded plans indefinitely as duplicate executable backlogs.
1. Delete only the AI plan and postpone the other five.
