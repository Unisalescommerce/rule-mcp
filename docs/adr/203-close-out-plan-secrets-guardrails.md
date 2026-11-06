# 203: Close out plan _secrets-guardrails

- **Date**: 2026-11-05
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/_secrets-guardrails.md, "Plan: secrets guardrails - betterleaks gate and deterministic checks", finished with 25 closed items.

## Outcome

- Betterleaks v2 adapter scans staged patches or individual commit patches, redacts findings, and disables provider validation and analysis.
- local hook, CLI and CI use adapter. CI pins binary and checksum; local hooks report missing scanners without blocking.
- existing `secret-detection` guardrail detects curated provider subset and generic assignments without returning credential values.
- Offline entropy and BPE rarity helpers are tested. BPE is not connected to guardrail.
- labeled corpus covers nine positive and nine negative secret-detection examples. Those results do not establish accuracy outside corpus.
- agent hook still filters staged files by extension. Binary patches are not covered by staged patch scanner.
- scanner decision and remaining limitations are recorded in pending product ADR `use-offline-betterleaks-scans-for-git-credential-checks`.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/_secrets-guardrails.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
