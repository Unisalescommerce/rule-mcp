# Stable launcher: `~/.rule-mcp/launcher/` instead of a path into a checkout

Status: `planned`
Notes: outside the skills graph. This plan is about the installer's global launcher, not a skill, so
it is not a node in `docs/plans/skills/skills-plan.md`; it is tracked on its own like `export.md`.

The `rule-mcp` launcher on `PATH` is a two-line shell script naming an absolute path into this
repository:

```sh
exec node "/Users/<user>/Projects/.../rule-mcp/bin/rule-mcp.js" "$@"
```

That path is inside a working tree, and a working tree changes branch. When it does, the file it
names can stop existing, and every consumer on the machine inherits the same breakage.

## What happened, measured 2026-10-26

The incident this plan exists to prevent, with the times from `git reflog` and the filesystem:

| Time    | Event                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------- |
| `12:41` | the shim is written, naming `<checkout>/bin/rule-mcp.js`                                                       |
| `12:46` | the checkout moves from `rel/v0.1.0` to `main`, where the entry point is `bin/pix-galaxy-mcp.js` - target gone |
| `13:18` | `git push` in an **unrelated repository** dies: `Error: Cannot find module '.../bin/rule-mcp.js'`, exit 1      |

Exit 1 from node is indistinguishable from "the validator found violations", so a missing file
presented itself as a commit rejected by policy. Three fixes landed the same day, in
`d5301bba` and `b4c9f099`:

1. the launcher checks its target and exits `127`, which means `cannot execute` and nothing else;
2. the hook probes the launcher with `--version` instead of `command -v`, so an unstartable tool is
   a skip with a message rather than a blocked push;
3. a displaced hook is stored executable, because the chain test is `[ -x ]`.

Those three make the failure **loud**. They do not remove it: with the checkout on the wrong
branch, the tool is still gone, and every gate that calls it is **silently off** except for one
warning per push. A gate that can turn itself off is the thing this plan is about.

## What exists here today

Checked on `rel/v0.1.0` at `b4c9f099`:

| Piece                                    | Today                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `src/cli/setup/_shim-apply.js`           | writes a sh 2-liner naming `ownEntrypoint()`; target check, exit `127`  |
| `src/cli/setup/_shim.js`                 | `shimTarget()` trusts a shim only when it names this checkout's entry   |
| `ensureGlobalShim()`                     | verifies by running `--version` **and** comparing the text (freshness)  |
| consumers                                | global git hooks (`~/.config/git/hooks`), agent configs, `rule-mcp` CLI |
| fallback when the entry point is missing | none: `exit 127`, warning, validation skipped                           |
| `~/.rule-mcp/`                           | `state`, `data`, `projects`, `config` - no launcher, no installed copy  |

## Design

Three candidates, and why the third is the one:

| Option                                           | Verdict                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pnpm link --global`                             | rejected already: pnpm 10+ rewrites `pnpm-workspace.yaml` and the lockfile being installed from |
| symlink to `<checkout>/bin/rule-mcp.js`          | same failure: the link target moves with the branch, plus every consumer resolves the tree      |
| **installed copy under `~/.rule-mcp/launcher/`** | a real installation, pinned by version, independent of any working tree                         |

**A launcher owns a copy, and points at the copy.** `rule-mcp setup` packs this checkout
(`pnpm pack`), extracts the tarball to `~/.rule-mcp/launcher/<version>/`, and writes the shim to
`exec node ~/.rule-mcp/launcher/<version>/bin/rule-mcp.js`. A pointer file
(`~/.rule-mcp/launcher/current`) names the version in use, so a rollback is a one-line edit and not
a reinstall.

Resolution order at run time, which is also the order the tests assert:

1. `current` names a version whose entry point exists: run it.
2. `current` is missing or broken, and a checkout is recorded as the source: run the checkout's
   entry point (a developer working on the tool wants their edits live) **only when it exists**.
3. neither: exit `127` naming both paths and the one command that repairs it (`rule-mcp setup`).

The trust rule in `_shim.js` extends to the copy: a launcher is trusted when it resolves to a path
this installer wrote, recorded in `~/.rule-mcp/launcher/installed.json`, not when it merely exists.

## Phases

### Phase 1 - the pack and the copy

- [ ] Test first: `src/cli/setup/__tests__/_launcher-install.test.mjs` - a temp `HOME`, a packed
      fixture, and the matrix: install writes `<version>/bin/rule-mcp.js` and `current`; a second
      install of the same version is idempotent (`verified`, not a rewrite); a different version
      adds a directory and moves `current`; `installed.json` records version, source checkout and
      date.
- [x] `src/cli/setup/_launcher-install.js` + `_launcher-store.js`: `installLauncher()` (deploy, record,
      pointer, prune), `setCurrent()`, `currentVersion()`, `installedVersions()`, `probeCopy()`.
      The mechanism changed with the measurement below: `pnpm deploy --prod --legacy`, not pack.
- [x] **Measured 2026-10-29, and the measurement decided.** `pnpm pack` -> 1.2 MB packed, 6.8 MB
      extracted, **cannot start**: `commander` is missing (no `node_modules` in a tarball) and
      OpenTUI's `@opentui/core-darwin-arm64` is not packed at all, so the terminal UI would not run
      either. `pnpm deploy --prod --legacy <dir>` -> **85 MB** (79 MB of it `node_modules`, the platform
      binary included), and `bin/rule-mcp.js --version` answers `0.1.0` from it with no network.
      A copy that cannot run is not a copy, so the copy is a deploy. The cost is now a number the
      install prints, and one version is kept: `docs/plans` risk row "the platform binary is not in
      the tarball" resolved as *not in the tarball, in the deploy*. The integration check
      `_launcher-install.integration.test.mjs` keeps the answer honest (`RULE_MCP_LAUNCHER_INTEGRATION=1`).
- [x] Acceptance, run 2026-10-29 with `RULE_MCP_HOME` pointed at a temporary root:
      `setup --no-interactive --agent claude` reports `Launcher copy ... 0.1.0 - 71 MB`, leaves
      `<root>/launcher/0.1.0/`, `current` = `0.1.0` and `installed.json`, and that copy answers
      `--version` with `0.1.0` on its own. The repository's `node_modules` measured 258168 KB before
      and after: the deploy reads the store, it does not write the checkout. The step is
      `_task-launcher.js`, planned after the runtime home and before the shim, and it warns instead of
      failing so an 85 MB write that cannot happen does not leave the rest of the machine unconfigured.

### Phase 2 - resolution order in the launcher

- [x] Test first: the launcher matrix as shell tests in `_shim-resolution.test.mjs`, each one running
      the generated script through `sh`: the copy answers first even when the checkout could; a copy
      whose entry point is gone falls through to the checkout; an unreadable pointer is treated as no
      pointer; neither exits 127 naming the copy, the pointer and the checkout plus the repair; the
      target's exit code and arguments pass through unchanged.
- [x] `src/cli/setup/_launcher-script.js`: the launcher is a resolution script - copy first from
      `launcher/current`, the checkout second, 127 last. `_shim-apply.js` renders it with the runtime
      root its install wrote, so a shim is current when it names *this* root.
- [x] `doctor` reports which target is live (`Launcher: copy 0.1.0 (installed 2026-10-29)`, the
      checkout path, or `none - run rule-mcp setup`), from `_launcher-live.js`, because "which binary am
      I talking to" is the question the incident produced.
- [x] Acceptance, run 2026-10-29 on this machine: with `bin/rule-mcp.js` moved aside - the incident,
      reproduced - `rule-mcp --version` answers `0.1.0` and exits `0` from the copy. Before this phase
      the same state was a node stack trace and exit 1, which the git hook read as a verdict. The hook
      itself is unchanged since `d5301bba`: it probes `--version`, and that probe now succeeds.

### Phase 3 - the gates stop depending on a working tree

- [x] The hook writer keeps invoking `rule-mcp` by name, which is now a stable target; the skip warning
      stays as the last resort and names the repair (`run: rule-mcp setup`). The repository's own
      tracked hooks in `.githooks/` probe `rule-mcp --version` before using it and fall back to the
      in-repo validator, because `command -v` passes for a launcher whose target moved and `set -e`
      then turns node's exit 1 into a rejected push.
- [x] Record skips: one line in `state/launcher-skips.log` from the hook itself (`_hook.js`,
      `_launcher-skips.js`), capped at 200 lines, and `doctor` reports the last one when it is newer
      than the installed copy - history is not a warning. A gate that was skipped is a fact a reader
      can find, not a message that scrolled by.
- [x] Acceptance, run 2026-10-29: with the launcher replaced by a script that prints `Cannot find
      module` and exits 1, `pnpm test:installer` is 817 tests / 815 pass / 0 fail, `sh
      .githooks/commit-msg <msg>` exits 0 through the in-repo validator, and the installed hook writes
      its skip line. Found on the way: this repository has **74 files Prettier would rewrite**, so
      `pre-push` fails at its formatting step whatever the launcher does - a pre-existing condition,
      recorded here and left alone because reformatting 74 unrelated files is not this plan.

### Phase 4 - uninstall, docs, ADR

- [ ] `setup --uninstall` removes `~/.rule-mcp/launcher/` and the shim, in that order, and reports
      what it removed; an uninstall that leaves a launcher pointing at a deleted directory is the
      same defect in the other direction.
- [ ] `docs/04-operations.md`: the launcher, its resolution order and its exit codes; `_shim-apply.js`
      loses the note about `pnpm link --global` and points at the ADR.
- [ ] ADR 187 (`docs/adr/187-the-launcher-owns-a-copy-outside-the-checkout.md`): the boundary between
      "a developer's checkout" and "the tool on `PATH`", and why a copy beats a link. Written last,
      because the pack measurement decides whether the copy is the answer or a fallback to it.

## Non-goals

- Publishing to npm and installing from the registry. The copy is produced from the local checkout on
  purpose: it is the same code the developer is testing, pinned by content rather than by name.
- Making the CLI work with no installation at all. A checkout that has never run `pnpm setup` keeps
  using its own `bin/rule-mcp.js` directly; that is the developer path, and it is already tested.
- Rewriting the global hooks directory layout. `~/.config/git/hooks` stays, and the migration of a
  displaced hook to `<name>.rule-backup` stays as it is.

## Risks

| Risk                                                        | Mitigation                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| OpenTUI's platform binary is not in the tarball             | Phase 1 measures it before Phase 2 is written; a failed measurement stops the plan at the copy   |
| a stale copy keeps running after the checkout moves on      | `current` is written by every `setup`; `doctor` prints its version and date next to the checkout |
| disk: two copies (checkout + launcher)                      | one version kept by default, the previous one pruned on install, and the size printed            |
| a copy is a second thing to trust, and a PATH hijack target | `installed.json` records what this installer wrote, and `shimTarget()` trusts only that          |

## Dependency graph

Nothing in the skills graph depends on this plan, and this plan invents no second launcher table:
`_shim.js` already resolves the trust question, and the plan extends it rather than duplicating it.

Depends on: nothing hard; `installer-scope-adr-policy-features` (ORDER, its step on installer paths is what `~/.rule-mcp/` layout follows)

Feeds: nothing in the skills graph; `docs/04-operations.md`, `doctor` output and the global git hooks read its targets

Shared files: src/cli/setup/_shim-apply.js, src/cli/setup/_shim.js, src/cli/setup/_task-core.js, src/cli/doctor/_sections.js, src/cli/installers/_uninstall.js, docs/04-operations.md, docs/adr/187-the-launcher-owns-a-copy-outside-the-checkout.md

## Gates

Every step: tests first, Conventional Commits with a scope, never push, `pnpm test:all`,
`pnpm census:check`, and the file-size budget (`_shim-apply.js` is at the 150-line cap minus a
handful - Phase 1 is a new module, not a longer one).
