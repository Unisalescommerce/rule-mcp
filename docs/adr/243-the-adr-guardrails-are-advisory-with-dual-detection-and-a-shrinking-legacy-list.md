# 243: The ADR guardrails are advisory with dual detection and a shrinking legacy list

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: adr, guardrails, design, ai
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-process-adr measured that the skill has no guardrails directory and that its six rules would fail on the repository's own ADRs if they arrived without an allowlist. The tool already refuses a bad write, so a rule that duplicates it must explain a file that arrived some other way.

## Decision

1. Six rules, all Tier B (advisory): naming, status vocabulary, author line, ends-when, derived index and English. None blocks: an ADR is a record, and a person fixes it.
2. Dual detection. Header fields are parsed (status, author); slug, sections and the supersede pair are read as text patterns; the index check is handed the file list instead of reading the directory itself.
3. Rule files live in `skills/rule-process-adr/guardrails/`, one file per rule plus a barrel, in the shape `rule-process-ai` already uses, with the ids declared in the skill frontmatter.
4. Legacy offenders are listed in `scripts/data/adr-legacy.data.mjs`, seeded from the measured numbers, and the suite asserts the list only shrinks.
5. English is checked again here on purpose: the tool refuses a non-English write, and the rule explains a file that arrived by paste.

## Consequences

The rules land with their corpus and a red-first suite. A hand-written ADR gets a named fix, and the repository's own history is excused until each entry is repaired. The plan's Phase 3 tool support (ends-when, alternatives, supersede validation) makes two of the six rules stricter.

## What would end this

An ADR that a person had to fix where the rule stayed silent, or a legacy list that grows because a new offender cannot be repaired without changing the rule.

## Alternatives Considered

1. Make the rules blocking: an advisory rule that a person can read and fix beats a gate that blocks an ADR arriving from another agent.
1. Detect everything from prose: a heading regex cannot tell a status value from a sentence about status.
1. One detection path, in the tool: the tool refuses writes but cannot see a file that arrived by paste or by another agent.
1. No legacy list: the six rules would fail on the repository's own history on the day they land.
