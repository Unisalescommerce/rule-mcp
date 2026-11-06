# 121: A file is reported on, a task is confirmed

- **Date**: 2026-10-01
- **Status**: accepted
- **Tags**: hooks, guardrails, permissions, write, enforcement
- **Author**: Emiliano Pisu <emiliano.pisu@pixu1980.com>

## Context

PreToolUse gate on Write, Edit and MultiEdit that asks or denies on language
and guardrail failures puts person in loop of every edit, in every
project that installed hooks. rules that reach ordinary code are not
rare ones, so cost is shape of gate rather than its rate. Against
that sits a real need: a structural change is worth a person's attention. The
question was never wrong. It was asked of wrong unit.

## Decision

file is reported on. task is confirmed.

file hook moves from PreToolUse to PostToolUse and loses power to
decide anything. PostToolUse carries `additionalContext` and no
`permissionDecision`, so language and guardrail reports reach model and
nobody else. Both halves are collected instead of first one winning. The
file is read from disk after write rather than replayed from payload.
settings file from before this ADR that still calls `guard write` from
PreToolUse answers plain allow, and `neverBlocks` coerces any decision the
write path could grow back into one.

confirmation that remains is asked once per task, at first structural
write, and not again until next prompt. task runs from one
`UserPromptSubmit` to next. model declares task structural with
`rule_tool_structural`, and its summary is what question states. Two
deterministic signals are the net under the declaration: a write under
`docs/adr`, and change to manifest's dependency blocks. Creating file is
never structural on its own: a new module is ordinary work. A write landing
after question was asked is answer to it.

The two Bash asks are unchanged: migration and commit.

## Consequences

No file written on this machine is ever confirmed by person again for em
dash or British spelling. structural gate asks once per architectural
task. Tests assert both halves: `write-never-blocks` and `structural-gate`.

## What would end this

host that carries neither post-tool report event nor prompt boundary
leaves file report with nowhere to go and task with no boundary; the
honest answer there is no file hook rather than gate that asks per file.
