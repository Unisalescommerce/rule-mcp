# 129: Add a source-cited backend guardrail family and fix the six existing rules

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: guardrails, backend, security, quality-gate
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Nine rule-backend skills exist, but only rule-backend owns guardrails and it owns six rules (cors-explicit, error-exposure, helmet-headers, input-validation, rate-limiting, sql-injection). rule-backend-security, rule-backend-node, rule-backend-workers, rule-backend-graphql and four framework skills carry rich guidance with no deterministic check. Three of six rules also miss Hono forms (secureHeaders, hono-rate-limiter, @hono/zod-validator), which turns them into false positives for framework this repo serves. OWASP API Security Top 10, ASVS, OWASP Node/GraphQL/SSRF/Prototype Pollution/Auth cheatsheets, RFC 8725, Node.js docs, Express security and Fastify/Hono/NestJS guides all publish de facto rules that map to static checks.

## Decision

Extend patterns of six existing backend rules to framework equivalents, then add twenty-five guardrails split by owner: fifteen shared in rule-backend (auth, static analysis, resource limits, outbound timeout and runtime resilience), five in rule-backend-graphql, one in rule-backend-node and four in framework skills. Rules ship advisory and are promoted to blocking only after corpus gate reports 100% precision and recall for rule id. Triggers stay content heuristics narrowed to server or route files under src/, plus framework-scoped activation when file imports framework. Two questions stay open for owner: Tier A/Tier B split of twenty-five, and whether runtime rules live in rule-backend-node with rule-backend-node added to inherits of server-bearing children.

## Consequences

Positive: the backend family stops being narrative only; the Hono false positives disappear; every rule is traceable to a public source. Negative: twenty-five rules need fifty corpus fixtures plus a framework fixture per family, the inheritance graph may change for the runtime rules, and Tier B rules add advisory noise until they earn promotion.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep six rules and document rest as prose only
1. Add only ten Tier rules and leave advisory set out
1. Put every new rule in rule-backend and skip per-skill ownership split
1. Make new rules blocking from day one instead of proving them against corpus
