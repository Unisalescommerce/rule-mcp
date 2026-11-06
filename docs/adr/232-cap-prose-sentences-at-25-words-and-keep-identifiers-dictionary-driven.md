# 232: Cap prose sentences at 25 words and keep identifiers dictionary-driven

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: guardrails, prose, ai, policy
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Three rules from the absorbed English and fingerprint plans were recorded as blocked: ai-plain-sentence-length had no documented threshold, ai-terminology-consistency had no glossary, and ai-identifier-english looked covered by ai-english-only-prose but that was not proven. rule-process-ai needed a decision for each before Phase 2 could close.

## Decision

1. ai-plain-sentence-length ships with a 25-word cap. ASD-STE100 caps a descriptive sentence at 25 words and a procedural one at 20, and this project targets STE100 at about 80 percent, so 25 is the documented number the rule reads. It applies to documents only, like the other advisory prose rules: a document is where prose lives, and a comment is a different sink.
2. ai-identifier-english stays covered by ai-english-only-prose, which already checks identifier tokens against FOREIGN_TOKENS. That dictionary grows when a real miss is reported, not preemptively, because adding content words such as Italian verbs risks flagging English lookalikes.
3. ai-terminology-consistency is dropped until a glossary exists. Telling two terms for one concept apart needs a maintained synonym list, and nobody asked for that artifact; a rule that guesses would cry wolf.

## Consequences

rule-process-ai closes at 23 of 23 and retires into an ADR at the next closeout sweep. One rule and its corpus pair land; no terminology data file is created. The 25-word number lives in this ADR and in skills/rule-process-ai/references/english.md, so a future change amends both.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Set the cap at 20 words, the procedural limit: stricter than the 80 percent target and noisy on explanatory prose.
1. Build a glossary now: a maintained artifact nobody asked for, with no consumer.
1. Write a separate identifier rule: duplicates ai-english-only-prose and splits one dictionary across two owners.
1. Leave all three unbuilt and the node open: a decision that costs one paragraph blocks a finished plan.
