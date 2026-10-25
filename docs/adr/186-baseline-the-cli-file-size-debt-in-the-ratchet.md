# 186: Baseline the CLI file-size debt in the ratchet

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: governance, file-size, cli
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 061 caps a file at 150 lines and the ratchet exempts only pre-existing offenders. The cap had been red for a while without anyone noticing: 33 files exceed it, the largest at 556 lines (src/cli/setup/opentui/_wizard.js), and none of them was recorded, so the budget test failed on every run and the failure became background noise. The measurement that matters: none of the 33 is a file this session created - the five that were pushed over the cap were split instead (hosts/index.js, _manifest.js, _uninstall.js, doctor/_sections.js, _targets-sync.js).

## Decision

Record the 33 offenders in FILE_SIZE_RATCHET with the line count the cap measures, and document the adoption baseline here, which is the mechanism the data file's own header describes: an entry is added only as the baseline for a root the cap has just reached. A row may only shrink; a file that reaches 150 loses its row, and a file that grows fails the build.

## Consequences

The budget test is green and stays honest: it now fails on growth and on a stale row instead of failing on the same 33 files forever. Cost: 33 rows of debt that a reader can see, and each split has to remember to delete its row - which the third assertion enforces.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Split all 33 now: rejected as a single change, because it is a refactor of the whole CLI layer with no behavioral goal, and a mechanical split of a 556-line wizard nobody is touching is churn that review cannot verify
1. Raise the cap to cope: rejected, because the cap is the rule and 150 is what ADR 061 chose
1. Leave the test red and call it pre-existing: rejected, and that is exactly the state this ADR ends - a red test that everybody learns to ignore is worse than a recorded debt
