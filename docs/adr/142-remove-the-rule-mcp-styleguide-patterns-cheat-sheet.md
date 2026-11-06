# 142: Remove the rule-styleguide-patterns cheat sheet

- **Date**: 2026-10-18
- **Status**: accepted
- **Tags**: skills, styleguide, duplication, breaking
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

skill was 211-line cheat sheet that copied content from six owners: rule-styleguide-naming, rule-styleguide-file-tree, rule-styleguide-html, rule-styleguide-css, rule-styleguide-javascript and rule-styleguide-a11y, plus unicorn idioms owned by rule-toolchain-eslint. Every section existed elsewhere, internal title was rule-styleguide name rather than its own, and it had no guardrails. It was clearest duplication in styleguide area.

## Decision

Delete skill. Replace its references with owner set: architect and simplicity personas carry six styleguide owners in their evidence skills, rule-process-simplicity points at file tree and naming skills, and router rows go away. Remove tool, framework-map entry, content-test block and flex-first carrier entry, then regenerate census. catalog drops to 87 skills, tool surface to 108 and resources to 182.

## Consequences

Clients that call rule_tool_styleguide_patterns break. snippets content test asserted are already covered by rule-styleguide-javascript, so no rule is lost. two historical ADRs that mention cheat sheet keep their text, because repository treats ADRs as immutable; new record is place that says skill is gone.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep it as generated quick reference rebuilt from owners
1. Keep it as curated index of links with no copied rules
1. Fold it into rule-styleguide router
