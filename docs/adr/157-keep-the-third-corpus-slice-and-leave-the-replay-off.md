# 157: Keep the third corpus slice and leave the replay off

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

second slice measured 88/105 Laya coverage (83.8%) and 9 zero-false predictions at 0.55, one short of ten-sample floor. third slice adds three groups, three negatives and six historical paraphrases, bringing corpus to 37 groups, 114 leave-one-out prompts, 74 history seeds and 16 negatives. Laya coverage rose to 97/114 (85.1%), but at 0.55 there are 8 predictions with 1 wrong and at 0.60 only 4; no higher floor reaches ten predictions.

## Decision

Keep third slice for its recall, and leave replay off. next experiment is model's choice or more samples above 0.60, not another corpus expansion at current probability distribution.

## Consequences

corpus is best recall so far at 85.1%, but floor still does not exist: model's probability distribution puts too few predictions above 0.60 and one wrong at 0.55. Replay stays off. third slice stays in plan and in benchmark; next work is model or corpus that adds samples where probabilities are high, not lower threshold.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

model or prompt that puts ten zero-false predictions at 0.60+ ends floor work and turns replay on. Adding samples above 0.60 without lowering floor would also close count, but model still owns confidence.

## Alternatives Considered

1. Lower floor to 0.55 with one wrong: rejected because wrong replay is silent and report needs zero.
1. Expand corpus again at same distribution: deferred because it moves count slowly without changing model's confidence.
1. Improve model or prompt: next experiment, because 0.60+ bucket is too small.
