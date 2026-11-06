# 234: The ADR guardrails are advisory with dual detection and a shrinking legacy list

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: adr, guardrails, design, ai
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-process-adr measured that skill has no guardrails directory and that its six rules would fail on repository's own ADRs if they arrived without allowlist. tool already refuses bad write, so rule that duplicates it must explain file that arrived some other way.

## Decision

1. Six rules, all Tier B (advisory): naming, status vocabulary, author line, ends-when, derived index and English. None blocks: ADR is record, and person fixes it.
2. Dual detection. Header fields are parsed (status, author); slug, sections and supersede pair are read as text patterns; index check is handed file list instead of reading directory itself.
3. Rule files live in `skills/rule-process-adr/guardrails/`, one file per rule plus barrel, in shape `rule-process-ai` already uses, with ids declared in skill frontmatter.
4. Legacy offenders are listed in `scripts/data/adr-legacy.data.mjs`, seeded from measured numbers, and suite asserts list only shrinks.
5. English is checked again here on purpose: tool refuses non-English write, and rule explains file that arrived by paste.

## Consequences

rules land with their corpus and red-first suite. hand-written ADR gets named fix, and repository's own history is excused until each entry is repaired. plan's Phase 3 tool support (ends-when, alternatives, supersede validation) makes two of six rules stricter.

## What would end this

ADR that person had to fix where rule stayed silent, or legacy list that grows because new offender cannot be repaired without changing rule.

## Alternatives Considered

1. Make rules blocking: advisory rule that person can read and fix beats gate that blocks ADR arriving from another agent.
1. Detect everything from prose: heading regex cannot tell status value from sentence about status.
1. One detection path, in tool: tool refuses writes but cannot see file that arrived by paste or by another agent.
1. No legacy list: six rules would fail on repository's own history on day they land.
