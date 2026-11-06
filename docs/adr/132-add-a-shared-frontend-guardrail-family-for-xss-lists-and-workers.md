# 132: Add a shared frontend guardrail family for XSS, lists and workers

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: guardrails, frontend, security, quality-gate
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Ten rule-frontend skills exist. Five own rules (react, vue, svelte, angular and vanilla-reactive, fourteen rules total) and none declares inherits, so rule owned by one skill never reaches another. router rule-frontend owns nothing. checkable gaps that are not style or accessibility, which styleguide area already covers, are XSS sinks, list key, effect cleanup, custom element shape, template escaping and worker boundary.

## Decision

Create rule-frontend/guardrails with seven rules. Tier A: xss-sink-sanitized, fe-list-key, fe-effect-cleanup, ce-valid, template-escape, worker-no-dom. Tier B: worker-transferable. Rules ship advisory and are promoted to blocking after corpus gate reports full precision and recall. Two questions stay open: whether framework skills add inherits: [rule-frontend], and whether custom-element and template-engine join target list for ce-valid and template-escape.

## Consequences

Positive: the XSS sink and list key claims become deterministic and cite OWASP, MDN and the framework docs. Negative: the shared rules only reach the children if the inherits graph changes; two rules imply owners that were not selected; Tier B adds one advisory rule.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave frontend area to per-framework rules it already has
1. Put every rule in each framework skill instead of one shared family
1. Reuse styleguide CSS and HTML rules for template escaping claim
