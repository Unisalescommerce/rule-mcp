# 139: Never install commit hooks into a machine-wide core.hooksPath

- **Date**: 2026-10-18
- **Status**: accepted
- **Tags**: git, hooks, governance, security
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

commit-governance installer detects project's hook mechanism. It read `core.hooksPath` with `git config --get`, which also returns value set in user's global or system config. On machine whose `~/.config/git/config` sets `core.hooksPath = ~/.config/git/hooks`, installing governance in any repository without its own `.githooks/` so wrote `commit-msg` and `pre-push` shims into that shared directory and kept `.rule-mcp-backup` copies of whatever was there. effect was observed on 2026-10-18: shared hooks were rewritten, and every commit in every unrelated repository started going through this project's `commit-lint`, which rejects any subject that is not `type(scope): subject`. second, quieter symptom was that docs-numbering-doctor fixtures committed with `git commit -m first` in temp repository and so passed inside suite while failing on their own, because they inherited user's hooks path instead of private config.

## Decision

installer reads `core.hooksPath` with `--local`, so only setting repository itself carries is treated as that project's mechanism. global or system value is ignored and installer falls back to git's own hooks directory, which `git rev-parse --absolute-git-dir` resolves per repository. Hooks project owns live in `.githooks/` or in directory it configured itself; user's shared directory is never target. Fixtures that create repository set private global config (`GIT_CONFIG_GLOBAL` pointing at empty file, `GIT_CONFIG_NOSYSTEM=1`) so ambient setting cannot decide whether test passes.

## Consequences

Positive: an install can no longer reach outside the repository it was asked to govern, and no `.rule-mcp-backup` is written over a hook the user owns for every repository on the machine. A test pins the rule with a private global config that sets `core.hooksPath` and asserts the directory stays empty and the gate lands in `.git/hooks`. The docs-numbering-doctor fixture passes alone, not only inside the suite. Negative: a user who deliberately configures `core.hooksPath` globally and expects this installer to honor it now gets git's own hooks directory instead; that is the intended trade, since the global setting is the person's and not the project's.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep `--get` and add containment check that refuses any target outside repository's git directory, as `scripts/install/git-hooks/index.mjs` does. Rejected as primary rule because it still reads machine's setting and would move global hooks path into error user cannot act on.
1. Keep `--get` and refuse to install anything when resolved path is outside repository. Rejected for same reason, with added cost of leaving project with no gate at all.
1. Ask user at install time whether to adopt global directory. Rejected: installer that needs answer for case user never intended is worse default than ignoring machine-wide setting.
