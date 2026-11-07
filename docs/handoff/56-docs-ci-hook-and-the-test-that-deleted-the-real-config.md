# Session handoff 56 - docs, CI, hook, and the test that deleted the real config

- Branch: `main`
- Commit range covered: `76bf1382..eac2cd7d`, 20 commits
- Date: 2026-11-06

## State at the end of this session

The working tree is clean at `eac2cd7d`. `origin/main` sits at `489640a3`, the handoff commit, pushed at 17:59:02. This session never ran a push; the push appeared between the handoff commit and the release attempt, and its origin is unrecorded.

Local `main` is 2 commits ahead of `origin/main`: `da9521e8` (the color fix) and `eac2cd7d` (this document). No tag exists, so `git tag` is empty.

GitHub ran CI on `489640a3` and every workflow passed: `ci`, `Pages`, `Check workflows` and `Scorecard`. Pages is already active with `build_type: workflow`, and its deploy succeeded, so the "activate Pages" step is done.

Three worktrees exist besides the main one: `/private/tmp/base-check` (detached at `b42fb9c7`) and two Claude worktrees under `.claude/worktrees/` at `a38d1369`. The `pensive-gauss-ae1b68` worktree carries the unfinished `withHome` fix: `packages/shared/_testkit.js` modified, `packages/shared/__tests__/_testkit.test.mjs` untracked. It was left untouched, by decision.

## What the local commits carry

- Handbook rewrite: 23 chapters plus `README.md`, no raw HTML, short sentences.
- Lint and format pass: the last 75 errors closed, the job green.
- Skills: `rule-ai` and `rule-backend` hubs rewritten, two frontmatter keys dropped, the template-engine skill retired.
- CI: `release.yml` publishes a source tarball built with pnpm, and needs no tag signature.
- CI: `pages.yml` runs Node 26 with concurrency and a pnpm build.
- Tests: coverage raised above the floor, two files shrunk back under the size cap.
- `chore(deps)`: the `fast-uri` override moved to 4.2.3, with the lockfile.
- Docs: ADR 244 (no HTML, whole-file census) and ADR 245 (source-tree release asset).

`docs/plans/` left the repository and is ignored at `.gitignore:29`.

## Incident: a test deleted the real configuration

A test called `reclaimConfiguration` inside `withHome`, with an async callback. After the first `await`, the callback worked on the real home. At 17:37:14 `~/.rule-mcp/config/` was left empty.

`withHome` is synchronous by contract: it restores `RULE_MCP_HOME` and removes the temp dir in `finally`. A promise-returning callback escapes that window. The current body of `packages/shared/_testkit.js` still returns `fn(home)` unchanged, so the hole is open until the worktree fix lands.

Lost for certain: `env.json` and `install.json` in `config/`. `projects.json` is uncertain. There is no backup and no snapshot. The MCP servers keep working, because each agent holds its own values. The 17:34 reinstall writes those files; it did not empty them.

The test is now hermetic and asserts that every path stays in the test home. The general `withHome` risk has its own plan card.

## Repairs made in this session

- Global post-commit chain added: `~/.config/git/hooks/post-commit`, copied from the `post-merge` shim and executable. Without it the repo shim never runs, because `core.hooksPath` is `~/.config/git/hooks`.
- `.git/hooks/post-commit` is the repo shim again, and `.git/hooks/post-commit.bak` holds the old `pix-galaxy-mcp` hook.

`pnpm exec` had re-run `prepare` in the repository. That replaced the local hook with the shim.

## Verified now, and reported earlier

Checked in this session: clean tree, 17 commits ahead, no tag, empty `~/.rule-mcp/config`, missing global `post-commit`, 23 chapters, 82 skills in the census, 124 guardrail rules, `fast-uri: 4.2.3` in `pnpm-workspace.yaml`, and one full `pnpm run ci`: 3220 tests, 3217 passed, 3 skipped, 0 failed.

Reported by the previous session and not re-run here: 92.2% coverage in the CI tree with 164 new tests, a 27-branch margin over the floor, 11/11 Playwright and WCAG checks over 25 pages, two consecutive local releases, a clean secret scan, and 3.4% yield from the ADR and handoff compression pass. Treat those as claims until `pnpm test:coverage` runs again.

## Fixed after the first handoff

The first `pnpm release` run stopped in `pnpm run ci`. `_task-extras-branches.test.mjs` failed on the row that explains a rejected command sync.

Cause: a runner that exports `FORCE_COLOR` made the child CLI print a Node warning. The capture sets `NO_COLOR`, so Node warned on every child. The task keeps the last six log lines, and the two warning lines pushed the CLI's complaint out of that window.

Fix: `runCliCommand` now drops the inherited `FORCE_COLOR` before it sets `NO_COLOR`, in `packages/mcp/cli/setup/_exec.js`. A new test, `packages/mcp/cli/setup/__tests__/_exec.test.mjs`, fails before the fix and passes after it. `pnpm run ci` is green at `da9521e8`.

## Open items, in order

1. Run `rule-mcp setup` and rebuild `env.json` and `install.json`. The wizard needs a terminal, so it was not run here.
2. Run `pnpm release --dry-run --version 0.1.0`, then `pnpm release --version 0.1.0`. The release pushes `main` and the tag.
3. Land the `withHome` fix from the `pensive-gauss-ae1b68` worktree, then close its plan.
4. Remove the `pnpm dlx rule-mcp` fallback. It is still in `scripts/install.sh:112`, `scripts/uninstall.sh:54`, `scripts/install.ps1:90` and `scripts/uninstall.ps1:61`. The npm name `rule-mcp` returns E404, so a squatter would own that command.
5. Check the npm publication, or reserve the name.

## Doubts on record

- `ajv` declares `^3.0.1`, and the override forces `fast-uri` 4.2.3, a different major. GitHub CI passed on that tree, and the audit gate is part of the workflow. Decide whether to keep the pin on that evidence.
- `pnpm-workspace.yaml` changed at 17:45:44, and nobody claims it. The comment in the file explains the pin as advisory remediation.
- Not verified: the new tests on Windows and Linux, and the Docker build. The `Dockerfile` moved to `node:26-alpine` because Node 22 refuses to start the server, but Docker is absent here. `zizmor` is verified: the `Check workflows` job passed on `489640a3`.
- `docs/migrations/rule-mcp-rename.md` was not reviewed.
- After an uninstall, `~/.claude.json` can stay empty.
- `install.sh` outside a checkout still falls back to `pnpm dlx rule-mcp`. See open item 4.
- `pnpm 11` and `pnpm 12` both run the project script, so the block in the docs is correct.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace from docs/handoff/56-docs-ci-hook-and-the-test-that-deleted-the-real-config.md. Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them is trusted.

State: `origin/main` is at 489640a3, with the GitHub workflows green. Local `main` is 2 commits ahead at eac2cd7d, the tree is clean, and no tag exists. Two open holes: the `withHome` async hole (fix uncommitted in the `pensive-gauss-ae1b68` worktree) and the `pnpm dlx rule-mcp` fallback in four install scripts.

First step: run `rule-mcp setup` in a terminal and confirm `~/.rule-mcp/config/env.json` and `install.json` exist again. Then `pnpm release --dry-run --version 0.1.0`, then `pnpm release --version 0.1.0`. Pages is already active, so skip that step. Export `FORCE_COLOR` freely: the setup log now survives it.

Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message. Do not push outside the release command. Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
