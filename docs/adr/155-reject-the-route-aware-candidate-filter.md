# 155: Reject the route-aware candidate filter

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: decision-models, cache, routing, observability
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

wide leave-one-out corpus measured BM25 single-batch gate at 78/105 Laya coverage (74.3%). route-aware experiment computed router's BM25 top skill and used it to filter cached candidates, with fallback to full set when no candidate matched. cached entries carry post-decision route, so BM25 hint and cache route disagree on ten cases and filter drops correct seed. Coverage fell to 68/105 (64.8%), predictions to 58, wrong at 0.30 to 19; no floor emerged.

## Decision

Reject route-aware candidate filter. Keep BM25 ranker, single batch and replay off. hint and its plumbing are reverted; next recall experiment is seeding corpus with group's historical paraphrases, or improving model, not another route filter.

## Consequences

The BM25 route is not the cache route: filtering by it removes correct seeds when the decision layer had overridden the route. The fallback only helps when no candidate matches, not when a wrong candidate matches. The reject leaves the Laya 74.3% coverage and 88 ms gate intact; the route-aware variant cost 105 ms and lost recall. Replay stays off.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

route hint that matches cached post-decision route on every covered sample, or cache whose entries are stored with BM25 route, would make filter worth re-testing. Laya 74.3% single-batch remains baseline it would have to beat.

## Alternatives Considered

1. Filter by post-decision route: deferred because that route is what computeCore produces, so gate would need compute it is trying to avoid.
1. Seed corpus with group's historical paraphrases: next experiment, because it tests production cache without changing gate.
1. Improve model: other next experiment; route hint is measured and rejected.
