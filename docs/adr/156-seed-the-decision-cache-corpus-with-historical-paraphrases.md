# 156: Seed the decision-cache corpus with historical paraphrases

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

wide leave-one-out corpus measured 74.3% Laya coverage with only group peers in cache. production cache holds historical paraphrases, so benchmark now seeds two historical prompts per group, each with its own gold route, while live samples stay unchanged. gate, ranker and batch stay as they are.

## Decision

Adopt 68 historical paraphrase seeds in corpus benchmark. held-out live prompts, negatives, single batch, BM25 ranker and replay-off policy are unchanged.

## Consequences

Laya coverage rose to 88/105 (83.8%); predictions to 82. Wrong choices were 22 at 0.30 but 1 at 0.50 and 0 at 0.55, where 9 predictions were correct (one short of 10-sample floor). No floor was recommended; replay stays off. history seeds are best recall so far; next is small third slice to put 10 predictions at 0.55, or model.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

third slice that puts ten zero-false predictions at 0.55 would end floor work and turn replay on. Laya run where 0.55 gain disappears on more samples would move work to model, not corpus.

## Alternatives Considered

1. Keep peer-only cache: rejected because it understated production cache and lost historical recall.
1. Use route-aware filter: already rejected in ADR 155 because BM25 route is not cached post-decision route.
1. Improve model first: deferred because 0.55 floor is one sample short, not one model short.
