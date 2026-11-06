# 185: Follow only real renames when dating a numbered document

- **Date**: 2026-10-28
- **Status**: accepted
- **Tags**: docs, numbering, git
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

git log --follow defaults to -M50%, so new ADR built on same template can inherit deleted file's date and author. Distinct ADRs measure at most ~32% similar; real renames at least ~85%.

## Decision

Pass -M70% (RENAME_SIMILARITY) before --follow in createdAt and addedBy in docs-numbering/_git.js. Calibrated fixtures: ~59% stays new file; ~81% still follows as rename.

## Consequences

Positive: template copies keep their own date/author. Negative: renames between 50% and 70% similarity no longer follow (acceptable; true renames sit higher).

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep git default -M50% (rejected: false renames on template copies)
1. Use -M85% (rejected: calibrated real-rename fixture measured ~81%)
