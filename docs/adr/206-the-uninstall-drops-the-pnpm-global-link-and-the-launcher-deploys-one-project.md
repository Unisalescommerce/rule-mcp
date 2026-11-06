# 206: The uninstall drops the pnpm global link, and the launcher deploys one project

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: installer, pnpm, launcher
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Two failures on a machine that had run the uninstall and then `pnpm setup`.

The install claimed the global bin twice: from `scripts/reinstall.sh` and from a root `postinstall` running `pnpm install -g .` with stderr dropped, so only the script's copy of a failure was ever visible.

The uninstall removed the shim and left the pnpm global link in place. `linkCandidates` looked in `~/Library/pnpm/global/<layout>/node_modules/rule-mcp`: the store root was wrong whenever `PNPM_HOME` relocated it (here `~/Library/pnpm/bin`), the per-project hash directory of the pnpm 10+ layout was missing, and only the current package name was matched while the root manifest answers to a second name, `rule-mcp`. The next install therefore met a bin `rule-mcp` still claimed by a package the uninstall had reported as removed, and died on ERR_PNPM_GLOBAL_BIN_CONFLICT.

The launcher copy failed too: `pnpm deploy --prod --legacy <target>` from a workspace root answers ERR_PNPM_CANNOT_DEPLOY_MANY, because the root holds more than one project. The failed run also left an empty `~/.rule-mcp/launcher/<version>` behind, which the record did not name and the next install could not tell apart from a real copy.

## Decision

The uninstall owns the link, and the launcher names the project it copies.

`linkCandidates` sweeps the store roots a pnpm install can actually use (`$PNPM_HOME/global` when it belongs to the home being swept, plus the macOS and Linux defaults), both layouts (flat, and one directory per install), and both package names. A `PNPM_HOME` outside the home a caller passed contributes nothing, so a sandboxed uninstall cannot sweep real paths. Removal asks pnpm to drop the package (`pnpm remove -g <name>`) before sweeping the leftover link by hand, because only pnpm clears the manifest entry the bin conflict is reported against. The scan reports a link as something installed, so the uninstall wizard offers the group that removes it.

The deploy command is `pnpm --filter <name from the checkout manifest> deploy --prod --legacy <target>` when the checkout has a `pnpm-workspace.yaml`, and plain `pnpm deploy` otherwise. A failed deploy removes the directory it created.

`scripts/reinstall.sh` is the only place that installs the global bin; the root `postinstall` that did the same is gone, which also stops `pnpm deploy` from triggering a global install of the checkout from inside the copy.

## Consequences

Positive: uninstall plus setup now round-trips; the launcher copy is produced by a command pnpm accepts in this workspace; an empty launcher directory can no longer be mistaken for a copy; one owner for the global bin.

Negative: the uninstall shells out to `pnpm`, so on a machine without pnpm on PATH the leftover link is swept by hand and pnpm's manifest keeps its stale entry until the next pnpm run. The deploy filter needs the checkout to be the workspace root; deploying from a package subdirectory still fails, and nothing here measures it.

## What would end this

A pnpm release makes `pnpm deploy` accept a workspace root, or the root package stops being a workspace member and the filter becomes unnecessary.

## Alternatives Considered

1. Keep the postinstall and let the script fail loudly: two installers still race on one bin, and every `pnpm install` in the checkout claims a global path the user may have uninstalled on purpose.
1. Unlink the global link directly instead of calling `pnpm remove -g`: faster, but it leaves pnpm's project manifest claiming the bin, which is the same conflict at the next install.
1. Enumerate pnpm layout directories by version (`v11`, `5`, ...): a list that rots at the next layout change; reading the directories under the store root does not.
1. Hardcode the package name in the deploy filter: rots at the next rename, and the manifest is right there.
