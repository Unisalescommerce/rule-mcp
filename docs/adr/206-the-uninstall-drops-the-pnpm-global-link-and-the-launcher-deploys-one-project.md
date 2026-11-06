# 206: The uninstall drops the pnpm global link, and the launcher deploys one project

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: installer, pnpm, launcher
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Two failures on machine that had run uninstall and then `pnpm setup`.

The install claimed the global bin twice: from `scripts/reinstall.sh` and from a root `postinstall` running `pnpm install -g .` with stderr dropped, so only the script's copy of a failure was ever visible.

uninstall removed shim and left pnpm global link in place. `linkCandidates` looked in `~/Library/pnpm/global/<layout>/node_modules/rule-mcp`: store root was wrong whenever `PNPM_HOME` relocated it (here `~/Library/pnpm/bin`), per-project hash directory of pnpm 10+ layout was missing, and only current package name was matched while root manifest answers to second name, `rule-mcp`. next install so met bin `rule-mcp` still claimed by package uninstall had reported as removed, and died on ERR_PNPM_GLOBAL_BIN_CONFLICT.

The launcher copy failed too: `pnpm deploy --prod --legacy <target>` from a workspace root answers ERR_PNPM_CANNOT_DEPLOY_MANY, because the root holds more than one project. The failed run also left an empty `~/.rule-mcp/launcher/<version>` behind, which the record did not name and the next install could not tell apart from a real copy.

## Decision

uninstall owns link, and launcher names project it copies.

`linkCandidates` sweeps store roots pnpm install can use (`$PNPM_HOME/global` when it belongs to home being swept, plus macOS and Linux defaults), both layouts (flat, and one directory per install), and both package names. `PNPM_HOME` outside home caller passed contributes nothing, so sandboxed uninstall cannot sweep real paths. Removal asks pnpm to drop package (`pnpm remove -g <name>`) before sweeping leftover link by hand, because only pnpm clears manifest entry bin conflict is reported against. scan reports link as something installed, so uninstall wizard offers group that removes it.

deploy command is `pnpm --filter <name from the checkout manifest> deploy --prod --legacy <target>` when checkout has `pnpm-workspace.yaml`, and plain `pnpm deploy` otherwise. failed deploy removes directory it created.

`scripts/reinstall.sh` is only place that installs global bin; root `postinstall` that did same is gone, which also stops `pnpm deploy` from triggering global install of checkout from inside copy.

## Consequences

Positive: uninstall plus setup now round-trips; the launcher copy is produced by a command pnpm accepts in this workspace; an empty launcher directory can no longer be mistaken for a copy; one owner for the global bin.

Negative: the uninstall shells out to `pnpm`, so on a machine without pnpm on PATH the leftover link is swept by hand and pnpm's manifest keeps its stale entry until the next pnpm run. The deploy filter needs the checkout to be the workspace root; deploying from a package subdirectory still fails, and nothing here measures it.

## What would end this

pnpm release makes `pnpm deploy` accept workspace root, or root package stops being workspace member and filter becomes unnecessary.

## Alternatives Considered

1. Keep postinstall and let script fail loudly: two installers still race on one bin, and every `pnpm install` in checkout claims global path user may have uninstalled on purpose.
1. Unlink global link directly instead of calling `pnpm remove -g`: faster, but it leaves pnpm's project manifest claiming bin, which is same conflict at next install.
1. Enumerate pnpm layout directories by version (`v11`, `5`,...): list that rots at next layout change; reading directories under store root does not.
1. Hardcode package name in deploy filter: rots at next rename, and manifest is right there.
