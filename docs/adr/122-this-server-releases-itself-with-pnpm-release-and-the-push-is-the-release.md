# 122: This server releases itself with pnpm release, and the push is the release

- **Date**: 2026-10-01
- **Status**: accepted
- **Tags**: release, versioning, git
- **Author**: Emiliano Pisu <emiliano.pisu@pixu1980.com>

## Context

repository already derives next version and changelog from the
commit rule (ADR 119) but had no single command that cut tag. manual
`pnpm release` that plans, regenerates, checks, commits and pushes is the
missing half.

## Decision

`scripts/release` plans then applies. plan fetches origin with tags and
refuses, all at once, branch other than main, uncommitted tracked changes, a
main behind origin/main, range with nothing to release, and tag that
already exists. apply stamps version (package.json, server.json,
CHANGELOG heading), regenerates census, writes changelog with new
version as heading of untagged commits, runs `pnpm run ci`, commits
`chore(release): vX.Y.Z`, tags it annotated, and pushes main and tag with
`git push --atomic`. `--dry-run` stops at plan, `--no-checks` skips ci,
`--no-push` stays local.

## Consequences

Tags become release record `rule_tool_update` reads. run fails closed:
any failing step stops before commit.

## What would end this

If releases move to protected main that only merge requests reach, push
becomes merge request and tag is cut by pipeline.
