# 209: Close out plan _decision-models

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/_decision-models.md, "decision-models plan", finished with 9 closed items on 2026-10-20.

## Outcome

- Step 5 - DM-04 (high): Non-English prompts route to unknown, and the installed model cannot read them
- 5.1: Failing test: an Italian slice of the corpus (the four prompts measured in the audit plus enough to be meaningful) records the current 3-of-4 unknown, so the gap is a test and not an anecdote.
- 5.2: Implement the model registry: id, size, languages, context, per-model threshold, and a shortlist cap it can hold; unknown models fall back to BM25 instead of failing.
- 5.3: Choose the model by the language detected from the prompt, with Julia-1 as the multilingual entry and Laya as the English one; do not load both on a single-instance router without measuring the swap cost.
- 5.4: Gate: the Italian slice improves against its recorded baseline and the English slice does not regress; a router with one slot must show the swap cost in the same table.
- Step 8 - DM-10 (low): Persona severity is assigned by the agent and two runs can disagree
- 8.1: Measure first: take an existing review's findings, ask the model to score each severity, and record agreement with the human labels; if agreement is not clearly better than the agent's own, close the step as rejected.
- 8.2: If it survives 8.1, implement a severity normalizer that maps a score answer onto the review's existing severity ladder without inventing a level it does not have.
- 8.3: Gate: the trio validator still passes, a re-sync keeps the severities it wrote, and the step is deleted if 8.1 rejects it.

## Measurement

- Italian slice, re-measured 2026-11-03: 2/8 exact, 3/8 top-or-alternative, 5/8 `unknown`, unchanged from the recorded baseline.
- English corpus: 77/95 exact, 91/95 top-or-alternative, unchanged.
- One-slot swap cost, live run: cold Italian 1415 ms with one router request, English after Italian 216 ms with one request, Italian again 0 router requests because the decision cache answered.
- DM-04 closes by its kill criterion: the harness and the registry ship, the Italian routing claim is dropped. DM-10 was rejected at measurement, so no severity normalizer ships.

## Durable choices (export decision-cache)

The source of truth for durable routing/ADR choices is the **export-owned**
decision-cache at `~/.rule-mcp/projects/<slug>/decision-cache.json`
(`schemaVersion`, fingerprint, status `pending`|`confirmed`|`rejected`,
source `rule-keep`|`rule-export-interview`|`rule-adr`). Export writes it via
`/rule-keep`, `/rule-export` interview, and `/rule-adr`. The routing work may
later read and revalidate those records, including moving `confirmed` to
`rejected` when the model or shortlist changes; it must not invent a parallel
durable store. The L3 routing gate cache under `src/core/decision/` remains a
separate, opt-in short-circuit and is not that source of truth.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/_decision-models.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
