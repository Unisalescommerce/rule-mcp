# 149: Replay the decision-cache gate only behind a measured threshold

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

L3 gate has been shadow-only, and its model probabilities are not calibrated. Every shadow prediction is now labeled against gold route from fresh compute (route equality, with entry's deps still holding), and report sweeps probability floor. replay is only defensible at floor with zero false replays and enough labeled predictions; model call can also cost more than rule_tool compute, so replay is not automatically latency win.

## Decision

Add opt-in replay behind RULE_MCP_DECISION_CACHE_REPLAY=1, off by default. It runs same deterministic candidates, state, question, decision cache and hard guards as shadow, but before compute: when model chooses candidate above RULE_MCP_DECISION_CACHE_THRESHOLD and every guard passes, it returns that cached core as tier decision, with choice and probability in _meta.ruleCache. Replay wins when both flags are set, so call is never replayed and shadowed twice. shadow stays default until pnpm report:decision-cache recommends floor from real labeled traffic.

## Consequences

wrong replay is silent, so default remains off. oracle is route equality with fresh deps, not full payload equality, and report exposes unlabeled predictions. model call runs before compute and may cost more than it saves on rule_tool; report compares both times, and tier is consistency/cache tier when model is slower. L0/L1 and the [removed] tier still answer first, and NON_CACHEABLE, errors, echoes, stale deps and RULE_MCP_NO_CACHE still win.

expanded local corpus (`pnpm audit:decision-cache`, 22 groups, 47 paraphrases, 8 negatives) produced no safe floor with either model. Laya made 23 predictions and 5 wrong choices at lower floors; 31 of 47 paraphrases had gold route in candidates. Julia made 36 predictions and 21 wrong choices at lower floors, still 7 wrong at 0.90, with 22 of 47 coverage. eight unseeded negatives were no-candidates for both, so gate stayed safe there. gate call was faster than gold call in both (Laya 65 vs 143 ms, Julia 17 vs 94 ms); blocker is accuracy, not time. two-batch top-ten variant (ADR 150) did not add gold seed and made Julia worse at 0.90; it was reverted, and single five-candidate batch remains. BM25 ranker (ADR 151) kept recall and improved Laya's 0.50 precision (92.9% vs 86.7%) but worsened Julia's 0.90 (41.7% vs 58.8%); no floor emerged. leave-one-out corpus (ADR 152) raised Laya coverage to 76.8% (53/69) and Julia to 49.3% (34/69); model's choice is now blocker, with Laya abstaining on 38 of 69 and Julia wrong 37 times out of 60 at 0.30. prompt/description change (ADR 153) cut Laya's none from 38 to 24 and lifted correct choices from 23 to 33, but wrong choices rose from 8 to 13; 0.45 precision reached 84.2% and no floor emerged; Julia at 0.90 fell to 31.8%. Replay stays off; next is precision/floor, with more samples or route-aware filter, not lower floor.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

real sample where chosen floor replays wrong route, or too few labeled predictions to reach minimum sample, ends replay and returns gate to shadow-only. model time consistently above compute time makes this consistency tier, not latency optimization, and it must not be enabled for latency.

## Alternatives Considered

1. Enable replay at 0.9 by default: rejected because probabilities are uncalibrated and wrong replay is silent.
1. Add another similarity tier or rely on [removed]: rejected because it needs external adapter and decided cache entry already exists.
1. Replay without labeling shadow: rejected because there would be no measured false-replay rate.
