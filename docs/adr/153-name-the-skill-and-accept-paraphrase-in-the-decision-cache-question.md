# 153: Name the skill and accept paraphrase in the decision-cache question

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

leave-one-out corpus showed Laya abstaining on 22 of 53 covered prompts. candidate criteria described seed as prompt/route and question asked for same request, so paraphrase looked different. skill is strongest signal cache entry already carries. prompt and description are only change; ranker, threshold, guards and replay stay as they are.

## Decision

Describe cached candidate as request/skill and ask model to accept paraphrase when skill and intent match, choosing none only when no candidate shares intent. Keep probability floor, hard guards and replay off until report recommends floor.

## Consequences

Laya's none fell from 38 to 24; predictions rose from 31 to 46, correct from 23 to 33, wrong from 8 to 13. 0.45 precision rose to 84.2% (from 70.6%) but 0.60-0.75 got worse; no floor emerged. Julia at 0.90 fell to 31.8% (from 45.8%), so multilingual path keeps its caveat. model time rose from 72 to 94 ms with longer prompt. eight negatives stayed seven no-candidates plus one none. Replay stays off; next is precision/floor, with more samples or route-aware filter.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

larger sample where 0.45 gain disappears, or floor with zero false replays and ten labels, ends choice. route-aware filter that removes 0.60-0.75 errors would supersede prompt; Julia path where 0.90 loss outweighs Laya gain would keep multilingual gate on shorter prompt.

## Alternatives Considered

1. Revert to shorter prompt: rejected because shorter one abstained on 22 covered prompts and produced 10 fewer correct choices.
1. Try route-aware filter next: deferred because prompt change already uses route candidate carries and floor is still missing.
1. Add more corpus groups first: deferred because current 69 prompts already show precision drop at 0.60-0.75.
