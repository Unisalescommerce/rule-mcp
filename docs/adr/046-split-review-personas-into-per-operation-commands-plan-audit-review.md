# 046: Split review personas into per-operation commands (plan/audit/review)

- **Date**: 2026-09-05
- **Status**: accepted
- **Tags**: personas, commands, prompts, surface
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Each of 7 active review personas shipped as one combined command, rule-mcp-plan-`<role>`, whose template instructs one run to produce all three documents of trio (docs/audits, docs/reviews, docs/plans). Running only one step meant user invoked combined command and mentally ignored two thirds of contract; per-role command body was also generic routing recap, so persona-specific operation contract only surfaced via MCP prompt, which is suppressed on hosts that install clean slash commands.

## Decision

Give each active role three slash commands - `rule-persona-<role>-plan`, `rule-persona-<role>-audit`, `rule-persona-<role>-review` (naming finalized in ADR 105; originally shipped as `rule-mcp-plan-<role>` / `rule-mcp-audit-<role>` / `rule-mcp-review-<role>`), all generated from same registry and all routing through tools under hood: command body calls rule_tool_plan (with role and operation) to fetch operation contract, and rule_tool_plan_docs for trio bookkeeping. template's header clause and operation section are now operation-aware; rule_tool_plan gained optional operation parameter (default all three, unchanged for existing callers). Combined plan command becomes plan-only.

## Consequences

Positive: the user can run just the step they need; every command body names the exact tools to call, so agent behavior no longer depends on which surface the host exposes; proposed roles still stay out of the surfaces automatically. Negative: the command set grows by 14 names per agent (21 persona commands); the plan-only command no longer performs the audit/review pass in the same run, so users wanting the full trio run three commands or call rule_tool_plan without an operation. Tests pin the 48-prompt union and the parity fixture was regenerated to match.

## What would end this

single run of trio stops being user's default and per-step runs become habit.
Once that is routine, explicit `rule_tool_plan` call with no operation is combined
contract and three per-role commands could be collapsed back, or extended to a
fourth operation (e.g. `rule-mcp-close-*`) if lifecycle needs it.

## Alternatives Considered

1. Keep plan-only commands and run audit/review via rule_tool_plan explicitly (option 2: 7 commands)
1. Ship plan + audit as commands, review via tool only (option 3: 14 commands)
1. Only 4 core personas get commands (option 4: 12 commands)
