# 238: Restore rule-adr because it binds ADR write to decision-cache keep

- **Date**: 2026-10-30
- **Status**: accepted
- **Tags**: export, adr, prompts, decision-cache
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Handoff 13 removed /rule-adr as a duplicate of rule_tool_process_adr / rule-process-adr. Export v1 needs a durable choice in the export-owned decision-cache after an ADR is written. Bare rule_tool_process_adr only records the ADR file; it does not call keepDecision. Without a product prompt that sequences both, agents either skip the keep or invent a second path.

## Decision

Restore /rule-adr as a session prompt whose body drives rule_tool_process_adr and then offers /rule-keep (rule_tool_keep) so the accepted choice is stored confirmed in decision-cache.json. This is not a duplicate of the ADR engine: the product value is the bind to the export decision-cache. Hook short-circuit from that cache remains out of scope.

## Consequences

Positive: one command teaches the ADR+keep coupling; export interview and keep share one cache. Negative: surface grows by one prompt; census and command installers must list it; agents that only want an ADR file may still use rule_tool_process_adr directly.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep /rule-adr removed and document that agents must chain process_adr + rule_tool_keep manually
1. Fold keep into rule_tool_process_adr itself
1. Invent a separate rule_tool_adr_keep tool
