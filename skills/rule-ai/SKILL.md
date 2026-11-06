---
name: rule-ai
description: >-
  Use when building an AI agent or an AI feature, to route to the right ai-* skill. Covers evals, context engineering, agent architecture, prompting, and where a model belongs in a product.
tags:
  - "ai"
  - "agents"
  - "llm"
  - "index"
frameworks: [all]
---

# rule-ai - AI Agent Skills Index

Four skills cover the path from "should a model do this" to "is it still working
in production". Route on the question the request asks, not on the technology it
names.

## Route the request

| The request asks                                   | Skill                                                                  | That skill answers                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Is this good enough to ship?                       | [rule-ai-evals](../rule-ai-evals/SKILL.md)                             | Error analysis, LLM-as-judge, judge calibration, RAG evals                       |
| Why is the session slow, expensive, or forgetful?  | [rule-ai-context-engineering](../rule-ai-context-engineering/SKILL.md) | The window as a budget, compaction and handoff, delegation levels, usage limits  |
| How do I build or review this agent or MCP server? | [rule-ai-agent-architecture](../rule-ai-agent-architecture/SKILL.md)   | The API boundary, the harness over the model, loops against graphs, tool surface |
| What do I tell the model to do?                    | [rule-ai-prompting](../rule-ai-prompting/SKILL.md)                     | Prompt anatomy, context engineering, learning mode                               |

## Quick Selection Guide

- "Add an AI feature" → start at **Where a model belongs**, below. The answer is
  rarely a chat box.
- "The agent calls the wrong tool" → `rule-ai-agent-architecture`: the tool
  surface is the contract.
- "The prompt works once and then drifts" → `rule-ai-prompting`, then
  `rule-ai-evals` to hold the result.
- "The context window is full" → `rule-ai-context-engineering`.
- "Two answers to the same question" → `rule-ai-evals`: a judge you have not
  calibrated is a coin.

## Where a model belongs in a product

A chat box makes the user describe what they want in prose, wait, then read prose
back. These put the same capability where the work already happens.

| Feature                      | Replaces                             | Watch for                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------ |
| Smart form autofill          | Typing what a paste already contains | Show what was filled; never submit it silently   |
| Intent-aware search          | Exact match that fails on a synonym  | Keep keyword search as the floor                 |
| Content tagging              | A taxonomy nobody maintains          | Suggest, do not assign; track acceptance         |
| In-place writing help        | Copying into another tool and back   | Edit the text, do not replace the voice          |
| Moderation triage            | Reading everything by hand           | A model triages, a person decides the borderline |
| Insight lines on a dashboard | A chart the reader must interpret    | State the change, link to the rows behind it     |

## Rules that hold for every AI feature

- **Put it where the work is.** A feature the user must visit is a feature they
  forget.
- **Suggest, do not act.** Anything irreversible needs a human confirmation.
- **Show the source.** A recommendation with no visible reason cannot be
  debugged or trusted.
- **Degrade cleanly.** The model is a dependency with latency and an error rate:
  design the screen where it is unavailable.
- **Measure acceptance, not output.** How often a suggestion is kept unedited is
  the quality signal.

## See also

- [rule](../rule/SKILL.md) - Central skill index and dispatcher
