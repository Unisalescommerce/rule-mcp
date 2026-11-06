# installer-global-link-and-launcher-deploy

- **Plan**: `docs/plans/_installer-global-link-and-launcher-deploy.md` (retired)
- **ADR**: 216 (`216-close-out-plan-installer-global-link-and-launcher-deploy.md`)

## Delivered

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

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
