# 179: Codex named hooks and Codex/Copilot command file targets

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, hooks, commands, codex, copilot
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Codex /hooks listed every rule-mcp guard as Unnamed hook because handlers lacked statusMessage (Codex paints statusMessage as the row title, falling back to Unnamed hook). Codex and Copilot were documented gaps in AGENTS_WITHOUT_COMMAND_SURFACE even though published locations exist: ~/.codex/prompts/*.md as /prompts:<name>, and ~/.copilot/skills/<name>/SKILL.md as /<name>.

## Decision

Write statusMessage on every Codex command handler in codexHooks. Register Codex as an args-format target under ~/.codex/prompts and Copilot CLI as a nested-skill (devin) target under ~/.copilot/skills. Extend syncCommandTargets to mkdir parent dirs for nested SKILL.md paths and remove rule/ plus rule-* skill directories on uninstall. Keep Copilot extension SDK slash commands and Codex skills migration out of this change.

## Consequences

Positive: /hooks shows rule-mcp titles after reinstall+trust; install sync drops /prompts:rule* for Codex and /rule* skills for Copilot CLI. Negative: Codex custom prompts remain deprecated upstream, so invocations stay /prompts:<name> not bare /rule*; Copilot true slash via extension SDK is still out of scope.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave Codex/Copilot as documented gaps and only name hooks
1. Write Codex skills under ~/.codex/skills instead of deprecated prompts
1. Ship a Copilot CLI extension for true slash instead of skill files
