# 186: Write ADRs when a policy says so at handoff by default

- **Date**: 2026-10-28
- **Status**: accepted
- **Tags**: adr, policy, architecture
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADRs were always written mid-task when asked, and AUTO_ADR had only on/off kill switch. Installer-scope step 4 needs levels full/handoff/on-demand with project file, env, and env.json resolution.

## Decision

Add core/adr-policy (words, resolve, rule). Default handoff: process_adr with moment=task answers Not written; moment=handoff writes. Category overrides and aliases (decision->full, off->on-demand). Reminder/instruction/followup/index use policy rule. Cache keys include policyFingerprint. AUTO_ADR no-ops under handoff/on-demand.

## Consequences

Positive: mid-task ADR spam stops by default; handoff and full remain available. Negative: existing callers must pass moment=handoff or set RULE_MCP_ADR_POLICY=full; pending ADR numbering stays step 5.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep always-write (rejected: plan needs handoff default)
1. Merge policy sources (rejected: first source wins whole)
