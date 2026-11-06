# 148: Shadow the decision-cache gate before replaying

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

decision model is closed-choice reranker, not code analyzer. tool cache has L0 exact, L1 normalized and opt-in [removed] L2; decision L3 could replay cached result for paraphrase, but model's probabilities are not calibrated (Laya's correct picks sat at 0.067-0.332) and false replay hands back wrong answer. decision cache already keys model + state + questions, so stable candidate set is cheap to re-ask.

## Decision

Add opt-in L3 gate built from deterministic parts: same-tool, same non-prompt args, fresh and non-echoing candidates; IDF-weighted overlap top five plus none; redacted state and stable candidate descriptions; choice question; strict parser and hard guards. Phase 1 is shadow-only behind RULE_MCP_DECISION_CACHE_SHADOW=1: it writes decision-shadow.jsonl and never replays. threshold defaults to 0.9 and is provisional. Replay waits until corpus shows zero false replays. ADR 149 records later opt-in replay and its measured floor.

## Consequences

No response changes in phase 1; opt-in model call runs after response on cache miss; report is local. Phase 2 can reuse same protocol for replay. NON_CACHEABLE tools, error results, echoed prompts, stale deps and RULE_MCP_NO_CACHE still win. gate is limited to rule_tool because it is only tool with NORMALIZABLE prompt field.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

corpus where shadow gate marks replay that deterministic oracle calls wrong, or shadow hit rate that does not beat L0/L1, ends gate; it stays shadow-only and is removed rather than tuned into risk.

## Alternatives Considered

1. Replay immediately and tune later: rejected because probabilities are not calibrated and wrong replay is silent.
1. Use chat model to analyze code and decide cache admission: rejected for this phase because decision model is closed-choice head and code analysis would add separate model stage.
1. Rely on the [removed] L2 only: rejected because it needs external adapter and carries no decision labels for arbitrary cache entries.
