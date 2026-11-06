# 242: Close out plan _pi-integration-and-debt

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/_pi-integration-and-debt.md, "Plan: Pi integration and catalog debt", finished with 15 closed items.

## Outcome

- WS1-T1: Add query words descriptions lack.
- WS1-T1.1: Name session, resume, close, and plan in handoff and handon descriptions.
- WS1-T1.2: Name verify, lint, guardrail, and decision in check and gateway descriptions.
- WS1-T2: Accept one item where schema asks for array.
- WS1-T2.1: Coerce gateway files when caller sends one object.
- WS1-T2.2: Coerce ADR alternatives and tags when caller sends one string.
- WS1-T3: Load one installed skill in pi. Done 2026-11-06: ~/.agents/skills/ holds 24 skills (rule-adr … rule-usage) and same 24 arrive in this session's available_skills prompt block, so pi discovers and loads installed catalog. installer writes only name and description, which is spec subset pi reads.
- WS1-T3.1: Record whether custom frontmatter key raises skill warning. Done 2026-11-06: it does not. loadSkillFromFile in pi 1.5.0 validates name and description only; warning is raised for read or parse failure, bad description, bad name, and name collision. skill object keeps name, description, filePath, baseDir, sourceInfo and disable-model-invocation, so tags, frameworks, inherits and guardrails are dropped silently. Probe: pi -p … --skill ./custom/SKILL.md with those four keys exited 0 with empty stderr, and two-skill name collision behaved same, because -p renders no startup diagnostics. source is evidence; -p is not.
- WS2-T1: Carry out those three steps and mark them closed in that plan. Done 2026-11-06: router plan carries family contract, rule-toolchain owns five bundler rules with tests and corpus pairs, and vite, rspack and parcel declare inherits: [rule-toolchain].
- WS2-T2: Confirm cascade no longer lists that plan as ready. Confirmed 2026-11-06: bundler family plan has no open step and is done, so cascade skips it.
- WS3-T1: Resolve pending ADR span to its real path before handon check. parseHandoff now reads docs/adr/_pending/`<slug>`.md, and verifyAdr resolves slug against that directory before falling back to number.
- WS3-T2: Keep each closed step whole when closeout writes Outcome. closedSteps joins step's continuation lines; ADR Outcome no longer cuts wrapped step at its first line.
- WS3-T3: Keep plan prose that is not checkbox in that Outcome. planProse carries plan's paragraphs into a ### Plan prose section under Outcome, and skips fenced blocks, headings and status line.
- WS3-T4: Close F4, F5, F8, F9, and stage list in reference plan. Each is closed on measurement recorded in that plan, not on assumption.
- WS3-T5: Clear documentation comment lint failure, or record why it stays. Recorded: rule fires on block style whole repository uses (2013 of 2297 lint problems), so clearing it is repository-wide decision that needs its own ADR. measurement is in reference plan.

### Plan prose

Notes: subordinate plan.

Coordinated by [plan-of-plans](plan-of-plans.md).

This plan records work that had no file of its own.

It does not restate catalog node.

Depends on: none.

Feeds: none.

Shared files: none.

WS1 runs first.

WS2 runs after WS1.

WS3 runs after WS2.

WS1 edits tool descriptions and three array schemas.

WS2 marks steps in the [bundler family plan](skills/toolchain/_bundler-family.md).

WS3 edits handon check, closeout writer, the [reference plan](_plan-of-plans-reference.md), and lint finding.

Pi 1.5.0 coerces JSON Schema tool argument way it coerces TypeBox.

Its search ranks tool name above description.

query word still has to appear.

three open steps already live in the [bundler family plan](skills/toolchain/_bundler-family.md).

This workstream does not copy them.

See the [closeout archive](../../packages/mcp/tools/handoff/_closeout-archive.js).

See the [handon check](../../packages/mcp/tools/handon/_verify.js).

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/_pi-integration-and-debt.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
