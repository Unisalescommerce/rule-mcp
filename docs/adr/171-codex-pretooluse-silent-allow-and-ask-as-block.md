# 171: Codex PreToolUse silent allow and ask as block

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: hooks, codex, guard
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Codex PreToolUse fails any hook that prints permissionDecision:allow without updatedInput, and rejects permissionDecision:ask. rule-mcp guard always emitted Claude-shaped allow JSON, so every successful Bash/structure pass showed Hook failed: unsupported permissionDecision:allow and interrupted agent turn.

## Decision

Make ALLOW silent {} for every host. Encode Codex answers at write boundary: allow stays silent; ask becomes decision:block with reason; deny keeps permissionDecision:deny. Tag Codex installed hook commands with RULE_MCP_HOOK_HOST=codex so encoding works without turn_id. neverBlocks strips decision fields instead of rewriting them to allow.

## Consequences

Positive: Codex PreToolUse no longer fails on every allow; migrations and structural confirms still stop the tool via decision:block. Negative: on Codex, ask is no longer a native confirmation prompt until PermissionRequest is wired; Claude and Cursor keep permissionDecision:ask.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave Claude allow JSON and only strip it when turn_id is present
1. Map Codex ask to PermissionRequest instead of decision:block
1. Exit 2 with stderr for Codex blocks
