# 229: Restore rule-adr because it binds ADR write to decision-cache keep

- **Date**: 2026-10-30
- **Status**: accepted
- **Tags**: export, adr, prompts, decision-cache
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Handoff 13 removed /rule-adr as duplicate of rule_tool_process_adr / rule-process-adr. Export v1 needs durable choice in export-owned decision-cache after ADR is written. Bare rule_tool_process_adr only records ADR file; it does not call keepDecision. Without product prompt that sequences both, agents either skip keep or invent second path.

## Decision

Restore /rule-adr as session prompt whose body drives rule_tool_process_adr and then offers /rule-keep (rule_tool_keep) so accepted choice is stored confirmed in decision-cache.json. This is not duplicate of ADR engine: product value is bind to export decision-cache. Hook short-circuit from that cache remains out of scope.

## Consequences

Positive: one command teaches the ADR+keep coupling; export interview and keep share one cache. Negative: surface grows by one prompt; census and command installers must list it; agents that only want an ADR file may still use rule_tool_process_adr directly.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep /rule-adr removed and document that agents must chain process_adr + rule_tool_keep manually
1. Fold keep into rule_tool_process_adr itself
1. Invent separate rule_tool_adr_keep tool
