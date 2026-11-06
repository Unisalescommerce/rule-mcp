# 06 - The setup wizard is the installer, and it asks which commands to write

- **Branch**: `develop`
- **Commit range**: `39ffa3e..0e0fdce` (5 commits)
- **Date**: 2026-09-14
- **Decision**: ADR 072

## What happened

full-screen installer from `source` twin was adopted here as the
technology, carrying this repository's own install content. `src/cli/setup/`
holds whole flow; `scripts/install.{sh,ps1}` and `scripts/uninstall.{sh,ps1}`
are bootstraps that check node, resolve binary and forward every argument
to `rule-mcp setup`.

feature wizard exists to ask about is commands selection. full
install is 152 command files per agent directory; selection that narrows
it existed as data with two half-connected ends - flags on `agent-commands`,
and `@clack/prompts` picker nothing called - so every install wrote all of
them.

## The shape now

```
Preflight > Agents > Mode > Extras > Commands > Review > Install > Done
```

- **Commands** offers `Minimal (12)` / `Standard (73)` / `Full (152)` / `Custom`;
  Custom drills into families, then areas, then skills of those areas.
  Skipped entirely when Extras writes no command files.
- answer becomes `--preset` or `--families/--areas/--skills` on the
  `agent-commands --sync` plan spawns. `selectionOf` reads flags into a
  selection, `selectionArgs` writes one back out; `src/cli/install/_selection.js`
  stays only place that decides what selection means.
- Piped/CI/`--json`/`--no-wizard`/node < 22 gets plain runner with same
  plan. four narrowing flags are `--commands-preset`, `--commands-families`,
  `--commands-areas`, `--commands-skills` (`--skills` was already the
  bundled-skills step).

## Content recovered from the shell installer

- enforced-workflow block (`<!-- rule-mcp-rules -->`) lived only in
  `install.sh`, and it was copy naming tools that exist (`rule_tool_*`). The
  node block advertised `rule_tool_component`, `rule_tool_check`, `rule_tool_search`,
  `rule_tool_scaffold`, `rule_tool_process_adr` - none registered. Both blocks now live in
  `src/cli/installers/_instruction.data.js`.
- `--purge` now takes `~/.config/rule/` (env switches, stored model
  keys), which node path had been leaving behind. `--keep-config` keeps
  everything, as shell did.
- plain runner prints each task's `detail`, so piped install states what
  it is about to write (`Agent slash commands (pi - preset minimal (12))`).
- `setup` added to bash, zsh and fish completions.

## Tests

Twelve shell-contract suites were retargeted to node that replaced them:
`_shim-apply`, `_bootstrap-parity`, `_plan-modes`, `_instruction-blocks`,
`_cycle`, `_purge`, `_docker-mode`, `_install-agent-catalog`, plus PTY case
(drives Ink wizard, leaves on `q`, writes nothing) and e2e cases that go
through bootstrap on purpose.

`pnpm test:all`: **1276 pass, 0 fail, 1 skipped**. Lint clean, prettier clean on
changed files, census and `scripts/SHA256SUMS` regenerated, ADR index rebuilt.

## Known, deliberate

- `install --no-wizard` stays narrow command it was (mcp.json entry plus the
  router command file). Flags that name plan step are reported back to the
  user pointing at `setup`, not silently dropped - see `warnWizardOnly` in
  `src/cli/_register-setup.js`.
- Ink 7 wants node >= 22 while package floor is 20. node 20 install is
  told once, and gets plain runner.
- `scripts/install-agent-commands.sh` is no longer called by `install.sh`; it
  survives as standalone helper, still covered by its test.

## Open items

None. Nothing is pushed: every commit is local for review.

## Commits

| Commit    | Subject                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| `d3b8fd7` | feat(setup): install and uninstall through a full-screen wizard              |
| `9489391` | feat(install): the commands selection reaches the argv, both ways            |
| `d6b10d1` | fix(installers): write both instruction blocks, with tool names that exist   |
| `9c0f965` | test(installer): retarget the shell contracts to the node that replaced them |
| `0e0fdce` | docs(adr): record the setup wizard and the commands it asks about            |

## Convention reminder

Every commit is `type(scope): subject`. `commit-msg` hook rejects a
scope-less message.
