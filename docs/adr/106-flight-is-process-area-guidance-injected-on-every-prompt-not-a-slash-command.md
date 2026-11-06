# 106: Flight is process-area guidance injected on every prompt, not a slash command

- **Date**: 2026-09-22
- **Status**: accepted
- **Tags**: commands, prompts, telemetry, directive, breaking
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 105 renamed `/rule-mcp-flight` to `/rule-process-flight` and kept it as exposed one-shot task prompt and agent slash command. Costing server is not user-invoked workflow like handoff or init: every session that forgets to check recorder wastes signal telemetry already collected. slash that only runs when remembered is wrong shape.

## Decision

1. Drop `/rule-process-flight` (and any `rule-mcp-flight` leftover) from MCP prompt registry and from agent command install. It is not listed, not aliased, and not area skill.
2. Keep conceptual id `rule-area-process-flight` under process namespace for docs and injected heading only.
3. Inject flight automatically with harness directive: SessionStart carries full block (export / show / prune / `rule_tool_stats`, read KPIs, propose only what recorder supports); UserPromptSubmit re-anchors with `flight when costing.` on every prompt.
4. Opt out with `RULE_MCP_NO_FLIGHT=1` without silencing rest of session directive. `RULE_MCP_NO_PROMPT_DIRECTIVE=1` still silences whole inject, flight included.

## Consequences

Agent slash commands fall by one (246 to 245). MCP prompts fall by one (153 to 152). Session and per-prompt context grow by flight block / fragment unless opted out. Callers of `/rule-process-flight` must rely on automatic inject or run `rule-mcp telemetry` / `rule_tool_stats` directly. ADR 105 item 1 is superseded for flight.

## What would end this

Evidence that per-prompt fragment costs more tokens than sessions it saves, or product need for explicit slash that outweighs automatic injection.

## Alternatives Considered

1. Keep `/rule-process-flight` as optional slash beside inject (two truths; slash stays forgotten)
1. Fold flight only into workflow reminder on tool results (too late: model already chose what to do)
1. Add `rule-process-flight` skill and `/rule-area-process-flight` area command (exposes surface user asked not to list)
