# 159: Insert a quick-start chapter and shift the handbook numbering

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: docs, handbook, process
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

handbook opened with install and architecture and reached engineering guides at chapter 07. Those guides are deep, repository-internal reference: engineering loop, guardrails, docs pipeline, and measured numbers. reader who only wanted to use server had no shallow page that showed init, check, fix, handoff/handon, personas, cache, and decision layer in one place. Stage 3.5 of plan of plans asked for that page before deep guide, and numbered handbook cannot carry two chapters numbered 07.

## Decision

Create docs/07-quick-start.md as shallow entry and shift existing chapters 07-16 to 08-17. engineering guides become chapter 08 and keep their depth; generated inventories become chapters 09-17, so generated documents remain tail of sequence that tests/docs/docs-handbook-numbering.test.mjs asserts. Update README index, every live cross-reference, census generators and their markers, docs-site routes and tests, tool-surface test, and pre-commit hook. Historical ADRs and handoffs keep paths they recorded; live plans follow new numbers. Add tests/docs/quick-start.test.mjs to hold chapter number, eight flows, link to deep guide, and index row.

## Consequences

reader gets short, practical entry before deep guide, and sequence stays gapless from 01 to 17. generated documents still occupy tail, so numbering test keeps its invariant. cost is one-time reference sweep: any new document inserted before generated tail must repeat it. change is documentation-only and does not alter runtime surface. Historical records remain readable at their original numbers, which can differ from current handbook; live index is authority.

## What would end this

split stops paying if quick-start grows into second copy of engineering guides, or if readers skip it and deep guide's flows drift out of sync. handbook that no longer enforces gapless numbering, or index that stops listing every chapter, would also make arrangement wrong. In that case fold quick-start back into chapter 08 and keep one entry rather than maintain two sources for same flows.

## Alternatives Considered

1. Append quick-start after generated inventories: preserves existing numbers but hides shallow entry at end of handbook.
1. Replace engineering guides with quick-start: removes deep reference repository workflow depends on.
1. Keep quick-start unnumbered outside sequence: avoids sweep but breaks index and gapless-numbering invariant.
