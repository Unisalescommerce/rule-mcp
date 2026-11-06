# 152: Measure the decision-cache gate with a leave-one-out corpus

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

one-seed-per-group corpus measured 31/47 Laya and 22/47 Julia coverage, but production cache holds historical paraphrases, not one canonical prompt per group. leave-one-out benchmark seeds each held-out prompt with group's other prompts and other groups' seeds; negatives keep one-seed-per-group cache. BM25 ranker and single batch are unchanged.

## Decision

Use leave-one-out corpus for decision-cache measurement. Each group prompt is held-out live query; cache contains its group peers and other groups' seeds. benchmark writes same shadow records and keeps replay off until report recommends floor.

## Consequences

Laya coverage rose to 53/69 (76.8%) and Julia to 34/69 (49.3%). Laya made 31 predictions and 8 wrong at 0.30, 2 at 0.55, 1 at 0.75; none choice was 38 of 69, so model, not recall, is now blocker. Julia made 60 predictions and 37 wrong at 0.30, 13 wrong at 0.90. eight negatives stayed no-candidates (seven) or none. No floor reached zero false replays with ten labels; replay stays off. prompt/description change (ADR 153) then cut Laya's none from 38 to 24 and lifted correct choices from 23 to 33, with wrong choices 8 to 13; no floor.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

floor with zero false replays and ten labels ends work. Laya run where none choice is justified by peer prompts not being same request would move blocker back to recall. prompt or description change that turns 22 covered-but-none prompts into correct picks ends model work; route-aware filter is fallback if it does not.

## Alternatives Considered

1. Keep one-seed corpus: rejected because it understates production cache and hid peer recall.
1. Use route-aware filter next: deferred because LOO already lifts recall and model's none is measured blocker.
1. Add more corpus groups first: deferred because current 69 prompts already show choice failure.
