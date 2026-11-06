# 130: Give the AI area its first source-cited guardrail family

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: guardrails, ai, agents, quality-gate
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Five rule-ai skills exist and none owns guardrail: rule-ai, rule-ai-agent-architecture, rule-ai-context-engineering, rule-ai-evals and rule-ai-prompting are narrative only, and none declares inherits. code area describes is real agent code, where checkable claims are tool schema, model call timeout, output cap, output validation, prompt secrecy and generation span. OWASP Top 10 for LLM Applications, MCP Security Best Practices, NIST AI RMF and OpenTelemetry GenAI conventions publish supporting practice.

## Decision

Create rule-ai/guardrails with eight rules split into Tier A (ai-tool-schema, ai-call-timeout, ai-max-tokens, ai-output-validated, ai-no-secrets-in-prompt, ai-trace-span) and Tier B (ai-eval-presence, ai-mcp-token-validation). Rules ship advisory and are promoted to blocking after corpus gate reports 100% precision and recall. rest of area stays narrative. One question stays open: whether four children add inherits: [rule-ai] so shared rules reach them.

## Consequences

Positive: the AI area gains its first deterministic checks and every rule cites OWASP, MCP or OpenTelemetry. Negative: the rules only reach the children if the inherits graph changes; ai-trace-span overlaps with obs-span-versioning and needs one owner; Tier B rules add advisory noise until they earn promotion.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave AI area fully narrative with human checklist and no deterministic rule
1. Put every candidate in corpus, including weak signals such as eval presence
1. Create guards in every AI skill instead of one shared family in rule-ai
