# 188: Own every user-facing switch as a feature

- **Date**: 2026-10-28
- **Status**: accepted
- **Tags**: installer, features, api
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Installer-scope step 6 needed a single catalog for ADR, telemetry, update, tokensave and minimal-tools instead of raw env toggles scattered across setup flags.

## Decision

Add src/core/runtime/features with level→env writers, persist under RULE_MCP_HOME/config/env.json, expose feature list/enable/disable plus setup --feature/--adr-policy and a wizard Features step. RULE_MCP_NO_ADR hides ADR tools and prompts; telemetry=anonymous drops prompt text, client name and installation id.

## Consequences

Positive: one vocabulary for switches and re-apply on enable. Negative: env.json moves to RULE_MCP_HOME (legacy ~/.config/rule-mcp still read); numbering-hook removal on adr=off still depends on install refresh.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep config env only
1. Per-host feature files
