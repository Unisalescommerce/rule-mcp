# 090: develop merges into main by area, and stays as an integration branch

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: process, git, merge, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

main and develop diverged for 95 and 71 commits from d8788ed, with 213 conflicting paths. main had built OSS, legal and CI layer (SPDX on 950 files, DCO, CodeQL, Scorecard, REUSE, governance, docs site, verified release artifacts) and develop had built TokenSave integration, three-layer skill resolution, guardrails-in-skills, SDK surface and full-screen wizard. Six commits existed on both sides with different hashes. Eight features had been implemented twice, independently, and git could not see most of them: same rules split into per-rule files under different directories, same bootstrap scripts rewritten, same test file rewritten, same close-session archiving written twice.

## Decision

One merge commit, resolved by area rather than by hunk, followed by reconciliation commits. OSS, legal and CI layer comes from main; restructured subsystems come from develop, because restructure resolved half is broken. For each duplicated feature single side wins, recorded in plan that drove merge: develop's close-session archiving, develop's wizard without main's git-hook step, develop's Open Source Steward persona, develop's bootstraps with main's pinned URL, main's numbering for ADRs with develop's unique decisions appended from 088, main's scaffold test against main's implementation, and both sides' additions to numbering doctor. develop is not deleted: it is reset onto main and kept as integration branch.

## Consequences

71 develop commits stay readable in graph instead of being replayed, which rebase would have done against two cross-cutting mechanical passes on main. Every in-code ADR reference develop carried was remapped to main's numbering, so two numbering schemes do not coexist. Four main features were found switched off rather than deleted - their code survived merge while call site did not - which is failure mode area-resolved merge produces and test suite is what caught it. Resetting develop onto main after every merge keeps this from recurring at this scale.

## What would end this

second long-lived branch, or policy that main is only branch. Either removes integration branch this keeps alive.

## Alternatives Considered

1. Rebase develop's 71 commits onto main (rejected: three cross-cutting restructures on develop would replay against two on main, multiplying same conflicts by commit)
1. Squash develop into thematic commits (rejected: loses M0-M8 and B-1..B-5 tracking plans reference)
1. Take develop wholesale (rejected: 135 files main added after fork are absent from develop, including entire OSS and legal layer)
