# 150: Keep the single-batch decision-cache shortlist

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

expanded paraphrase corpus measured single-batch top-five gate at 31/47 gold-in-candidates for Laya and 22/47 for Julia, with no safe probability floor. two-batch variant ranked ten candidates and asked model in two batches of five plus none, aiming to recover gold seed top five missed. It did not add single gold seed: coverage stayed at 31/47 and 22/47. It also made Julia worse at 0.90 floor (15 replays, 9 wrong, 40% precision) than single batch (17 replays, 7 wrong, 58.8%). extra model call bought nothing.

## Decision

Revert two-batch variant and keep single five-candidate batch. replay remains off. next experiment is better candidate ranker (BM25 or route-aware filter) before any batching is reconsidered; batching can only help once gold seed is in top ten but outside top five.

## Consequences

top-ten pool did not change recall, so ranker is measured blocker, not model's batch size. single-batch gate keeps one model call per miss and better Julia precision. two-batch code and its tests are removed; corpus and audit remain evidence. Replay stays off, and report still gates any activation.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

ranker whose top ten adds gold seed top five misses, with enough labeled predictions and no false replay at floor, would make two-batch worth revisiting. single-batch run that already reaches zero false with ten labels would end ranker work and leave only floor decision.

## Alternatives Considered

1. Keep two-batch code behind flag: rejected because it added model call with no measured recall gain and worse Julia precision.
1. Lower probability floor: rejected because false replays rise and corpus already shows no zero-false floor with ten labels.
1. Expand corpus again before changing ranker: rejected because more samples measure same ranker; ranker is blocker.
