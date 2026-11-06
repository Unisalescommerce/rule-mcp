# Handoff: the corepack guardrails, a completed roadmap, and the shell-out surface

**Branch:** main
**Commits covered:** `613b4d0e..f03ff4e9` (6 commits)
**Date:** 2026-09-20

## Session Summary

Three threads, in this order. First, mandatory guardrail: generated
`package.json` must carry neither corepack activation fields nor `engines`,
and write path strips them before checking. Second, roadmap, which
named three horizons and none of queues that carry them, was completed and
linked to `docs/plans/` and `docs/reviews/`. Third, security plan was
worked from the top: six of its eight steps are done.

## Work Completed

### 1. No corepack, no engines (ADR 101)

- `skills/rule-toolchain-pnpm/guardrails/_no-engines.js` (new): `pkg-no-engines`
  forbids `engines` in `package.json`, next to `pkg-no-corepack`. Both are in
  baseline, so every skill applies them. front matter of
  `rule-toolchain-pnpm/SKILL.md` declares new rule.
- `src/core/guardrails/_manifest-strip.js` (new): write path removes
  `packageManager`, `engines` and `devEngines.packageManager` from manifest
  before gateway checks it, so receipt binds cleaned content and the
  reply carries it back. path decides, not content.
- `package.json` drops `engines`; Node floor lives in `.nvmrc`, the
  installers (`NODE_MIN=20`) and CI.
- Documentation: policy section in `rule-toolchain-pnpm`, `rule-styleguide-json`
  and `rule-toolchain-project` says rule-mcp does not support corepack.

### 2. The roadmap

`ROADMAP.md` now links `docs/plans/` and `docs/reviews/`, adds security
surface and architecture debt, names v0.1.0-beta release target, lists
six owner-only actions that block three phases, and corrects two stale
claims: the PowerShell bootstraps are read by a test, never executed in CI, and
documentation site is built, only undeployed.

### 3. Security, SEC-1 through SEC-6 (docs/plans/security.md)

- SEC-1 (high): `tryExecFile(file, args)` runs argv array, so no shell parses
  path. launchd, systemd and Windows adapters use it. test drives all
  three against HOME whose name carries `$(touch INJECTED)`, quote, a
  semicolon and space, and asserts path arrives whole and payload
  never runs.
- SEC-2: launchd wrapper single-quotes its paths instead of XML-escaping
  them.
- SEC-3: PowerShell fallback launches with argv array, not `shell: true`.
- SEC-4: failed install reports exit code, never command line or
  stderr.
- SEC-5: `shimWorks()` resolves shim to this checkout's entrypoint before
  running it. symlink or launcher that names entrypoint is trusted;
  anything else is refused without being executed.
- SEC-6: Windows `binPath` and systemd `ExecStart` are built from the
  argv array, each element escaped by its own tool's rules.

## Verification

| Gate                                 | Result                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `scripts/ci/run-tests/index.mjs all` | 1829 tests, 1824 pass, 3 skipped, 2 fail (both pre-existing, see below) |
| `eslint bin/ src/ tests/`            | 0 errors, 36 warnings (cap 50)                                          |
| `prettier --check '**/*'`            | all files match                                                         |
| `tests/docs/*.test.mjs`              | 58/58                                                                   |
| daemon suite                         | 51/51                                                                   |
| setup + install + installers         | 264/265                                                                 |
| `handoff doctor` at the tip          | clean: 109 ADRs, 15 handoffs, both indexes current                      |

Two tests fail, neither from this work:
`src/cli/install/__tests__/_installer-stdio-path.test.mjs` hardcodes checkout
at `~/Projects/rule` and global shim at
`~/Library/pnpm/bin/rule`, while this machine has them elsewhere; and
`src/cli/commands/__tests__/_daemon.test.mjs` binds fixed port, so it loses a
race when whole suite runs in parallel. It passes alone and in the
`installer` suite.

## Next Session

Resume security plan from **SEC-7** in `docs/plans/security.md`.

- SEC-7 (low): `tryExec` collapses every failure, including output cap, into
  `""`, so "died" and "printed nothing" are one value. Return discriminated
  result and update callers that compare against `""`. Roughly 20 callers.
- SEC-8 (low): daemon shell-out surface exists twice, in `src/cli/daemon/`
  and `src/cli/commands/daemon/`. Point one at other and assert one owner
  per platform command in repository-contract test.

After security plan closes, next block is **ARCH-1** in
`docs/plans/architect.md`: break eight-module cycle that ties tool
invocation to skill loading, self-update and gateway.

Owner-only and network work cannot be done from session: six GitHub
clicks in `docs/plans/github.md`, signed tag and release, MCP registry
publish, and Pages deploy.

### Resume Prompt

next session opens with this block. Add path of this document and first step of next session before saving it.

```prompt
Resume work on rule-mcp. Run `rule_tool_process_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The handoff document is `docs/handoff/15-security-argv-and-shim-trust.md`.
First step: SEC-7 in docs/plans/security.md - replace the string-returning tryExec with a discriminated result (ok, stdout, exit code, capped) and update the callers that compare against "", then SEC-8 (one owner for the daemon command strings) to close the security plan.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.
```
