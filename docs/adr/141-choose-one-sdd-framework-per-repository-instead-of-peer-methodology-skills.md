# 141: Choose one SDD framework per repository instead of peer methodology skills

- **Date**: 2026-10-21
- **Status**: superseded by [143](143-open-a-rule-mcp-method-area-with-one-skill-per-methodology-framework.md)
- **Tags**: skills, process, bmad, methodology, guardrails
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-process-bmad mirrored BMAD upstream in 421 lines while 2026 landscape (BMAD, GitHub Spec Kit, OpenSpec, Kiro, GSD/Ralph/Task Master, plain AGENTS.md) offers alternative frameworks, not layers. old plan proposed one skill with chooser, but no rule measured dual-framework anti-pattern chooser warns about, and second pack ('.specify/') could appear next to '_bmad/' with nothing failing.

## Decision

Keep rule-process-bmad as single methodology skill. Its body stays structurally as it is for now; plan moves cut to references/ into deferred phase. In exchange skill accepts enforceable rules: repository may run one SDD framework, declared in FRAMEWORK.md when second pack is present. Spec Kit, OpenSpec and GSD are documented as alternatives inside this skill, never as peer skills in catalog, until routing corpus shows sustained demand for them.

## Consequences

One methodology skill, one ADR-visible policy, and rule that can fail. Cost: plan gains two phases before body is trimmed, so mirror lives while longer. Reversal is cheap - promoting Spec Kit later is another skill plus routing decision.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Add rule-process-spec-kit, rule-process-openspec and rule-process-gsd as peer skills (rejected: market treats these as alternatives; equal skills invite 'install both')
1. Delete rule-process-bmad and link upstream only (rejected: chooser is useful part, and deletion leaves router without methodology answer)
1. Keep skill unchanged and rely on prose warnings (rejected: warning with no rule is what shipped before and nothing measured it)
