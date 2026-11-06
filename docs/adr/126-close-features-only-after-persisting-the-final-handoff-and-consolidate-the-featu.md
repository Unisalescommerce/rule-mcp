# 126: Close features only after persisting the final handoff and consolidate the feature by default

- **Date**: 2026-10-12
- **Status**: accepted
- **Tags**: git, handoff, adr
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

/rule-handoff close-feature prompt needed extra squash token and placed rewrite ahead of final handoff commit. existing squash backend already consolidates in-range ADRs and handoffs behind confirmation gate, but command did not invoke it by default.

## Decision

Treat close-feature as implicit squash intent. Commit all pending work, closeout ADRs, and final handoff first; then show read-only squash plan and need user confirmation before rewriting feature into one commit. Keep old squash token accepted for compatibility; do not rewrite out-of-range documents.

## Consequences

resulting feature commit includes final handoff and consolidated ADR/handoff documents, with no post-squash commits. close still pauses for explicit user consent; session-only handoff remains unchanged.

## What would end this

This ordering would need revision if handoffs stopped being committed documents or squash backend stopped including all documents committed in feature range.

## Alternatives Considered

1. Squash before generating last handoff: leaves second commit after squash.
1. Automatically confirm rewrite: unsafe for history-changing operations.
