# 133: Give the meta-framework area its first server and client boundary guardrails

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: guardrails, meta, frontend, quality-gate
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Five meta-framework skills exist (rule-meta plus next, astro, nuxt and remix) and none owns guardrail or declares inherits. recurring failures in this area are at server and client boundary: public environment variable that carries secret, loader that serializes secret field to client, render that reads clock and breaks hydration, and route that trusts unvalidated input.

## Decision

Create rule-meta/guardrails with seven rules. Tier A: meta-public-env-secret, meta-server-data-leak, hydration-safe, meta-route-validation. Tier B: meta-client-directive, astro-client-directive, meta-cache-explicit. Rules ship advisory and are promoted to blocking after corpus gate reports full precision and recall. One question stays open: whether four children add inherits: [rule-meta] so shared rules reach them.

## Consequences

Positive: the server and client boundary becomes checkable and every rule cites Next.js, Astro, React Router or Vite documentation. Negative: the shared rules need the inherits graph; the Nuxt runtime config source is not stable; Tier B rules add advisory noise until they earn promotion.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave meta area narrative and rely on frontend rules only
1. Create guards in each meta-framework skill with no shared family
1. Make advisory rules blocking from start
