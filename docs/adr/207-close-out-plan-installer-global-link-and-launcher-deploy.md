# 207: Close out plan _installer-global-link-and-launcher-deploy

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/_installer-global-link-and-launcher-deploy.md, "Plan: Installer: remove the pnpm global link, fix the launcher deploy", finished with 11 closed items.

## Outcome

- WS1-T1: Failing test first: linkCandidates(home) finds a link in the per-project layout and in the flat legacy layout, and stays isolated from a PNPM_HOME outside the home it was given.
- WS1-T2: _shim-store.js sweeps $PNPM_HOME/global (when inside the home), <home>/Library/pnpm/bin/global, <home>/Library/pnpm/global, <home>/.local/share/pnpm/global, <home>/.pnpm-global/global, both layouts, and both package names.
- WS1-T3: Failing test first: with no pnpm on PATH, removeGlobalShims() still removes a global link under a sandbox home, and a second call finds nothing.
- WS1-T4: removeGlobalShims runs pnpm remove -g <name> per package name found, then sweeps the leftover link by hand; globalShimPresent() reports the link so the uninstall scan offers the group.
- WS2-T1: Failing test first: a workspace checkout deploys as pnpm --filter <manifest name> deploy --prod --legacy <target>; a non-workspace checkout keeps the plain command.
- WS2-T2: Failing test first: a failed deploy removes the target directory it created.
- WS2-T3: deployCopy builds the argument array from the checkout manifest plus pnpm-workspace.yaml, and removes the target on failure.
- WS2-T4: RULE_MCP_LAUNCHER_INTEGRATION=1 passes; it failed with deploy failed before T3.
- WS3-T1: Failing test first: package.json has no postinstall running a global install, and reinstall.sh runs pnpm install -g . exactly once.
- WS3-T2: The postinstall is gone; pnpm setup still installs through [reinstall.sh](../../scripts/reinstall.sh), and pnpm deploy no longer re-triggers a global install from inside a deploy.
- WS3-T3: Full check: pnpm test:all 3119 tests, 0 fail; rule_tool_check 67/67 on both new modules and 6/7 project checks (1 skipped: graph unavailable); eslint clean on every touched file.

### Plan prose

Two failures reported after `pnpm uninstall` + `pnpm setup`:

1. `ERR_PNPM_GLOBAL_BIN_CONFLICT` on `pnpm install -g .` — the uninstall never removed the pnpm global link entry. `linkCandidates()` answered `~/Library/pnpm/global/v11/node_modules/rule-mcp` (nonexistent) while the real entry was `~/Library/pnpm/bin/global/v11/<hash>/node_modules/rule-mcp-workspace`. 2. `Launcher copy — Command failed: pnpm deploy --prod --legacy ~/.rule-mcp/launcher/0.1.0` — `ERR_PNPM_CANNOT_DEPLOY_MANY` from a three-project workspace root, plus an empty launcher directory left behind.

A third, aggravating defect: the global bin was installed twice (`postinstall` plus [reinstall.sh](../../scripts/reinstall.sh)), with stderr dropped on the first.

Depends on: - Feeds: - Shared files: `package.json` owned by WS3 only; `packages/mcp/cli/setup/_shim-store.js` by WS1 only; `packages/mcp/cli/setup/_launcher-deploy.js` by WS2 only. CONFLICT edges: none (disjoint file sets).

Files: `packages/mcp/cli/setup/_shim.js`, `packages/mcp/cli/setup/_shim-store.js`, `packages/mcp/cli/setup/_shim-apply.js`, `packages/mcp/cli/setup/__tests__/_shim-paths.test.mjs`, `packages/mcp/cli/installers/__tests__/_shim-apply.test.mjs`, `packages/mcp/cli/installers/__tests__/_shim-link-removal.test.mjs`, `packages/mcp/cli/installers/__tests__/_shim-apply-child.fixture.mjs`.

Files: `packages/mcp/cli/setup/_launcher-install.js`, `packages/mcp/cli/setup/_launcher-deploy.js`, `packages/mcp/cli/setup/__tests__/_launcher-install.test.mjs`, `packages/mcp/cli/setup/__tests__/_launcher-install-deploy.test.mjs`, `packages/mcp/cli/setup/__tests__/_launcher-install.fixture.mjs`.

Files: `package.json`, `scripts/reinstall.sh`, `packages/mcp/cli/__tests__/_reinstall-script.test.mjs`.

- `pnpm deploy --prod --legacy <target>` at the root: `ERR_PNPM_CANNOT_DEPLOY_MANY`. - `pnpm --filter rule-mcp-workspace deploy --prod --legacy <target>`: copy answers `--version` 0.1.0, 94 MB, `@opentui+core-darwin-arm64` present. - `linkCandidates()` on the reporting machine: one nonexistent path before, the real `.../bin/global/v11/56af-18e56ecb617b80d8-0/node_modules/rule-mcp-workspace` after.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/_installer-global-link-and-launcher-deploy.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
