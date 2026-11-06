# 205: main is the only branch after one final history rewrite

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: git, history, release, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

main and rel/v0.1.0 shared no commit, so pull request between them was impossible and visitor met two-week-old main with old layout. tree also carried two paths that history did not need: docs/case-studies, whose 386 files live in talk repository, and coverage/tmp, whose JSON blobs were largest in repository. Separately, one commit message used type linter rejects, and credential scan had never run over history.

## Decision

Rewrite history once, then make rel/v0.1.0 new main. filter-repo drops docs/case-studies and coverage/tmp from every commit and rewrites `clean(core):` to `refactor(core):`. push is lease over old main sha, and rel/v0.1.0 is deleted from remote afterwards. Local refs/original and reflog are purged. After this, no rewrite and no force-push: main is only branch and freeze holds.

## Consequences

Positive: one branch, one linear history, and the repository is 32 MB instead of 68 MB. Positive: every commit on main satisfies the Conventional Commit rule, so the lint gate is meaningful. Negative: every hash cited in an ADR or a handoff written before the rewrite no longer resolves; that cost is accepted and this record is the marker. Negative: three CI jobs stay red on main for reasons recorded in the publication plan: 193 lint errors, branch coverage at 90.7 percent against a 92 percent floor, and a credential scan that reports the seven example credentials the owner chose to keep.

## What would end this

credential is found in main that was written after freeze, which reopens question of what history may contain.

## Alternatives Considered

1. Merge main into rel/v0.1.0 and keep two branches
1. Keep case-study code in this repository and never rewrite
1. Rewrite only paths and leave commit message alone
