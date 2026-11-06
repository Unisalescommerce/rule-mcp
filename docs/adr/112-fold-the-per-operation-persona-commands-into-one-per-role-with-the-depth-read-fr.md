# 112: Fold the per-operation persona commands into one per role, with the depth read from the request

- **Date**: 2026-09-23
- **Status**: accepted
- **Tags**: commands, personas, prompts, breaking
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

persona surface generated one prompt, one slash command and one skill per active role and operation: 19 roles x 3 operations = 57 names, plus older rule-mcp-{plan|audit|review}-* names before them. operation was suffix user had to choose before typing. Most runs start as audit, review is derived from audit, and plan from review, so stage is property of request more than of command. ADR 108 had already folded per-area check siblings into parent for same reason, and left parents to read mode from $ARGUMENTS.

## Decision

1. One prompt, one slash command and one skill per role: rule-persona-`<role>` (57 to 19 on each surface). 2. depth is read from request by single whole-token keyword module, core/review/roles/operation-intent, English and Italian, accent-insensitive: request that names plan runs operation=plan, request that names review runs operation=review, anything else runs operation=audit. Plan outranks review when both appear. 3. operations are cumulative: review runs audit first and derives docs/reviews/ from it, plan runs audit, review and plan. operation enum on rule_tool_plan is unchanged (plan|audit|review|all); template makes deeper operation include shallower ones. 4. Every surface reads same intent: MCP prompt resolver decides server-side from `topic`, agent command body states rule over $ARGUMENTS, and generated persona skill embeds same keyword lists. 5. old names are deleted, not aliased: agent-command sync purges every stale rule-persona-* file in every target directory, skills-install purges old per-operation and legacy skill directories.

## Consequences

persona surface drops from 57 to 19 on all three surfaces (prompts 37, slash commands 39, README counts updated). user no longer names stage: request does, in English or Italian. Whole-token matching keeps false positive like "plane" out. request that mentions plan by accident runs deepest ladder, which produces more documents than asked; deepest explicitly named stage winning is tradeoff that keeps rule simple. Callers of /rule-persona-`<role>`-audit switch to /rule-persona-`<role>` with no keyword, -review becomes "review...", -plan becomes "plan...".

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep 57 commands and add fourth umbrella command (rejected: more surface and same drift).
1. Decide operation only in model, with no shared intent module (rejected: prompt resolver, command body and generated skill would each carry their own keyword list and drift apart).
1. Add new operation value audit-review to tool enum (rejected: making review and plan cumulative fixes behavior without growing public contract).
1. Keep deprecated aliases for old names (rejected: ADR 107 and ADR 108 keep removed names removed).
