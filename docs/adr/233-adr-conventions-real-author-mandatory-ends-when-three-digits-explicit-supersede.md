# 233: ADR conventions: real author, mandatory ends-when, three digits, explicit supersede

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: adr, conventions, docs, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The ADR tool writes the header and the index, but hand-written and pasted ADRs drift from what the tool accepts. rule-process-adr needs a written convention set before its six guardrails can enforce one: the plan measured placeholder authors, free-form status values, missing ends-when sections and supersede links that point one way only.

## Decision

Five conventions, all rules of the house and not preferences:
1. Every ADR ends with a `## What would end this` section: the observation that would make the decision wrong.
2. The author is a person or a team. The server name is never the author, because a tool cannot be asked why.
3. Numbering is three digits, allocated at write time; a pending record carries a slug and is numbered when it lands on the trunk (ADR 187).
4. A supersede is explicit in both directions: the old record gains `by [NNN]`, the new one gains `supersedes [NNN]`.
5. Title and slug are English, in American spelling; the body follows the language rules rule-process-ai already owns.

## Consequences

The six guardrails read fields instead of prose: status, author, slug, ends-when, the supersede pair and the derived index. A hand-written ADR that breaks a convention fails a rule with a named fix instead of drifting silently. Two conventions need tool support first (ends-when and alternatives), which is Phase 3 of the plan.

## What would end this

A hand-written ADR corpus where a field-based rule cannot separate a right record from a wrong one, or tool support that makes a convention unenforceable without a second copy of the parser.

## Alternatives Considered

1. Keep the conventions as prose in the skill body: a rule cannot read prose, and the six rules need fields to parse.
1. Let the server name itself as author: an ADR whose author is the tool has no one to ask when the decision is wrong.
1. Allow two-digit numbering: the corpus already passed 99 records, so the width changes anyway.
1. One-way supersede: the old record then points nowhere and a reader cannot follow the chain.
