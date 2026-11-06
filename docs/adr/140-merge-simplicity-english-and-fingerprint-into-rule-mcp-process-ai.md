# 140: Merge simplicity, English and fingerprint into rule-process-ai

- **Date**: 2026-10-20
- **Status**: accepted
- **Tags**: skills, process, guardrails, naming, breaking
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Four skills described one body of rules. rule-process-ai-sdlc carried lifecycle and owned no guardrail; rule-process-simplicity carried scope contract and three rules; rule-styleguide-english and rule-styleguide-fingerprint both documented British to American spelling map and both claimed fp-american-english. same rule in two documents is drift ADR 050 exists to prevent, and four index rows and three plans meant four places to keep in step. English and fingerprint skills also sat in styleguide area while describing prose that applies to every output, not to code style.

## Decision

One skill, rule-process-ai, owns four bodies: SKILL.md keeps lifecycle, scope contract and reference table, and references/simplicity.md, references/english.md and references/fingerprint.md hold detail, shape rule-styleguide-a11y already uses. nine guardrails move into one family under ai- prefix. name changes from rule-process-ai-sdlc, and because tool id is derived from skill name, tool becomes rule_tool_process_ai. three absorbed directories are deleted rather than tombstoned: their names join removedSkillNames in skill corpus test, so surviving reference fails suite instead of rotting. four plan rows collapse into one, docs/plans/skills/DEPENDENCIES.md records run order, and this plan runs first because every other plan is written by these rules.

## Consequences

Positive: one owner per rule; the spelling map exists once; a scope or prose change lands in one file; the ranker sees the scope vocabulary in SKILL.md, which is the file it indexes. Negative: rule_tool_process_ai_sdlc no longer exists, so an external client has to follow the rename; the skill is 218 lines plus 498 in references, which a reader has to know to open; and moving a body into references removes it from the routed text, which cost one routing regression until the scope contract was restated in SKILL.md. Neutral: the surface drops to 84 skills and 105 tools, and the census and README counts follow from the registry rather than from a hand edit.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep three as thin tombstones that point at merged skill. Rejected: index row and directory that carry no content are exactly two things that go stale, and corpus test can already name removed skill.
1. Merge content but keep four guardrail prefixes (en-, fp-, no-) so nothing has to be renamed. Rejected: family whose ids name three different former owners is family nobody can enumerate.
1. Rename skill and keep rule_tool_process_ai_sdlc as alias. Rejected: tool registry derives id from name, and hand-maintained alias is second name to keep in step, which is problem this ADR removes.
