# 080: A persona topic is the binding scope of the run

- **Date**: 2026-09-12
- **Status**: accepted
- **Tags**: personas, prompts, review, tokensave
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

persona surfaces (54 prompts, 54 agent commands, rule_tool_plan) accepted free-text topic, but filled template injected it as one soft line (Focus this run on) after lens list, while opening action line and operation contract still said whole project. stronger, repeated instruction won: scoped request still produced whole-project runs. Worse, scoped run reported fewer findings, and mergeFindings flipped every unreported open finding to resolved, corrupting audit/review/plan trio bookkeeping.

## Decision

The topic becomes the binding scope everywhere the template speaks: the action line names the scope instead of the project, a dedicated 'Scope: binding' section forbids reading, auditing or reporting outside it (with a one-line 'Out of scope observations' escape valve), the lenses are reframed as 'applied to the scope above' with a 'not applicable' exit, and the operation contract states the scope and orders it passed to rule_tool_plan_docs. A scoped run also gets a 'Resolve the scope' section telling the agent to map the scope to concrete files and symbols with tokensave_context/tokensave_files/tokensave_impact; rule_tool_plan detects .tokensave/ in projectDir and states availability, other surfaces instruct a tokensave_status probe. rule_tool_plan_docs gains a scope parameter: with it, mergeFindings preserves unreported findings untouched (no resolve flip, no prune). rule_tool_plan is now non-cacheable because its output depends on the filesystem. Without a topic every surface is byte for byte what it always was.

## Consequences

user request like /rule-persona-security-audit SSE daemon now produces run confined to that scope, and repeated scoped runs no longer mark whole-project findings resolved by silence. trio headers record scope of last run. Cost: scoped run can never close findings outside its scope, so periodic whole-project run is still what retires them; and rule_tool_plan answers are recomputed on every call, which is cheap string work.

## What would end this

This leans on assumption that prompt-level contract is enough to confine run: no code enforces boundary. Scoped runs that still read and report across whole project, or agents that skip scope parameter and corrupt trio anyway, would prove instruction is not enforcement and push scope into rule_tool_plan_docs validation instead.

## Alternatives Considered

1. Keep soft focus line and rely on model to narrow - rejected: whole-project action line dominated and scope was ignored
1. Per-topic output files (docs/audits/`<role>`-`<slug>`.md) - rejected as scope creep: one file per role stays, header records scope
1. Have server call tokensave itself at generation time - impossible: tokensave is separate MCP server mediated by client, generator stays deterministic
