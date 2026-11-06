# 233: ADR conventions: real author, mandatory ends-when, three digits, explicit supersede

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: adr, conventions, docs, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR tool writes header and index, but hand-written and pasted ADRs drift from what tool accepts. rule-process-adr needs written convention set before its six guardrails can enforce one: plan measured placeholder authors, free-form status values, missing ends-when sections and supersede links that point one way only.

## Decision

Five conventions, all rules of house and not preferences:

1. Every ADR ends with `## What would end this` section: observation that would make decision wrong.
2. author is person or team. server name is never author, because tool cannot be asked why.
3. Numbering is three digits, allocated at write time; pending record carries slug and is numbered when it lands on trunk (ADR 187).
4. supersede is explicit in both directions: old record gains `by [NNN]`, new one gains `supersedes [NNN]`.
5. Title and slug are English, in American spelling; body follows language rules rule-process-ai already owns.

## Consequences

The six guardrails read fields instead of prose: status, author, slug, ends-when, the supersede pair and the derived index. A hand-written ADR that breaks a convention fails a rule with a named fix instead of drifting silently. Two conventions need tool support first (ends-when and alternatives), which is Phase 3 of the plan.

## What would end this

hand-written ADR corpus where field-based rule cannot separate right record from wrong one, or tool support that makes convention unenforceable without second copy of parser.

## Alternatives Considered

1. Keep conventions as prose in skill body: rule cannot read prose, and six rules need fields to parse.
1. Let server name itself as author: ADR whose author is tool has no one to ask when decision is wrong.
1. Allow two-digit numbering: corpus already passed 99 records, so width changes anyway.
1. One-way supersede: old record then points nowhere and reader cannot follow chain.
