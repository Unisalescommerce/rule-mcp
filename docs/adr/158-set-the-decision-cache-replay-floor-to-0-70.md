# 158: Set the decision-cache replay floor to 0.70

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The third corpus slice left the L3 floor empty: at 0.55 Laya made 8 predictions with 1 wrong, at 0.60 only 4, and no higher floor reached ten. The gate also fed the model noise: a queryHash in the state and deps/id hashes in every candidate description. A three-candidate shortlist was tested and rejected: coverage fell from 85.1% to 80.7%, with 10 predictions and 2 wrong at 0.55 and 2 predictions with 1 wrong at 0.60. Removing the noise and asking a symmetric question (same skill is not enough, the intent must match, pick none when no candidate shares it) moved the 0.70 bucket to 11 predictions with 1 wrong. That wrong is a hub/leaf ambiguity: "Vue component using setup and ref" (gold rule-frontend-vue) matched a near-identical history seed routed rule-frontend. The router is deterministic per prompt but inconsistent across paraphrases: 30 of 114 leave-one-out prompts and 33 of 74 history seeds route differently from their group's seed. A specificity instruction naming the framework was rejected because it left fewer high-confidence predictions (0.70: 9 with 1 wrong). A neighborhood route-consistency guard was too aggressive: at 0.65 it kept 8 predictions. The asymmetric hub guard is narrow: block a hub pick when a leaf of the same area is in the candidate set, and keep a leaf pick valid even when the hub is present.

## Decision

Adopt symmetric gate instruction, drop queryHash from state and deps/id from candidate descriptions, add asymmetric hub guard, and set SHADOW_THRESHOLD to 0.7, measured floor. guard applies to every valid pick regardless of current threshold, so report sweep sees it; shadow record carries guard field and guarded rows are excluded from floor sweep. replay stays opt-in behind RULE_MCP_DECISION_CACHE_REPLAY=1; nothing replays by default.

## Consequences

final corpus run measured 113 labeled predictions, 100 eligible, 13 guarded, 10 would replay at 0.70 and zero false replays; report recommends 0.70 with 10 predictions and 0 wrong. previous run of same configuration measured 11/0, so run-to-run variance leaves floor exactly at ten-sample minimum. gate call averaged 70.5 ms against 135.3 ms for gold call. guard costs recall, but remaining floor is clean. corpus still contains route-instability conflicts; guard covers only hub/leaf class, so opt-in replay must be re-measured as samples grow. decision tests pass 31/31; full suite keeps known file-size failure on five pre-existing files.

## What would end this

fresh corpus run with more samples at 0.70 that keeps zero false replays and at least ten predictions; or router that routes paraphrases consistently, which would let hub guard relax and floor drop without false replay. If rerun loses prediction and ten-sample minimum fails, replay returns to shadow-only.

## Alternatives Considered

1. Cap shortlist at three candidates: rejected because coverage fell to 80.7% and precision got worse at every floor.
1. Add specificity instruction naming framework: rejected because it left fewer high-confidence predictions (0.70: 9 with 1 wrong).
1. Filter corpus to route-consistent groups only: rejected because it would hide router instability and recommend floor production cache cannot honor.
1. Use neighborhood route-consistency guard: rejected because it was too aggressive and cut 0.65 bucket to 8 predictions.
1. Lower threshold or accept one wrong replay: rejected because wrong replay is silent and report needs zero.
