# 123: An update moves a git-clone install to the newest release tag, unasked

- **Date**: 2026-10-01
- **Status**: accepted
- **Tags**: update, release, install
- **Author**: Emiliano Pisu <emiliano.pisu@pixu1980.com>

## Context

With `pnpm release` cutting tags (ADR 122) there is better unit than a
commit for what update moves to. development machine left on old
release is failure this removes.

## Decision

After fetch (now `-p -P`, so withdrawn tag is never read as newest),
`releaseState` compares highest `v*` tag merged into `origin/main` with
highest merged into HEAD, manifest standing in before first tag.
newer one is applied by `applyUpgrade`: checkout main, pull `--rebase`, then
`scripts/reinstall.sh --keep-lock`. default mode is upgrade;
`RULE_MCP_AUTO_UPDATE=notify` announces only. automatic check applies
only on main and reports `not-on-main` otherwise; `rule_tool_update` and the
`update` CLI pass `explicit` and may switch branch. Before remote has
any tag, upstream branch is still fast-forwarded.

## Consequences

git-clone install follows release tags. lock is kept so release
installs what it pinned. pull that stops on conflict is left for person.
npm and docker installs are unchanged.

## What would end this

If automatic reinstall breaks machine that person then has to repair,
default returns to notify and upgrade stays one command away.
