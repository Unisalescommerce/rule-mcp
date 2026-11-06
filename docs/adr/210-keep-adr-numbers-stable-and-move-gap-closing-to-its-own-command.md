# 210: Keep ADR numbers stable and move gap-closing to its own command

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: adr, numbering, handoff, docs
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The close-session sweep numbers pending ADRs and compacts the sequence. `planRenumber` in `packages/mcp/core/docs-numbering/_plan.js` closes every hole by moving each later document down: this tree has 9 holes (2 after 006, 1 after 009, 5 after 012, 1 after 154), so one sweep moved 235 files and shifted every ADR from 013 up by nine (214 became 205). `_apply.js` rewrites references only as markdown links under `docs/`, so prose citations such as `ADR 205` in `docs/plans/plan-of-plans.md` and `ADR 049` in `packages/mcp/tools/adr/_english.js` kept the old numbers. One default run of the handoff left the tree with 497 changed paths and citations that point at the wrong record.

## Decision

Two rules. First, the sweep numbers a pending ADR at the highest number in its family plus one and never renumbers a document that already has a number. A sweep cannot move an existing file, so no citation goes stale. Second, closing the gaps is a separate explicit command that never runs inside a handoff or a closeout. That command rewrites every citation form in the tree, not only markdown links: the link `[214](214-slug.md)`, the bare filename `214-slug.md`, and the prose form `ADR 205` or `ADR 205/218`, across `docs/`, `packages/`, `skills/` and `scripts/`. It refuses to finish when a citation still resolves to a different record, and it reports the count of rewritten citations.

## Consequences

Positive: a sweep stays additive, so a handoff can archive a plan without rewriting the corpus. A citation resolves to the same decision before and after the run. Positive: the gaps stay visible in `handoff doctor`, which already names them, instead of being closed by a silent move. Negative: the sequence keeps 9 holes until somebody runs the dedicated command. Negative: two commands to maintain instead of one, and the citation rewrite has to understand the prose form the code uses.

## What would end this

The corpus reaches zero gaps without any citation outside `docs/` being rewritten. That would mean the prose form never occurs in practice and the separate command protects nothing.

## Alternatives Considered

1. Keep compaction in the sweep and extend the rewrite to the whole tree. Rejected: the rewrite is not the hard part, identity churn is. Every number a person, a commit message or an external document cites changes at once, and the run is not reversible from the diff.
1. Freeze numbering and accept the 9 gaps forever. Rejected: a gap costs nothing, but a duplicate number costs a wrong decision. Pending ADRs still need a number, and max+1 gives them one without touching the rest.
1. Number pending ADRs by filling the holes, newest first. Rejected: the holes sit between 006 and 154, so a pending record written in 2026 would take a number that reads as older than the ones around it.
