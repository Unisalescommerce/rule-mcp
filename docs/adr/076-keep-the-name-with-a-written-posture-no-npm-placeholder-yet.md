# 076: Keep the name with a written posture, no npm placeholder yet

- **Date**: 2026-09-10
- **Status**: accepted
- **Tags**: naming, legal
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

OSS-26: project name is neither protectable nor claimed. RuleMCP is common product word, and both npm package name and io.github.rule-mcp registry namespace are unclaimed. registry side is settled by ADR 073 (owner namespace); npm side cannot settle same way because publication is out of scope.

## Decision

Keep rule-mcp name with written trademark posture (TRADEMARK.md) instead of filing. No npm placeholder is published now; squat risk is recorded here openly. Revisit on 2027-03-10 or when npm publication returns to scope, whichever comes first.

## Consequences

TRADEMARK.md states boundary; README links it next to license; npm placeholder decision stays explicit open owner item with review date.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Claim trademark protection now (rejected: premature for unregistered name on unfunded single-maintainer project)
1. Decide npm placeholder in this ADR (rejected: owner deferred call; risk is recorded here instead of silently left)
