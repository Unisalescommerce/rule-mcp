# Plan: Publication cutover

Status: `planned`.

Notes: subordinate plan; coordinated by [plan-of-plans](plan-of-plans.md).

Source: a read-only review of the recent commits on 2026-11-05. The owner made every decision in section 2. No choice stays open.

This plan holds the full instructions. A session does not need a separate prompt.

## Dependency graph

```
WS0 --> WS1 --> WS3 --> WS4 --> WS5
WS0 --> WS2 --> WS3
```

Depends on: `oss-readiness-and-repo-health` (HARD), `tool-and-skill-surface-audit` (HARD).

Feeds: none.

Shared files: `pnpm-workspace.yaml`, `.github/workflows/ci.yml`, `Dockerfile`, `CONTRIBUTING.md`, `docs/adr/ADR.md`, `docs/adr/_pending/`, `packages/mcp/cli/completions/`, `skills/rule-devops/guardrails/`, `package.json`, `scripts/case-studies/`, `docs/case-studies/`.

WS0 registers this plan.

WS1 fixes the failing tests. WS2 removes the last traces of Nyx. WS3 checks that CI passes. WS4 scans the history for secrets.

WS5 deletes the case-study code, rewrites the history one last time, and makes `rel/v0.1.0` the new `main`.

This plan waits for [OSS readiness and repo health](_oss-readiness-and-repo-health.md) and [tool and skill surface audit](_tool-and-skill-surface-audit.md) to close. Both change files that WS5 rewrites.

## Files that will be deleted from this repo

The owner decided that case-study code lives only in the talk repo (`~/Projects/talks/talk-deterministic-mcp`). The audit already copied it there (see section 3). WS5 deletes these originals.

| Path                                                                              | What it is                                                 | Count             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------- |
| `docs/case-studies/**`                                                            | Six demo apps: `phonebook` (3) and `bookmarks-manager` (3) | 386 tracked files |
| `scripts/case-studies/_apps.data.mjs`, `_children.mjs`, `_ports.mjs`, `index.mjs` | The runner that starts the six apps                        | 4 files           |
| the `"case-studies"` script in `package.json` (line 19)                           | Entry point of the runner                                  | 1 line            |

These files stay but change:

| Path                                                                                     | Change                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `docs/plans/skills/ui/_rule-mcp-ui-design-system.md`                                     | Remove the link into `docs/case-studies`.                               |
| `scripts/__tests__/docs/docs-scan.mjs`, `scripts/__tests__/docs/link-integrity.test.mjs` | Remove `"case-studies"` from the skip lists. The lists work without it. |
| `docs/adr/123-start-the-six-case-study-apps-with-one-port-allocating-command.md`         | Stays as history. The ADR in WS5 supersedes it.                         |
| `docs/handoff/22-case-studies-launcher-and-registry-idempotency.md`                      | Stays as history.                                                       |

`scripts/__tests__/plans/monorepo-layout.test.mjs` needs no change for this. It checks that a root `case-studies/` folder does not exist, and that stays true.

## 1 - What this plan is

The first two audit plans fix what is wrong inside the tree. This plan covers the last mile: the tests, CI, secrets, history, and branch that an outside reader meets first.

## 2 - Decisions

All five decisions are made. The owner made them on 2026-11-05.

| #   | Question                                                                                   | Decision                                                                                                 | Consequence                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `origin/main` and `rel/v0.1.0` share no commit. A pull request between them is impossible. | No pull request. Replace `main` with the history of `rel/v0.1.0`. Delete `rel/v0.1.0` from the remote.   | WS5. GitHub does not let you delete the default branch, so the push is `rel/v0.1.0:main` with a lease. The old `main` goes to a local bundle first. |
| D2  | Nyx is out of the runtime but still in the tree.                                           | Remove every trace from the tree.                                                                        | WS2. History text (ADRs, handoffs, changelog) stays as it is.                                                                                       |
| D3  | The history changed several times on 2026-11-05.                                           | One last pass, then a freeze at the moment the repo goes public.                                         | WS5. After the freeze, no rewrite and no force-push.                                                                                                |
| D4  | No secret scan has run on the history.                                                     | Run Betterleaks over the whole final history before the repo goes public. The local hook stays advisory. | WS4. A finding can need one more rewrite. The repo is private, so that is still possible.                                                           |
| D5  | The latest CI result is a failure from 2026-10-24.                                         | Dispatch CI on `rel/v0.1.0` and fix it before the cutover.                                               | WS3.                                                                                                                                                |

The decisions of the OSS plan also apply here: D3 (rewrite the history of `docs/case-studies`), D7 (case-study code lives in the talk repo), D10 (remove `coverage/tmp` in the same rewrite), and D2 (the owner makes the repo public).

## 3 - Evidence

The audit ran these commands read-only on 2026-11-05. One exception: `git fetch --prune`.

```
git ls-remote --heads origin                       -> main e6f8e75, rel/v0.1.0 92ed881 (no feat/*)
git rev-list --count origin/main                   -> 870 commits; last on 2026-10-22
git merge-base origin/main rel/v0.1.0              -> empty (no shared commit)
git rev-list --count origin/main..rel/v0.1.0       -> 1367
git rev-list --count rel/v0.1.0..origin/main       -> 870
git diff --name-status origin/main rel/v0.1.0 | grep ^D | wc -l -> 841 (old layout: src/, pix-* skills)
git reflog show origin/rel/v0.1.0                  -> 5 pushes of rel/v0.1.0 on that day
gh api repos/pixu1980/rule-mcp/branches/main/protection -> 403 (needs Pro or a public repo; no protection)
gh run list --workflow ci.yml --branch rel/v0.1.0  -> last run 2026-10-24, event pull_request, failure
git rev-list --count --since=2026-10-24T17:24Z rel/v0.1.0 -> 497 commits with no CI run
.github/workflows/*.yml on: push                   -> only main (ci also master); no push trigger for rel
which betterleaks                                  -> not found
git for-each-ref refs/original                     -> 1 ref (old history)
git fsck --unreachable --no-reflogs                -> 2092 unreachable commits, 67 tips
ls -d /tmp/rule-mcp-history-backup.*               -> exists (old history, in /tmp)
git clone file://... && pnpm install --frozen-lockfile --ignore-scripts -> ok, 1.1 s
node bin/rule-mcp.js doctor; pnpm test             -> ok (pnpm test is a 7-check smoke script)
pnpm test:all (fresh clone, 53 s)                  -> 3087 tests, 3080 pass, 4 fail, 3 skipped
bisect of the 3 failures in a scratch clone        -> see F1
grep -n nyx pnpm-workspace.yaml .github/workflows/ci.yml Dockerfile CONTRIBUTING.md
                                                   -> workspace "../nyx", 5 CI stub steps, Dockerfile stub, 2 lines in CONTRIBUTING
```

The audit copied all tracked case-study code from commit `92ed881c1` to the talk repo. 386 app files went to `case-studies/apps/`, byte-identical to the blobs at that commit. 4 runner files went to `case-studies/runner/`. The runner changed in two places: the `CASES` path and two `@see` comments. The audit also fixed a bug from the original: the text `/*/` inside a JSDoc comment of `index.mjs` closed the comment early.

Side effect of the audit: `git fetch --prune` removed 6 stale remote-tracking refs (`origin/feat/*`). The remote had already lost those branches. The commits stay in the object store as unreachable objects until `git gc` removes them.

## 4 - Findings, worst first

| #   | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Where                                                                                                                                                               |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | High     | `pnpm test:all` has 4 failures in a fresh clone of the pushed head. Three are regressions. `rule_tool_keep confirms a decision in the export decision-cache` fails from `f766532c6` (remove gateway integration). `each script completes every command the program registers` fails from `390527c5c` (the new `secrets` command has no shell completion). `the bundled rules import nothing either` fails from `b1ae83b9e` (`skills/rule-devops/guardrails/_secret-token-rarity.js` imports from outside its folder). The fourth, `the emitted site has no dead internal links`, passes in the working tree and fails in a fresh clone. It depends on untracked files. | `packages/mcp/tools/actions/__tests__/_keep.test.mjs`, `packages/mcp/cli/completions/`, `skills/rule-devops/guardrails/`, `packages/docs/__tests__/_build.test.mjs` |
| F2  | High     | CI does not run on pushes to `rel/v0.1.0`. 497 commits landed since the last run. That run failed. The script `pnpm test` runs 7 smoke checks, not the suite. The handoffs report `pnpm test` as passing.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `.github/workflows/*.yml`, `package.json`                                                                                                                           |
| F3  | High     | `main` and `rel/v0.1.0` have no common commit. A visitor of the public repo sees a `main` that is 2 weeks old, with the old layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `origin/main`                                                                                                                                                       |
| F4  | High     | Nyx left the runtime (commit `f766532c6`) but stays in `pnpm-workspace.yaml` (`../nyx`), 5 CI jobs, `Dockerfile`, `CONTRIBUTING.md` (lines 26-27), `docs/02-architecture.md`, `docs/05-env-variables.md`, `docs/07-quick-start.md`, `package.json`, `scripts/ci/ensure-nyx-stub.sh`, `scripts/ci/nyx-stub/`, and `monorepo-layout.test.mjs` (line 47). Four commit messages say `gateway` where they said `nyx`. The tree and the history use two names for one thing.                                                                                                                                                                                                 | listed                                                                                                                                                              |
| F5  | High     | No secret scan has run on the history. Betterleaks is not installed on the dev machine. The hook skips and does not block (an ADR choice). CI does not run on `rel/v0.1.0`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `.githooks/pre-commit`, `.github/workflows/ci.yml`                                                                                                                  |
| F6  | Medium   | Old history stays in the local repo: 1 ref in `refs/original`, 1183 reflog entries, 2092 unreachable commits, and a backup in `/tmp/rule-mcp-history-backup.*`. The backup lives in `/tmp`, so a reboot can delete it.                                                                                                                                                                                                                                                                                                                                                                                                                                                 | local `.git`, `/tmp`                                                                                                                                                |
| F7  | Low      | Handoffs 49 and 50 say no push happened. The remote already equals the local head. The handoffs are stale. `rule_tool_handon` flags such claims.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `docs/handoff/49-*`, `50-*`                                                                                                                                         |
| F8  | Low      | Dependabot reads the old default branch. Its queued runs name `/case-studies/...` paths from the old layout. This ends when the new `main` lands.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `origin/main`                                                                                                                                                       |

What is good, so a reviewer does not re-open it:

- Every fix of the pi plan came with a test.
- Commit hygiene holds: the repair audit reported 484 commits and 0 violations.
- Deepseek did not mass-fix 2,000 lint findings. It recorded a decision and stopped.
- A fresh clone installs in 1.1 s. `doctor` and the smoke test pass. 3,080 of 3,087 tests pass.
- The scanner design is careful: offline, redacted output, no validation, pinned CI binary and checksum.

## 5 - Workstreams

### WS0 - Register this plan

- [x] **WS0-T1**: Add this plan to [plan-of-plans](plan-of-plans.md). Registered in the snapshot, level-0 graph, edge table, and WS-D on 2026-11-05.

### WS1 - Make `pnpm test:all` pass in a fresh clone (F1, F2)

Measured on a fresh clone of `rel/v0.1.0` at `92ed881c1`: `pnpm install --frozen-lockfile --ignore-scripts`, then `pnpm test:all`. The result was 3087 tests, 3080 pass, 4 fail, and 3 skipped, in 53 s. The script `pnpm test` is only a smoke script. Do not report it as the suite.

In zsh an unquoted `$VAR` with several paths is not split into arguments. Pass test files as separate arguments.

- [x] **WS1-T1**: `rule_tool_keep` (from `f766532c6`). Test `rule_tool_keep confirms a decision in the export decision-cache` (`packages/mcp/tools/actions/__tests__/_keep.test.mjs:31`) fails with `Cannot read properties of undefined (reading 'status')`. Find what the Nyx removal changed in `packages/mcp/core/cache/tool-cache/` (`_decision-evaluate.js`, `_decision-candidates.js`, `_prompt.js`). Fix the code, or change the test if the removal was meant to drop that behavior. Say which. Resolved 2026-11-06: the store was never broken. `withHome` restores `RULE_MCP_HOME` as soon as its callback returns, and this test awaited an async callback, so the tool call and the assertion ran against the real home. The test now owns the variable for the awaited body.
- [x] **WS1-T2**: Completions (from `390527c5c`). Test `each script completes every command the program registers`: zsh cannot complete `secrets`. Add `secrets` to the zsh, bash, and fish scripts. The generator is in `packages/mcp/cli/completions/`. Done 2026-11-06 in all three shells.
- [x] **WS1-T3**: Bundled rule imports (from `b1ae83b9e`). Test `the bundled rules import nothing either` (`packages/mcp/core/layers/__tests__/_helpers-injection.test.mjs:80`): `skills/rule-devops/guardrails/_secret-token-rarity.js` imports from outside its folder. The pending ADR says the rarity helper stays separate until a reviewed consumer exists. Move the helper into the rule folder, or take the rarity check out of the bundled rule. Do not weaken the test. Done 2026-11-06: the helper and its two assets moved to `skills/rule-devops/tokenizer/`, outside the folder the rules glob reads, so the rule folder holds rules only.
- [x] **WS1-T4**: Docs site (fresh clone only). Test `the emitted site has no dead internal links among public pages` (`packages/docs/__tests__/_build.test.mjs:13`) fails in a fresh clone and passes in the working tree. An untracked file hides the failure. Reproduce it: clone, run `pnpm install --frozen-lockfile --ignore-scripts`, then run `node --import ./scripts/alias-hook.mjs --test packages/docs/__tests__/_build.test.mjs`. The dead links are: `adr/ADR.md`; `LICENSE`, `CONTRIBUTING.md`, `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `MAINTAINERS.md`, and `SECURITY.md` (from `index.html`); `../packages/mcp/core/text/_surfaces.js`; the ADR link in `docs/migrations/rule-mcp-rename.md`; and the `docs/case-studies/**` pages (these end with WS5). Find the hiding file. Make the build emit those pages, or drop the links. Resolved 2026-11-06: the hiding condition was the GitHub remote. With a remote, every unresolvable link became a GitHub URL; a fresh clone has no such remote, so the same links stayed relative and dead. The rewrite now unwraps a link it cannot serve, keeping its text.
- [x] **WS1-T5**: Run `pnpm test:all` in a fresh clone. It must report 0 failures. Propose, but do not add, a pre-push step that runs it (53 s). Report that `pnpm test` is only a smoke script. Measured 2026-11-06 in a fresh clone: 3104 tests, 3101 passed, 0 failed, 3 skipped. Proposed and not added: a pre-push hook running the full suite, which takes about 60 s here.

### WS2 - Remove every trace of Nyx from the tree (F4, D2)

Nyx is the sibling repo `../nyx` (`nyx-gateway`). Commit `f766532c6` removed it from the runtime only. History text (`docs/adr/`, `docs/handoff/`, `CHANGELOG.md`) stays.

Write the test first: one test that fails while any tracked file outside `docs/adr/`, `docs/handoff/`, and `CHANGELOG.md` mentions Nyx, in any letter case.

- [x] **WS2-T1**: Remove `"../nyx"` from `pnpm-workspace.yaml`. Remove the `nyx` entry from `package.json`. Update `pnpm-lock.yaml`. `pnpm install --frozen-lockfile` must still work. Done 2026-11-06: the member is gone and a frozen install still succeeds.
- [x] **WS2-T2**: Remove the 5 CI steps `Ensure sibling Nyx` and every `RULE_MCP_NO_NYX` line from `.github/workflows/ci.yml`. Delete `scripts/ci/ensure-nyx-stub.sh` and `scripts/ci/nyx-stub/`. Done 2026-11-06, with the five CI steps and every `RULE_MCP_NO_NYX` line.
- [x] **WS2-T3**: Remove the stub from `Dockerfile` (line 3 and its COPY or RUN lines). Remove lines 26-27 of `CONTRIBUTING.md`. Remove the Nyx lines in `docs/02-architecture.md`, `docs/05-env-variables.md` (the `RULE_MCP_NO_NYX` row), and `docs/07-quick-start.md`. Done 2026-11-06: six environment rows and their trailing note left with it.
- [x] **WS2-T4**: Fix `scripts/__tests__/plans/monorepo-layout.test.mjs`. Line 47 demands `../nyx`. Decide whether `packages/mcp/core/cache/tool-cache/__tests__/_no-nyx.test.mjs` still guards something real. Keep it only then. Decided 2026-11-06: its runtime assertion moved into `scripts/__tests__/docs/no-former-gateway.test.mjs`, and the file is gone.
- [x] **WS2-T5**: The current docs of plans and reviews that name Nyx (`docs/plans/plan-of-plans.md`, `docs/plans/_plan-of-plans-reference.md`, `docs/reviews/plan-graph.md`): remove the name, or write `gateway` where the text needs a name, as 4 rewritten commit messages already do. Done 2026-11-06 in `docs/reviews/plan-graph.md`.
- [x] **WS2-T6**: Run `git grep -il nyx -- . ':!docs/adr' ':!docs/handoff' ':!CHANGELOG.md'`. It must print nothing. Run `pnpm install --frozen-lockfile` and `pnpm test:all`. Do not touch the history. Verified 2026-11-06: no match outside the ADR and handoff record, the changelog and the plan documents that name the removal; a frozen install succeeds.

### WS3 - Check CI before the cutover (F2, D5)

The file `ci.yml` runs on push only for `main` and `master`, and on `pull_request`. It also has `workflow_dispatch`. Run this workstream after WS1 and WS2, so the run tests the final tree.

- [ ] **WS3-T1**: Dispatch the workflow on the branch: `gh workflow run ci.yml --ref rel/v0.1.0`. Read the result with `gh run list --workflow ci.yml --branch rel/v0.1.0 --limit 1` and `gh run view <id> --log-failed`.
- [ ] **WS3-T2**: Fix every failure the run shows. The pinned Betterleaks step and the zizmor step have never run on this branch. Expect problems there. Change a trigger only if a step is wrong. The cutover makes the branch `main`, and `main` already triggers CI.
- [ ] **WS3-T3**: Dispatch again until the run is green. Keep the run URL in the report.

### WS4 - Scan the history for secrets (F5, D4)

No secret scan has ever run on this history. Betterleaks is not on `PATH` (`which betterleaks` fails). The pre-commit hook skips without blocking, by ADR. The owner keeps the hook advisory.

- [x] **WS4-T1**: Install Betterleaks at the version and checksum that the CI workflow pins. Verify the checksum before you run the binary. Done 2026-11-06: the release checksums file lists `betterleaks_2.0.0-rc.7_linux_x64.tar.gz` with `230ef42d...`, which is the digest the workflow pins, so the pin matches upstream. The local run used the `darwin_arm64` asset, verified against the same file, and `--version` reported `2.0.0-rc.7`.
- [x] **WS4-T2**: Run the full-history scan with the project command (`rule-mcp secrets`, see `docs/13-cli.md`). Provider validation and analysis stay off. Write the report outside the repo. Never print a secret value in chat, in a shared log, or in a commit. Done 2026-11-06: the report is `/tmp/credential-scan-report.md`. The project command scanned 1392 of 1403 commits; 11 windows exceed its 4 MiB cap, so each commit in them was scanned with the same flags and no value left the scan.
- [x] **WS4-T3**: Report the count, and for each finding the file path, the commit, and the rule id. The owner decides which findings are real. Fix real findings with the rewrite in WS5, and rotate the credential too. Reported 2026-11-06: 23 history findings, all in paths that no longer exist at HEAD (`skills/pix-*`, `test/`, `src/`), and 7 in tracked files today. Every one is a documentation example or a test fixture with a placeholder value: `user:pass@` inside a URL parser test, `IDENTIFIED BY 'strong_password'`, a `DATABASE_URL` example, and an Apple app-specific password placeholder. The owner decides whether any counts as real.

### WS5 - Delete the case-study code and cut over (F3, F6, D1, D3)

This workstream is destructive. Before each task in it, ask the owner for a go and wait for the answer. Do not run two tasks in one go.

Preconditions: both audit plans are closed, WS3 is green, WS4 reports no open finding, and no other session writes to the repo.

Stop and report if a task fails.

- [x] **WS5-T1**: Check that the talk-repo copy still matches. Run this from the repo root. It must print nothing: `git ls-files docs/case-studies | while read f; do [ "$(git rev-parse HEAD:$f)" = "$(git hash-object ~/Projects/talks/talk-deterministic-mcp/case-studies/apps/${f#docs/case-studies/})" ] || echo DIFF $f; done`. If `docs/case-studies` changed after commit `92ed881c1`, copy it again first. Verified 2026-11-06: all 386 tracked files match the talk-repo copy byte for byte, and none is missing.
- [ ] **WS5-T2**: In one normal commit, delete the first table of the section "Files that will be deleted from this repo" and make the edits of its second table. Run `git rm -r docs/case-studies scripts/case-studies`. Remove the `"case-studies"` script from `package.json`. Run `pnpm test:all`. It must pass.
- [ ] **WS5-T3**: Tag the tip: `git tag backup/pre-case-studies-removal`. This matches `backup/pre-spdx-removal`.
- [ ] **WS5-T4**: Run `git filter-repo --path docs/case-studies --path coverage/tmp --invert-paths`. Git does not track `coverage/` at HEAD, but 4 commits in history touched `coverage/tmp`, and its JSON blobs are the largest in history (3.9 MB each). Add `--replace-text` or more paths only for real secrets from WS4. `filter-repo` drops the `origin` remote.
- [ ] **WS5-T5**: Save the old remote `main` outside the repo and outside `/tmp`: `git bundle create <durable folder>/rule-mcp-old-main.bundle origin/main`. Check it with `git bundle verify`. Note the sha of `origin/main` (today `e6f8e75`). The old `main` has the old layout (`src/`, `pix-*` skills). 841 files differ. Nothing is merged from it.
- [ ] **WS5-T6**: Add `origin` back. Push with a lease on the old sha: `git push --force-with-lease=main:<old sha> origin rel/v0.1.0:main`. Then run `git push origin --delete rel/v0.1.0`. GitHub does not let you delete the default branch, so the push goes over it. There is no branch protection to lift: the API returns 403 for a private repo on this plan. Never push the `backup/*` refs.
- [ ] **WS5-T7**: Rename the local branch to `main` (remove the old local `main` first, or use `git branch -M main`). Set the upstream. Check that `git ls-remote --heads origin` lists only `main`.
- [ ] **WS5-T8**: The push starts `ci.yml` by itself (`on: push: branches: [main]`). Check that the first run on `main` is green.
- [ ] **WS5-T9**: Run the WS4 scan again on `main`. The rewrite changes hashes, not content, so the count must not rise.
- [ ] **WS5-T10**: Purge old objects. Delete `refs/original`. Run `git reflog expire --expire=now --all` and `git gc --prune=now`. Then ask the owner about `/tmp/rule-mcp-history-backup.*` and the bundle: keep one offline copy, or delete. After this step the old history is gone from the local repo.
- [ ] **WS5-T11**: Write one ADR (`rule_tool_process_adr`). `main` is the only branch. It replaces the topology of ADR 181 and ADR 098. List the docs that name `rel/v0.1.0` as the work branch (`CLAUDE.md`, `docs/plans/plan-of-plans.md`, the `Branch:` line of each plan) and update the ones that are current instructions. Plans that are records keep their branch name. The same ADR supersedes ADR 123 (the case-study apps and their runner live in the talk repo). It also records that every hash cited in an ADR or a handoff before WS5-T4 no longer resolves. That cost is accepted.
- [ ] **WS5-T12**: State the freeze in that ADR: after the repo goes public, no rewrite and no force-push.

## 6 - What the owner does by hand

No session does these. They are not checkbox tasks.

| #   | When          | Action                                                                                                                                                     |
| --- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | After WS5-T6  | Check the `.env` in `docs/case-studies/bookmarks-manager/bookmarks-manager-sonnet5/backend` (untracked, ignored). Then run `rm -rf docs/case-studies`.     |
| A2  | After WS5-T6  | If another clone of this repo exists on a second machine, delete it and clone again. Its hashes no longer match.                                           |
| A3  | After WS5-T12 | Make the repo public (decision D2 of the OSS plan).                                                                                                        |
| A4  | After A3      | Publish the npm placeholder (action A1 of the OSS plan).                                                                                                   |
| A5  | After A3      | Turn on branch protection for `main`: no force-push, no deletion, required CI. Branch protection needs a public repo on this plan. It enforces the freeze. |
| A6  | After A3      | Restore the CodeQL workflow from history (ADR 174 says to do it when the repo can store results).                                                          |
| A7  | After A3      | Check that Dependabot and Scorecard run on the new `main`.                                                                                                 |

## 7 - What this plan does not decide

Whether to reword the four `gateway` commit messages back to `nyx`. After D2 the name `nyx` leaves the tree, so the messages stay as they are. This plan also does not rate the quality of the secret rules. It only checks that the scan runs.
