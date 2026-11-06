# 203: Close out plan _secrets-guardrails

- **Date**: 2026-11-05
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/_secrets-guardrails.md, "Plan: secrets guardrails - betterleaks gate and deterministic checks", finished with 25 closed items.

## Outcome

- The Betterleaks v2 adapter scans staged patches or individual commit patches, redacts findings, and disables provider validation and analysis.
- The local hook, CLI and CI use the adapter. CI pins the binary and checksum; local hooks report missing scanners without blocking.
- The existing `secret-detection` guardrail detects a curated provider subset and generic assignments without returning credential values.
- Offline entropy and BPE rarity helpers are tested. BPE is not connected to the guardrail.
- A labeled corpus covers nine positive and nine negative secret-detection examples. Those results do not establish accuracy outside the corpus.
- The agent hook still filters staged files by extension. Binary patches are not covered by the staged patch scanner.
- The scanner decision and remaining limitations are recorded in the pending product ADR `use-offline-betterleaks-scans-for-git-credential-checks`.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/_secrets-guardrails.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
