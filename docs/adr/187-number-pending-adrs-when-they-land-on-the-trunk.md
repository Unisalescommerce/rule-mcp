# 187: Number pending ADRs when they land on the trunk

- **Date**: 2026-10-28
- **Status**: accepted
- **Tags**: architecture, docs, adr
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Feature branches writing immediately-numbered ADRs collide when two people land the same pull. Mid-task spam was already gated by ADR policy (handoff default); numbering still raced on merge.

## Decision

Off trunk, rule_tool_process_adr writes docs/adr/_pending/<slug>.md referred to as ADR <slug>. On trunk, rule-mcp handoff land (also post-merge/post-rewrite and handoff closeout) assigns the next free numbers in first-add order (slug tie-break), rewrites references, and regenerates ADR.md. Off trunk, settle pulls duplicate numbers back to _pending. Generated indexes use a merge driver that regenerates instead of merging.

## Consequences

Positive: deterministic numbers across parallel landings; squash falls back to alphabetical slug order. Negative: release branches that are not main/master/develop keep writing pending until merged to a trunk; existing numbered ADRs on rel/* stay as they are.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep numbering on every branch and renumber on merge (more rewrite churn)
1. Reserve number ranges per branch (coordination overhead)
