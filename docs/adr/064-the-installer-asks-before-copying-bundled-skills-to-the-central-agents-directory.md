# 064: The installer asks before copying bundled skills to the central agents directory

- **Date**: 2026-09-08
- **Status**: accepted
- **Tags**: installer, skills, devx, bash, powershell
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-mcp installers (scripts/install.sh and scripts/install.ps1) configured agents, rules, commands and services, but never touched bundled rule-mcp-* skills: MCP server serves them directly from its embedded catalog. Users who wanted their agent to see skills natively (agents such as Pi read ~/.agents/skills) had to run scripts/install-skills.sh or CLI skills installer separately, both of which copy whole 89-skill catalog to central ~/.agents/skills location without asking. user installing with install.sh reported ending up with full skill catalog centralized with no step that offered choice.

## Decision

Add skills step to both installers that asks before copying. install.sh gains Phase 6c "Bundled Skills" and install.ps1 gains Phase 4: in interactive TTY runs it prompts "Install bundled rule-mcp-* skills to ~/.agents/skills? [y/N]" defaulting to No, so plain Enter or EOF never centralizes catalog; copy itself runs through argv-safe CLI (rule-mcp skills install --all) which works for both local-repo and curl-piped installs and uses embedded catalog. New flags --skills/-Skills force copy and --no-skills/-NoSkills skip step for non-interactive and CI runs, where installer otherwise prints skip hint instead of prompting. PTY acceptance test now feeds No answer and asserts prompt/skip; static selection test asserts non-interactive runs never prompt; PowerShell contract test asserts skills helper and prompt.

## Consequences

Positive: installing now asks before centralizing any skill; non-interactive runs stay silent by default and are deterministic via the new flags; bash and PowerShell behave identically; the copy path is the same argv-safe CLI used everywhere else. Negative: interactive users get one more Enter; agents that only read ~/.agents/skills natively need an explicit yes or --skills to see the rule-mcp-* skills locally (the MCP server still serves them regardless); the wizard stays two-step so per-skill selection still lives in the standalone CLI.

## What would end this

assumption this leans on is that copying skills to ~/.agents/skills is optional extra that deserves explicit yes. It would be wrong if native ~/.agents/skills loading became only way agents receive rule-mcp-* skills (MCP delivery removed), or if curated subset rather than full catalog became normal install target - each would change default, and per-skill picker would then have to move into wizard step itself.

## Alternatives Considered

1. Default skills step to Yes so agents get native skills by default - rejected: it re-centers 89 skills on plain Enter, exact surprise being reported
1. Reuse scripts/install-skills.sh from installer - rejected: it resolves ../skills relative to script, which breaks curl-piped installs, while CLI uses embedded catalog and single-binary form
1. Add third full-screen TUI step with per-skill checkboxes - rejected: ADR 062 keeps wizard two-step alt-screen TUI; CLI already ships checkbox picker (rule-mcp skills install) for granular selection
