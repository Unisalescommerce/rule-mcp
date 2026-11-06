# 098: Check runs per area, and the general check auto-detects it

- **Date**: 2026-09-18
- **Status**: superseded (area siblings; `/rule-check` kept by ADR 108)
- **Tags**: commands, prompts, guardrails
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>
- **Superseded by**: [108](108-fold-check-slash-siblings-into-parent-via-keyword-intent.md) (folds `/rule-area-*-check` into parents; keeps `/rule-check`)

## Context

MCP prompt registry carried `/rule-process-check` (validate code against rule-mcp guardrails) and `/rule-mcp-adr` (record decision), while agent command surface already had `/rule-check`. two check names spoke for same work, ADR prompt duplicated rule-process-adr skill, and single generic check gave no way to ask for one area's guardrails.

## Decision

Remove `/rule-mcp-adr` and `/rule-process-check` from MCP prompt registry. Give agent command surface one check command per area prompt, `/rule-area-<area>-check` (91 commands), each validating against that area's skill guardrails, plus general `/rule-check` that auto-detects area from git diff, chat context, or codebase. `commandDefinition` resolves `-check` suffix to its area prompt; `commandNames` appends derived names and sorts them with rest.

## Consequences

MCP prompts fall 155 to 153; reusable prompts 98 to 96. Agent slash commands rise 156 to 246, since one command per area now has check sibling. check is reachable both per area and generically, and two-name collision around `rule-check` is gone. persona and session families are untouched. ADR 105 later hard-deletes any leftover `rule-mcp-adr` / `rule-process-check` task-prompt cases and documents `/rule-area-process-adr` / `/rule-area-process-check` as only ADR/check entry points beside `/rule-check`.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep `/rule-process-check` as only MCP check prompt
1. Add `/rule-check` as MCP prompt instead of agent command
1. Give each area check prompt rather than agent command
