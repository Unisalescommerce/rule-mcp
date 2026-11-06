# 105: Rename the command surface under process and persona namespaces

- **Date**: 2026-09-22
- **Status**: accepted
- **Tags**: commands, prompts, personas, compression, breaking, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

slash-command surface still mixed namespaces: flight lived as top-level one-shot (`/rule-mcp-flight`), ADR and process-check one-shots duplicated area skills that ADR 098 already preferred, compression was its own area (`rule-compression` / `/rule-area-compression*`) instead of process skill, and persona commands used `rule-mcp-{plan|audit|review}-<role>` rather than shared `persona` prefix. Install local copies and docs drifted. release target for this break is `0.2.0-rc` (not 1.0.0).

## Decision

Breaking rename of public command/skill/tool surface:

1. Flight leaves slash/prompt surface: conceptual id `rule-area-process-flight`, injected on every prompt via session directive (ADR 106). `/rule-mcp-flight` and `/rule-process-flight` are hard-deleted.
2. Hard-delete `/rule-mcp-adr` and `/rule-process-check`; callers use `/rule-area-process-adr` and `/rule-area-process-check`. `/rule-check` remains auto-detecting agent command.
3. Rename skill `rule-compression` -> `rule-process-compression` (inherits `rule-process`). Area commands become `/rule-area-process-compression[-check]`. Skill tool becomes `rule_tool_process_compression`. `rule_tool_compress` (pure text) is unchanged.
4. Persona commands become `rule-persona-<role>-<operation>` (operation last). Shared helpers `personaCommandName` / `parsePersonaCommand` drive registry, MCP getPrompt, agent commands, and skills-install. Legacy `rule-mcp-{op}-{role}` persona skill dirs are purged on regenerate.
5. `/rule-handoff`, `/rule-handon`, and `/rule-check` stay as named.
6. No compatibility aliases. Package version bumps to `0.2.0-rc`.

## Note

Superseded in part by ADR 107: flight moved to directive injection (ADR 106); process-compression and process-handoff skills/areas were removed in favor of `rule_tool_compress`/`/rule-compress` and `rule_tool_handoff`/`/rule-handoff`.

## Consequences

Every future install writes new names only. Stale agent command files and `~/.agents/skills` persona dirs must be purged and reinstalled. Callers of `rule_tool_compression` or old slash names break until they migrate. Census, README, and persona docs follow new names. Historical ADRs that prescribed old names are rewritten to match this decision.

## What would end this

need for short aliases (`/rule-mcp-audit-security`) that outweighs single discoverable namespace would revive shims; until then hard delete stands. Flight injection policy lives in ADR 106.

## Alternatives Considered

1. Keep old names and add new ones beside them (surface doubles; drift returns)
1. Jump to 1.0.0 for break (rejected: release line stays pre-1.0 at `0.2.0-rc`)
1. Rename only agent commands, leave MCP prompt registry (two truths)
