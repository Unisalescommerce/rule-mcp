# Pending: Use offline Betterleaks scans for Git credential checks

- **Date**: 2026-11-05
- **Status**: accepted
- **Tags**: security, git, guardrails
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The existing secret rule checks assignments with one regex. Git hooks need broader provider detection and coverage of intermediate commits.

## Decision

Use Betterleaks v2 through a bounded subprocess. Disable validation and analysis explicitly. Redact output and omit secret values from findings. Scan staged patches or individual commit patches. Pin the CI binary and its checksum. Keep local hook failures advisory when scanning cannot run. CI requires the pinned binary and rejects scan failures. Pin workspace dependencies to current local versions.

## Consequences

Credential findings block the tracked pre-commit hook. The agent hook asks for confirmation. Missing local scanners remain a coverage gap. CI history scans can exceed the patch cap. Rules still depend on the selected scanner configuration. Native entropy, BPE and curated provider checks remain planned, not shipped.

## What would end this

Replace this integration if scanner reports cannot be bounded and parsed reliably, or if a native implementation achieves measured equivalent coverage.

## Alternatives Considered

1. Keep the assignment regex only.
1. Port the entire scanner and Expr runtime into JavaScript.
1. Require every developer to install the scanner before allowing commits.
