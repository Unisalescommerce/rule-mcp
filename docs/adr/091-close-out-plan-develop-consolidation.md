# 091: Close out plan develop-consolidation

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/develop-consolidation.md, "develop-consolidation plan", finished with 53 resolved items on 2026-09-15. It tracked landing every unique commit of develop onto main while keeping OSS, legal and CI hardening main had built after fork, then resetting develop onto main as integration branch. It ran as one merge commit resolved by area over 213 conflicting paths, followed by phases 2 to 7 as ordinary commits. Measured on landed result: 83 commits and 828 changed files ahead of pre-merge main (964a32b0), test:all 1734 pass with 0 fail and 3 skipped, branch coverage 91.03 percent against floor of 91, lint clean.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history. decisions consolidation carried are recorded by ADR 089 (release target returns to v0.1.0-beta) and ADR 090 (develop merges into main by area, and stays as integration branch).

## Consequences

docs/plans/develop-consolidation.md is gone from tree; handoff of this session names what it carried. main, origin/main, develop and origin/develop all point at c33c9e46, so develop is now integration branch reset onto main after every merge rather than parallel line of work. merge also exposed one gate fork had broken: eslint-plugin-unicorn 74 adds single-line-block-comment-style to its recommended set with multiline default, which turned lint gate red on 1493 sites, all of them one-line block comments; fix pins rule to single-line in eslint.config.mjs instead of reformatting tree.

## What would end this

assumption this leans on is that develop carries nothing but work that belongs on main. commit on develop that main must not receive would make reset wrong, and would need branch of its own instead.
