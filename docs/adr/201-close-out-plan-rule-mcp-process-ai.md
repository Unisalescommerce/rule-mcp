# 201: Close out plan _rule-mcp-process-ai

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/skills/process/_rule-mcp-process-ai.md, "rule-process-ai - best-practice implementation plan", finished with 23 closed items.

## Outcome

- Rename the directory and the tool.
- Move the three bodies into references/.
- Move and rename the nine guardrails into one family.
- Rewrite SKILL.md with the ownership map, the scope contract and the reference table.
- Delete the three directories and extend removedSkillNames.
- Correct the rule-process and rule-styleguide tables and the central index row.
- Regenerate the census and the README counts (84 skills, 105 tools, 176 resources).
- Re-measure the routing corpus and restore the scope vocabulary to SKILL.md.
- Delete the three absorbed plans and collapse the index to one row.
- Move the organizational essay out of references/simplicity.md into the lifecycle body, where it belongs.
- Document the reduction signal and add its corpus test.
- Narrow the -ogue stem and extend the spelling map in src/core/fingerprint.js.
- Name the file-size test and the ADRs that govern the cap (057 splitting, 058 ratchet) in the simplicity reference.
- Failing corpus cases first for ai-bidi-controls, one good and one bad.
- Implement ai-bidi-controls as blocking, with its fixture.
- Add the advisory set from Workstream B one rule at a time, each with its own corpus pair: ai-no-emoji, ai-nfc-text, ai-repeated-opener, ai-structural-tells (plus ai-bidi-controls, which landed blocking in Phase 2).
- Three B rules are settled: ai-plain-sentence-length ships with the 25-word cap STE100 sets for a descriptive sentence; ai-identifier-english stays covered by ai-english-only-prose, whose dictionary grows on a real miss rather than preemptively; ai-terminology-consistency is dropped until a glossary exists. The decision is owed as an ADR at the next handoff.
- Regenerate docs/15-guardrails.md with pnpm census. It counts the shared registry (9 rules), not the skill-owned families, so the rules this plan added are documented in the skill's own table and reference; extending the census to skill families is a separate change nobody asked for.
- Add the router-child-coverage test for every area router.
- Fix the rows it reports, and record in DEPENDENCIES.md any area that has to wait for a leaf.
- ...and 3 more step(s) in the closed record.

The three the renderer truncated: the Phase 4 gates (corpus, routing corpus, reminder, enforcement and docs-accuracy green, `pnpm census:check` current; `pnpm lint` is red repo-wide on files this plan never touched), the persona check (`packages/mcp/core/review/template/_operation.js` points at `rule-process-ai`), and the changelog announcement (generated at release, with ADR 140 naming the tool rename).

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-ai.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
