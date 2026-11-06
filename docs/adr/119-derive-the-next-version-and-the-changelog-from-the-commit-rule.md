# 119: Derive the next version and the changelog from the commit rule

- **Date**: 2026-09-29
- **Status**: accepted
- **Tags**: release, git, workflow
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

WS8 asks that version not be chosen by hand when commits determine it. repository already generated its CHANGELOG from Conventional Commits and enforced same rule in hooks, pre-push gate and CI, but next number was still typed by person at tag time - one step where history already holds answer.

## Decision

`scripts/build/version/index.mjs --next` derives bump from commits since newest tag using shared rule in `src/core/commit`: `fix` is PATCH, `feat` is MINOR, `!` or `BREAKING CHANGE:` footer is MAJOR, anything else does not bump, and strongest wins. `--apply-next` writes it through existing `--apply` path. clone with no tags derives over all history, which is why CI runs `--next` as preview and changelog `--check` gate only when tags exist.

## Consequences

version is function of history, computed by same rule that gated commits, so version that disagrees with its commits cannot be produced by accident. changelog renderer also stops carrying its own subject regex and reads shared rule, which removes last duplicate of pattern outside hooks. CI gains release-preview job that prints derived version and gates changelog only when boundary is defined; tag creation and release stay on tag-triggered path.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep choosing version by hand and only check that three copies agree - drift check catches is between files, not between version and commits
1. Adopt release tool (semantic-release, changesets) - new dependency and second commit rule beside one hooks already enforce
1. Derive from PR title instead of commits - only works when every merge is squash, and this repository keeps linear history of real commits, not merge titles
1. Bump major on any breaking footer anywhere in log - footer on old, released commit would re-bump forever; boundary has to be newest tag
