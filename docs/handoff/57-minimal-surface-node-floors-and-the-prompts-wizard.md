# Session handoff 57 - the minimal surface, two Node floors, and the prompts wizard

- Branch: `main`
- Commit range covered: `489640a3..9f297a9b`, 14 commits
- Date: 2026-11-07

## State

The working tree is clean at `9f297a9b`. `origin/main` sits at `489640a3`, the handoff commit the previous session pushed at 17:59:02. Local `main` is 14 commits ahead of it, and nothing from this session is pushed. No tag exists, so `git tag` is empty.

`~/.rule-mcp/config` was still empty at the last check, so the switches file and the install manifest are still missing. The MCP servers keep working, because each agent holds its own values.

Three worktrees exist besides the main one: `/private/tmp/base-check`, and two Claude worktrees under `.claude/worktrees/` at `a38d1369`. The `pensive-gauss-ae1b68` worktree still carries the unfinished `withHome` fix: `packages/shared/_testkit.js` modified, `packages/shared/__tests__/_testkit.test.mjs` untracked.

## What this session changed

### The minimal surface is gone

`870e56a0` removes the `minimal-tools` feature switch, the `minimal` surface tier, `MINIMAL_ALLOWLIST`, `RULE_MCP_MINIMAL_TOOLS`, and the `--minimal` / `--no-minimal` flags. The Surface step now offers full, standard and custom. The `minimal` profile stays, with the standard surface, because it still means the fewest dimensions.

`5eea509b` takes the switch out of the handbook, the README and the feature table. The census regenerated `docs/17-cli.md`, `docs/21-surface-map.md` and `docs/23-env-readers.md`.

### The install writes what the steps asked for

`7043afa7` moves the Devin installer into `packages/mcp/cli/installers/_devin.js`. It wrote 44 `rule-*` directories into `~/.config/devin/skills` on every install, whatever the Commands step said. The commands answer now reaches it, so a declined step writes the server entry alone.

`fa57f40c` renames the Depth step to "How deep should each agent go?" and explains the rungs L0 to L4 in the help. The Commands row now names the directories it writes, per selected agent.

### The FFI warning is gone

`6d6e8f7c` adds `packages/mcp/cli/setup/_warnings.js`. OpenTUI loads `node:ffi` for its native core, and Node printed the experimental notice after the alternate screen closed. The filter drops that one sentence and forwards every other warning in Node's own format. A test spawns a child and checks both halves.

### Two Node floors

`9a985baf` splits the floor. `NODE_FLOOR` is `24.0.0` and gates the server start, the preflight row, the doctor and the four bootstrap scripts. `WIZARD_FLOOR` stays `26.4.0` and gates the renderer. `14624e2e` states both in the README and the handbook. The CI test job carries `["24", "26"]`, so neither floor is a claim nobody checks. `scripts/SHA256SUMS` was regenerated.

### The wizard runs on Node 24

`797c7ec7` adds `packages/mcp/cli/setup/_screen-plain.js`. The wizard flow talks to a six-method port: `setStep`, `ask`, `askPath`, `confirm`, `progress`, `close`. The plain adapter answers that port with `@clack/prompts`, which needs no FFI. `_mount.js` picks it when `canRenderWizard()` is false and the terminal can still answer. `canRunPlainWizard()` gates a terminal alone, so `interactive` no longer depends on the renderer's floor. The runtime note now names the terminal, because the runtime is never the reason.

ADR 246 records the floors, and ADR 247 records the second adapter.

## Evidence

- `pnpm run ci` on Node 26.12.1: 3226 tests, 3223 passed, 3 skipped, 0 failed.
- `pnpm run ci` on Node 24.22.1: the same counts, 0 failed.
- The server answers `initialize` and `tools/list` on Node 24.22.1.
- A live pty run on Node 24.22.1 printed the preflight and asked for the profile. It was canceled, and the sandbox home stayed empty.
- `node:ffi` answers `ERR_UNKNOWN_BUILTIN_MODULE` on Node 24, and `createCliRenderer` throws "OpenTUI native FFI is not available for this runtime yet". The renderer cannot run there, and no flag changes that.

## Open items, in order

1. Run `rule-mcp setup` and rebuild `~/.rule-mcp/config/env.json` and `install.json`.
2. Remove the `pnpm dlx rule-mcp` fallback. It is still in `scripts/install.sh:112`, `scripts/uninstall.sh:54`, `scripts/install.ps1:90` and `scripts/uninstall.ps1:61`. The npm name `rule-mcp` returns E404, so a squatter would own that command.
3. Land the `withHome` fix from the `pensive-gauss-ae1b68` worktree, then close its plan.
4. Run `pnpm release --dry-run --version 0.1.0`, then `pnpm release --version 0.1.0`. The release pushes `main` and the tag, which is how the 14 local commits land.

## Doubts on record

- The push at 17:59:02 in the previous session is still unexplained. No session claims it, and the GitHub workflows passed on it.
- `ajv` declares `^3.0.1` and the override forces `fast-uri` 4.2.3, a different major. The GitHub `ci` run passed on that tree, so the pin stays.
- Not verified: the new tests on Windows and Linux, and the Docker build. The CI matrix now covers both Node versions on three systems, but the last GitHub run predates these commits.
- `docs/migrations/rule-mcp-rename.md` was not reviewed.
- After an uninstall, `~/.claude.json` can stay empty.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace from docs/handoff/57-minimal-surface-node-floors-and-the-prompts-wizard.md. Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them is trusted.

State: the tree is clean at 9f297a9b. `origin/main` is at 489640a3, so 14 commits are local and unpushed, and no tag exists. `~/.rule-mcp/config` is still empty. Two open holes: the `withHome` async hole (fix uncommitted in the `pensive-gauss-ae1b68` worktree) and the `pnpm dlx rule-mcp` fallback in four install scripts.

First step: run `rule-mcp setup` in a terminal and confirm `~/.rule-mcp/config/env.json` and `install.json` exist again. Then `pnpm release --dry-run --version 0.1.0`, then `pnpm release --version 0.1.0`, which pushes main and the tag. Pages is already active, so skip that step.

The wizard draws on Node 26.4 and asks the same questions as prompts below it, so a Node 24 host gets the full setup too. `pnpm run ci` is green on both 24 and 26. Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message. Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
