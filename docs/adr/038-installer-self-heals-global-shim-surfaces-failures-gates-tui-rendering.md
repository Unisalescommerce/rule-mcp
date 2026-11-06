# 038: Installer self-heals its global shim, surfaces failures, and gates TUI rendering

- **Date**: 2026-08-25
- **Status**: accepted
- **Tags**: installer, cli, cross-platform, shim, tui, terminal, idempotency
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

universal installers (`scripts/install.sh`, `scripts/install.ps1`) trusted the
result of `command -v rule-mcp` without verifying binary could
launch. That trust broke in real scenario:

1. `pnpm link --global .` had created cmd-shim that pins repo's absolute
   path (`# cmd-shim-target=…/rule/bin/rule-mcp.js`).
2. repo moved from `…/Projects/pixu1980/rule` to
   `…/Projects/pixu1980/ai/rule`. shim stayed on `PATH` but crashed
   on launch (`Error: Cannot find module …`).
3. `run_cli install --agent pi … --json >/dev/null 2>&1` swallowed both streams,
   so failure looked exactly like successful-but-skipped install. pi
   entry was never written to `~/.pi/agent/mcp.json`, and re-running
   `./scripts/install.sh` never repaired anything because relink only happened
   when `command -v rule-mcp` **failed**, it never did.

While fixing this, `pnpm link --global .` proved worse than useless as repair
strategy: pnpm 10/11 rewrites `pnpm-workspace.yaml` (clobbering the `hono:`
override and injecting `rule-mcp: 'link:'`) and lockfile when run
inside workspace.

Separately, terminal experience was poor: colors and box-drawing were
emitted even when output was piped (CI/`curl | bash` garbage); PowerShell
TUI's `Enter { break }` inside `switch` only exits the **switch**, so selection
never confirmed (infinite re-render); and bash TUI's cursor helpers ended
with `[[ … ]] && …`, which returns non-zero at list boundaries and killed the
script under `set -euo pipefail`.

## Decision

1. **Verify before trust.** `shim_works()` (bash) / `Test-RuleMCPCli` (PS) run
   `rule-mcp --version`; global binary is used only when it launches.
   When it exists but fails, installer warns, removes stale shim, and
   **writes plain launcher script** (`exec node '<project>/bin/rule-mcp.js'`)
   directly into detected global bin dir (`$PNPM_HOME/bin`, pnpm's
   `global-bin-dir`, or platform default). In local-repo flow shim is
   never created via `pnpm link --global`. `RULE_MCP_SKIP_GLOBAL_LINK=1`
   skips writing shim entirely (tests/sandboxes).
2. **Fall back instead of failing silently.** `run_cli` / `Invoke-RuleMCPCli` fall
   back to local entrypoint (`node $LOCAL_BIN`) when shim is broken, so a
   stale shim can never again block install.
3. **Surface CLI errors.** All `install`/`daemon`/`doctor` calls capture output
   and print it indented on failure instead of `>/dev/null 2>&1`.
4. **TTY-gated rendering.** Colors and box-drawing render only on real TTY
   without `NO_COLOR`; redirected output gets plain separators. PS scripts
   gate on `[Console]::IsOutputRedirected -or $env:NO_COLOR`.
5. **TUI hardening.** EOF-safe key reader; both `ESC [ A` and `ESC O A` cursor
   sequences; `↑↓/jk`, `1-9`, `a` (all), `n` (none); cursor helpers `return 0`;
   PS `Enter` confirms via `$done` flag because `break` in `switch` exits
   only switch.
6. **Prettier-clean rules block.** `RULES_CONTENT` is byte-identical to the
   block committed in project `CLAUDE.md` (including blank lines), so
   install/uninstall cycles never produce `pnpm format` diff. drift-guard
   step in `test/install-rules-idempotent.test.mjs` (harness F) enforces it.
7. **Full reversal.** `uninstall.sh` / `uninstall.ps1` remove shim and links:
   `pnpm unlink --global`, `npm uninstall -g`, plus bin-shim removal in all
   common global dirs and pnpm store link (deduped), so `command -v
rule-mcp` resolves to nothing afterward.

## Consequences

**Positive**

- stale/`moved-repo` shim is detected, warned about, and repaired, the
  original "pi silently skipped" failure is structurally impossible.
- `pnpm-workspace.yaml` / lockfile overrides can no longer be clobbered by the
  installer (regression-guarded by source test in
  `test/install-script-shim-heal.test.mjs`).
- Piped and CI output is clean; TUI confirms on Enter on both
  platforms; `set -e` no longer kills TUI at list boundaries.
- repo's `CLAUDE.md` stops churning after every install.
- full `test:installer` suite (29 checks, including PTY TUI acceptance
  test) and `test:all` (211 checks) run green.

**Negative**

- global bin dir is detected heuristically; custom pnpm layout not under
  `$PNPM_HOME`/`global-bin-dir` falls back to local entrypoint instead of
  creating shim.
- PowerShell syntax is still validated in CI only when `pwsh` is present; the
  portable `pwsh` build must be available to run parser check locally.
