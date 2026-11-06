# 36: Port plan closed, launcher copy shipped, phases 1-3

- **Branch**: `rel/v0.1.0`
- **Commit range**: `04faad73..94a89860` (23 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in the whole feature range: 2
- **Date**: 2026-10-30

## Done

1. **The port plan closed and archived as ADR 189.** Every step was verified against the code rather than against the plan's own claims, which found four items wrong while landing: per-client prompt suppression was not blocked on a consumer (the consumer was `promptsSuppressed`; the missing piece was the client's identity), the rules task id is `project-rules:<root>`, no documented attribution row lives in TOML so no TOML writer exists to test, and the Scope prompt's typed path called a screen mode the renderer never implemented. The ADR carries one row per step instead of "the full text stays in git history".
2. **Two defects closed on the way.** `RULE_MCP_NO_PROMPTS` meant two things - hide the prompt list, and record a prompt length instead of its text - so the telemetry level now writes `RULE_MCP_NO_PROMPT_TEXT` and the old key still reads as anonymous. The style fixer inserted a blank line the guardrail forbids and then reported the file done forever; `applyJsStyle` now measures the rule set before and after and keeps the original when the count went up.
3. **Launcher Phase 1: the copy.** Measured first, because the plan assumed `pnpm pack`: a tarball is 1.2 MB packed and 6.8 MB extracted and cannot start (no `node_modules`, so `commander` is missing) and carries no OpenTUI platform binary. `pnpm deploy --prod --legacy` is 71-85 MB, starts, and answers `--version` offline. `_launcher-store.js` (pointer, record), `_launcher-prune.js` (one copy, and the row pruned with it), `_launcher-install.js` (deploy, probe, record, point), `_task-launcher.js` (the plan step, size reported, warns instead of failing). Acceptance run with `RULE_MCP_HOME` on a temporary root: `0.1.0 - 71 MB`, copy answers on its own, `node_modules` unchanged.
4. **Launcher Phase 2: resolution.** `_launcher-script.js` renders a script that tries the copy, then the checkout, then exits 127 naming both paths, the pointer and `rule-mcp setup`. Six shell tests cover the matrix, including an unreadable pointer and exit-code passthrough. `doctor` gained one row - `Launcher: copy 0.1.0 (installed 2026-10-29)` - from `_launcher-live.js`. Acceptance reproduced the incident: with `bin/rule-mcp.js` moved aside, `rule-mcp --version` answers `0.1.0` and exits 0 from the copy.
5. **Launcher Phase 3: skips recorded.** The hook itself appends one line to `state/launcher-skips.log` (capped at 200), and `doctor` prints the last one only when it is newer than the installed copy. The repository's tracked `.githooks/commit-msg` and `pre-push` now probe `rule-mcp --version` and fall back to the in-repo validator: `command -v` passes for a launcher whose target moved, and under `set -e` node's exit 1 blocked the push with "Cannot find module". Measured with the launcher replaced by a failing script: `pnpm test:installer` 817/815/0 and `commit-msg` exits 0 through the fallback.

## Commits this handoff window

`a6b61804`, `00ba97b3`, `9cebd163`, `3f2c041c`, `a3b6eaed`, `87ad612c`, `a358641a`, `8e3cd807`, `d0cd5f6b`, `b404b0d3`, `c325712e`, `9d1cf8ce`, `f6c8140a`, `8a298e66`, `eed3f326`, `4d4f8c9a`, `bf18223d`, `1a41b867`, `2b6812ca`, `6a7e4d17`, `89bee39d`, `b9326ac8`, `94a89860`.

## ADRs

Seven pending in `docs/adr/_pending/`, numbered on trunk landing (`rule-mcp handoff land`):

- `attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md`
- `derive-the-tokensave-switch-from-the-project-and-accept-on-autotrack-as-its-name.md`
- `uninstall-reclaims-the-configuration-it-wrote-after-asking.md`
- `split-the-files-the-size-ratchet-named-and-baseline-the-eight-that-were-never-re.md`
- `project-membership-is-a-command-and-an-update-re-applies-what-it-moved.md`
- `count-the-cycles-and-the-dead-symbols-the-graph-can-prove-and-break-the-cycles-t.md`
- `let-the-environment-name-the-client-and-the-handshake-answer-when-it-does-not.md`

Do not cite a number for any of them before `rule-mcp handoff land`.

## State

- `pnpm test:installer` 818 tests, 0 fail. `pnpm test:foundations` 2881 tests, 0 fail.
- `rule_tool_check` (project): green. `node bin/rule-mcp.js fix --dir .`: nothing. Census current; `handoff doctor` clean.
- Machine: `~/.rule-mcp/launcher/0.1.0` exists and the global shim resolves to it; `rule-mcp --version` answers `0.1.0`.

## Left out / next

- **Phase 4 is the last one**: `setup --uninstall` removes `~/.rule-mcp/launcher/` and the shim, in that order, reporting what it removed; `docs/04-operations.md` gains the launcher, its resolution order and its exit codes; and the ADR on the boundary between "a developer's checkout" and "the tool on PATH" is written last, because the measurement is what decided the copy.
- **74 files in this repository are ones Prettier would rewrite**, so `pre-push` fails at its formatting step whatever the launcher does. Pre-existing, unrelated to this work, and left alone: reformatting 74 files is its own decision. Phase 3's acceptance is measured on the launcher-dependent gates instead.
- **The MCP server in the session that produced this handoff served an older build**; `rule_tool_check`, `rule_tool_structural`, `rule_tool_handon` and `rule_tool_handoff` answered stale or refused, so the CLI path was used. Restart the server before trusting those tools.
- **A test wrote into this repository twice**: `handon({ projectDir: "." })` swept a finished plan into an ADR during a suite run (fixed: the claims live in a fixture, and `closeout: false` where the read path is what is being checked), and a generated hook defaulted to the real runtime root and wrote skip lines into the real log (fixed: every test passes a temporary root). Both are the same class of defect - a test inheriting a production default.
- Attribution has 21 unverified rows; a row is written only with a cited vendor page.
- `main` is ~870 commits behind this line; the merge is a review question, not a cherry-pick.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/36-port-plan-closed-launcher-copy-shipped.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold. Restart the MCP server before trusting
rule_tool_check / rule_tool_structural / rule_tool_handon / rule_tool_handoff: the previous session
served an older build and used the CLI instead.
Both suites are green (818 installer, 2881 foundations), the guardrails report no failures, and
`rule-mcp fix` has nothing to do. Seven ADRs wait in docs/adr/_pending/ and get numbers only on trunk
landing (`rule-mcp handoff land`).
The launcher work is at docs/plans/_stable-launcher-outside-the-checkout.md, phases 1-3 done: a copy
under ~/.rule-mcp/launcher/<version>/ installed by `pnpm deploy --prod --legacy` (not `pnpm pack`, which
cannot start), a launcher that resolves copy -> checkout -> exit 127, and skipped validations recorded
in state/launcher-skips.log with doctor showing the last one. Next is Phase 4, the last: `setup
--uninstall` removes the launcher directory and the shim in that order and reports what it removed;
docs/04-operations.md documents the resolution order and the exit codes; then the ADR on the boundary
between a developer's checkout and the tool on PATH, written last because the 71-85 MB measurement is
what chose the copy over a link.
Known and deliberate: 74 files here are ones Prettier would rewrite, so `pre-push` fails at its
formatting step regardless of the launcher. Reformatting them is a separate decision.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message. Do not push.
```
