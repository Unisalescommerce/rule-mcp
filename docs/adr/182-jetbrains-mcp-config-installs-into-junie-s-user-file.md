# 182: JetBrains MCP config installs into Junie's user file

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: installer, hosts, jetbrains
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

installJetbrains wrote process.cwd()/.idea/mcp.json, undocumented project path. Junie documents ~/.junie/mcp/mcp.json for user-level mcpServers. Uninstall must never sweep project directories.

## Decision

Export junieConfigPath as ~/.junie/mcp/mcp.json and use it for installJetbrains and hostRecord(jetbrains). Uninstall and detect follow host record. Do not delete or rewrite legacy .idea/mcp.json.

## Consequences

Positive: installs land where Junie reads them; install/uninstall/detect agree; project trees stay untouched. Negative: existing .idea/mcp.json entries are orphaned until the user removes them by hand; project-scope .junie/mcp/mcp.json still waits on installer-scope step 8.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep writing .idea/mcp.json until JetBrains documents path
1. Sweep .idea/mcp.json on uninstall (rejected: must never touch project dirs)
1. Write only project .junie/mcp/mcp.json (rejected: this step is user-level global install)
