# 201: Close out plan _rule-mcp-process-ai

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/skills/process/_rule-mcp-process-ai.md, "rule-process-ai - best-practice implementation plan", finished with 23 closed items.

## Outcome

- Rename directory and tool.
- Move three bodies into references/.
- Move and rename nine guardrails into one family.
- Rewrite SKILL.md with ownership map, scope contract and reference table.
- Delete three directories and extend removedSkillNames.
- Correct rule-process and rule-styleguide tables and central index row.
- Regenerate census and README counts (84 skills, 105 tools, 176 resources).
- Re-measure routing corpus and restore scope vocabulary to SKILL.md.
- Delete three absorbed plans and collapse index to one row.
- Move organizational essay out of references/simplicity.md into lifecycle body, where it belongs.
- Document reduction signal and add its corpus test.
- Narrow the -ogue stem and extend spelling map in src/core/fingerprint.js.
- Name file-size test and ADRs that govern cap (057 splitting, 058 ratchet) in simplicity reference.
- Failing corpus cases first for ai-bidi-controls, one good and one bad.
- Implement ai-bidi-controls as blocking, with its fixture.
- Add advisory set from Workstream B one rule at time, each with its own corpus pair: ai-no-emoji, ai-nfc-text, ai-repeated-opener, ai-structural-tells (plus ai-bidi-controls, which landed blocking in Phase 2).
- Three B rules are settled: ai-plain-sentence-length ships with 25-word cap STE100 sets for descriptive sentence; ai-identifier-english stays covered by ai-english-only-prose, whose dictionary grows on real miss rather than preemptively; ai-terminology-consistency is dropped until glossary exists. decision is owed as ADR at next handoff.
- Regenerate docs/15-guardrails.md with pnpm census. It counts shared registry (9 rules), not skill-owned families, so rules this plan added are documented in skill's own table and reference; extending census to skill families is separate change nobody asked for.
- Add router-child-coverage test for every area router.
- Fix rows it reports, and record in DEPENDENCIES.md any area that has to wait for leaf.
  -...and 3 more step(s) in closed record.

The three the renderer truncated: the Phase 4 gates (corpus, routing corpus, reminder, enforcement and docs-accuracy green, `pnpm census:check` current; `pnpm lint` is red repo-wide on files this plan never touched), the persona check (`packages/mcp/core/review/template/_operation.js` points at `rule-process-ai`), and the changelog announcement (generated at release, with ADR 140 naming the tool rename).

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-ai.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
