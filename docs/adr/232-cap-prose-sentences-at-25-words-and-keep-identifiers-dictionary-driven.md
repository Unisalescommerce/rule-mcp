# 232: Cap prose sentences at 25 words and keep identifiers dictionary-driven

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: guardrails, prose, ai, policy
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Three rules from the absorbed English and fingerprint plans were recorded as blocked: ai-plain-sentence-length had no documented threshold, ai-terminology-consistency had no glossary, and ai-identifier-english looked covered by ai-english-only-prose but that was not proven. rule-process-ai needed a decision for each before Phase 2 could close.

## Decision

1. ai-plain-sentence-length ships with 25-word cap. ASD-STE100 caps descriptive sentence at 25 words and procedural one at 20, and this project targets STE100 at about 80 percent, so 25 is documented number rule reads. It applies to documents only, like other advisory prose rules: document is where prose lives, and comment is different sink.
2. ai-identifier-english stays covered by ai-english-only-prose, which already checks identifier tokens against FOREIGN_TOKENS. That dictionary grows when real miss is reported, not preemptively, because adding content words such as Italian verbs risks flagging English lookalikes.
3. ai-terminology-consistency is dropped until glossary exists. Telling two terms for one concept apart needs maintained synonym list, and nobody asked for that artifact; rule that guesses would cry wolf.

## Consequences

rule-process-ai closes at 23 of 23 and retires into ADR at next closeout sweep. One rule and its corpus pair land; no terminology data file is created. 25-word number lives in this ADR and in skills/rule-process-ai/references/english.md, so future change amends both.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Set cap at 20 words, procedural limit: stricter than 80 percent target and noisy on explanatory prose.
1. Build glossary now: maintained artifact nobody asked for, with no consumer.
1. Write separate identifier rule: duplicates ai-english-only-prose and splits one dictionary across two owners.
1. Leave all three unbuilt and node open: decision that costs one paragraph blocks finished plan.
