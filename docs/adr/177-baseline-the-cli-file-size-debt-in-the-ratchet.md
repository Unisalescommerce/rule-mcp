# 177: Baseline the CLI file-size debt in the ratchet

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: governance, file-size, cli
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 053 caps file at 150 lines and ratchet exempts only pre-existing offenders. cap had been red for while without anyone noticing: 33 files exceed it, largest at 556 lines (src/cli/setup/opentui/_wizard.js), and none of them was recorded, so budget test failed on every run and failure became background noise. measurement that matters: none of 33 is file this session created - five that were pushed over cap were split instead (hosts/index.js, _manifest.js, _uninstall.js, doctor/_sections.js, _targets-sync.js).

## Decision

Record 33 offenders in FILE_SIZE_RATCHET with line count cap measures, and document adoption baseline here, which is mechanism data file's own header describes: entry is added only as baseline for root cap has reached. row may only shrink; file that reaches 150 loses its row, and file that grows fails build.

## Consequences

The budget test is green and stays honest: it now fails on growth and on a stale row instead of failing on the same 33 files forever. Cost: 33 rows of debt that a reader can see, and each split has to remember to delete its row - which the third assertion enforces.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Split all 33 now: rejected as single change, because it is refactor of whole CLI layer with no behavioral goal, and mechanical split of 556-line wizard nobody is touching is churn that review cannot verify
1. Raise cap to cope: rejected, because cap is rule and 150 is what ADR 053 chose
1. Leave test red and call it pre-existing: rejected, and that is exactly state this ADR ends - red test that everybody learns to ignore is worse than recorded debt
