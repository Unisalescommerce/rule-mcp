# 151: Rank decision-cache candidates with BM25

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

expanded corpus measured candidate recall at 31/47 for Laya and 22/47 for Julia. two-batch top-ten experiment (ADR 150) added no gold seed and was reverted. current ranker is set-based IDF-weighted overlap: it ignores term frequency and length normalization. BM25 over same seed prompts adds both, using existing bm25Score, while keeping five-candidate cap and single batch.

## Decision

Adopt BM25 as decision-cache candidate ranker, with existing five-candidate cap, single batch, and replay still off. ranker is split out of candidate builder and reuses existing bm25Score; tests cover repeated-term saturation. next experiment is candidate recall, not another scoring swap.

## Consequences

Recall is unchanged (31/47 Laya, 22/47 Julia), so ranker is still not fix for missing gold seed. Laya precision below 0.75 improves (0.50 92.9% vs 86.7%, 0.70 66.7% vs 50%), but 0.90 floor has no Laya predictions, so replay stays off. Julia at 0.90 worsens (41.7% vs 58.8%) and at 0.95 (50% vs 66.7%); Julia caveat is recorded. model time is unchanged (Laya 62 ms, Julia 18 ms), and eight negatives stay no-candidates. leave-one-out corpus (ADR 152) lifted Laya coverage to 76.8% (53/69) and Julia to 49.3% (34/69); model's choice is next blocker. prompt/description change (ADR 153) then cut Laya's none from 38 to 24 and lifted correct choices from 23 to 33, with wrong choices 8 to 13; no floor emerged.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

larger Laya sample where 0.50-0.70 precision gain disappears, or Julia path where 0.90 loss matters more than Laya gain, ends adoption. ranker that puts gold seed in top five ends recall work and makes replay measurement possible.

## Alternatives Considered

1. Keep IDF-weighted overlap: rejected because its Laya precision at 0.50-0.70 is worse and BM25 is standard project already ships.
1. Try route-aware filter next: deferred because it changes candidate contract and needs its own measurement.
1. Expand seed prompts per group: deferred because it changes corpus, not gate.
