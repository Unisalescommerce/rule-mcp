# 154: Exclude the multilingual model from the decision-cache gate

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

leave-one-out corpus measured multilingual model at 61 predictions and 37 wrong at 0.30, with 13 wrong at 0.90 (31.8% precision). shorter prompt reached 45.8% at 0.90 but still no floor. Laya, English model, reached 84.2% at 0.45 and 33 correct choices. cache gate's questions are English and multilingual model is overconfident on them.

## Decision

Exclude multilingual model from decision-cache gate. Julia stays on routing decision and on L0/L1 cache tiers; L3 gate only runs with English model. replay stays off.

## Consequences

Julia cache gate is off, so its overconfident cache picks can no longer replay or shadow. routing decision and deterministic tiers are unchanged. Laya remains only L3 model and keeps its measured behavior. benchmark with --model julia produces no gate records; Laya LOO run is measurement. next is recall/precision work on English path.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

Julia cache prompt with zero false replays and ten labels at usable floor would end exclusion. Laya floor would make English gate only one that matters and leave multilingual path on routing.

## Alternatives Considered

1. Keep shorter prompt for Julia: rejected because it reached only 45.8% at 0.90 and still no floor.
1. Build model-specific cache prompt for Julia: deferred because English question is measured one and multilingual path needs its own calibration.
1. Leave gate on for Julia: rejected because 13 wrong at 0.90 is silent-replay risk.
