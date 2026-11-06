# 210: Keep ADR numbers stable and move gap-closing to its own command

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: adr, numbering, handoff, docs
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

close-session sweep numbers pending ADRs and compacts sequence. `planRenumber` in `packages/mcp/core/docs-numbering/_plan.js` closes every hole by moving each later document down: this tree has 9 holes (2 after 006, 1 after 009, 5 after 012, 1 after 154), so one sweep moved 235 files and shifted every ADR from 013 up by nine (214 became 205). `_apply.js` rewrites references only as markdown links under `docs/`, so prose citations such as `ADR 205` in `docs/plans/plan-of-plans.md` and `ADR 049` in `packages/mcp/tools/adr/_english.js` kept old numbers. One default run of handoff left tree with 497 changed paths and citations that point at wrong record.

## Decision

Two rules. First, sweep numbers pending ADR at highest number in its family plus one and never renumbers document that already has number. sweep cannot move existing file, so no citation goes stale. Second, closing gaps is separate explicit command that never runs inside handoff or closeout. That command rewrites every citation form in tree, not only markdown links: link `[214](214-slug.md)`, bare filename `214-slug.md`, and prose form `ADR 205` or `ADR 205/218`, across `docs/`, `packages/`, `skills/` and `scripts/`. It refuses to finish when citation still resolves to different record, and it reports count of rewritten citations.

## Consequences

Positive: a sweep stays additive, so a handoff can archive a plan without rewriting the corpus. A citation resolves to the same decision before and after the run. Positive: the gaps stay visible in `handoff doctor`, which already names them, instead of being closed by a silent move. Negative: the sequence keeps 9 holes until somebody runs the dedicated command. Negative: two commands to maintain instead of one, and the citation rewrite has to understand the prose form the code uses.

## What would end this

corpus reaches zero gaps without any citation outside `docs/` being rewritten. That would mean prose form never occurs in practice and separate command protects nothing.

## Alternatives Considered

1. Keep compaction in sweep and extend rewrite to whole tree. Rejected: rewrite is not hard part, identity churn is. Every number person, commit message or external document cites changes at once, and run is not reversible from diff.
1. Freeze numbering and accept 9 gaps forever. Rejected: gap costs nothing, but duplicate number costs wrong decision. Pending ADRs still need number, and max+1 gives them one without touching rest.
1. Number pending ADRs by filling holes, newest first. Rejected: holes sit between 006 and 154, so pending record written in 2026 would take number that reads as older than ones around it.
