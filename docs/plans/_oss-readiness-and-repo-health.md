# Plan: OSS readiness and repo health

Status: `planned`.

Notes: subordinate plan; coordinated by [plan-of-plans](plan-of-plans.md).

Source: a read-only audit of the repository on 2026-11-05.

The owner made every decision in section 1. No choice stays open.

This plan holds the full instructions. A session does not need a separate prompt.

## Dependency graph

```
WS0 --> WS1 --> WS2
WS1 --> WS3
WS1 --> WS4
```

Depends on: none.

Feeds: `_publication-cutover.md` (it waits for this plan to close).

Shared files: `package.json`, `packages/mcp/package.json`, `server.json`, `scripts/SHA256SUMS`, `docs/adr/ADR.md`, `docs/adr/_pending/`, `eslint.config.mjs`, `docs/05-env-variables.md`, `docs/plans/plan-of-plans.md`.

WS0 registers this plan.

WS1 writes ADRs and changes no code.

WS2, WS3, and WS4 touch different files and can run in any order after WS1.

The plan [tool and skill surface audit](_tool-and-skill-surface-audit.md) shares `docs/adr/ADR.md` and `CLAUDE.md` with this plan.

Run only one of the two plans at a time. This plan never edits the `CLAUDE.md` counts. The other plan owns them.

This plan settles the 8 duplicate ADR pairs in 001-020 (WS4-T1). The other plan settles the ninth pair (136 and 155). Run WS4-T1 first.

The history rewrite and the case-study deletion are not here. They are WS5 of [publication cutover](_publication-cutover.md).

## What the owner does by hand

No session does these. They are not checkbox tasks.

| #   | When                               | Action                                                                                                                                                                                                                                   |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | After WS4-T5                       | Publish the placeholder package: `pnpm publish --access public` in the prepared folder. This needs the owner's npm login and 2FA. Do it when the repo goes public. The package README links to the repo, and a private repo gives a 404. |
| A2  | See the cutover plan               | Make the GitHub repo public (decision D2).                                                                                                                                                                                               |
| A3  | After the push in the cutover plan | If another clone of this repo exists on a second machine, delete it and clone again. Its hashes no longer match.                                                                                                                         |

## 1 - Decisions

All eleven decisions are made.

| #   | Question                                                                                                                  | Decision                                                                                                                                                      | Consequence                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | The repo is `pixu1980/rule-mcp`. ADR 169 and 23 tracked files name `pixu1980/rule`, which returns HTTP 404.               | Decouple. The repo stays `rule-mcp`. "RuleMCP" is a display name only.                                                                                        | WS2 fixes the files and 4 tests. WS1-T1 writes one ADR that narrows ADR 169.                                                                                     |
| D2  | The repo is private. When does it go public?                                                                              | The owner, by hand, at talk time.                                                                                                                             | No step in this plan changes visibility.                                                                                                                         |
| D3  | What happens to the history of `docs/case-studies`?                                                                       | Rewrite history to remove the path. The owner chose this after seeing the numbers: the gain is small (about 1.2 MB).                                          | Cutover plan, WS5. Every commit hash changes. ADRs and handoffs keep their old hashes as history.                                                                |
| D4  | The tool applies updates by itself. What is the new default?                                                              | Notify only. The tool tells the user in the agent's chat that an update exists and names the command to run by hand.                                          | WS3. The notify mode already exists. WS3 makes it the default.                                                                                                   |
| D5  | What is the registry name in `server.json`?                                                                               | `io.github.pixu1980/rule-mcp`.                                                                                                                                | WS2. `rename.test.mjs` changes with it. The name was never published.                                                                                            |
| D6  | The lint rule `unicorn/no-asterisk-prefix-in-documentation-comments` rejects the JSDoc style of the whole repo. What now? | Turn the rule off. Record the decision in an ADR.                                                                                                             | WS1-T3 and WS4-T2. No rewrite of about 2,000 comments.                                                                                                           |
| D7  | Where does case-study code live?                                                                                          | In the talk repo only. Delete it from this repo, including the runner.                                                                                        | The copy is done (see section 2). The cutover plan deletes the originals.                                                                                        |
| D8  | Six `feat/*` branches showed in the local branch list. What now?                                                          | Nothing to delete. `git ls-remote --heads origin` lists only `main` and `rel/v0.1.0`. The local remote-tracking refs were stale. The audit pruned them.       | No task.                                                                                                                                                         |
| D9  | Nobody owns the npm name `rule-mcp`. `npm view` returns 404.                                                              | Publish a placeholder package to reserve the name.                                                                                                            | WS1-T4 writes an ADR that replaces the "no placeholder yet" part of ADR 084. WS4-T5 prepares the package. The owner publishes it (A1). The package does nothing. |
| D10 | The largest blobs in history are `coverage/tmp/*.json` files (about 3.9 MB each). Git does not track `coverage/` at HEAD. | Remove `coverage/tmp` in the same rewrite as `docs/case-studies`.                                                                                             | Cutover plan, WS5.                                                                                                                                               |
| D11 | The owner wrote `/root-update` as the manual update command.                                                              | The command is `/rule-update`. It already exists (`docs/11-prompts.md`: "Apply an available server update explicitly"). The words `/root-update` were a typo. | WS3 adds no new command. The banner names `/rule-update` in chat, and `rule-mcp update` in a shell.                                                              |

## 2 - Evidence

The audit ran these commands read-only from the repo root on `rel/v0.1.0`.

```
git log --oneline | wc -l                         -> 1367 commits
git log --format='%s' (type before the scope)     -> docs 411, feat 300, fix 175, refactor 147, test 141, chore 136
subjects without "type(scope):"                   -> 1 (fix(pix_fix): ...)
du -sh .git                                       -> 65M
git ls-files docs/case-studies | wc -l            -> 386 files
git ls-tree -r -l HEAD docs/case-studies          -> 1.2 MB tracked
du -sh docs/case-studies                          -> 2.2G on disk (untracked node_modules)
git ls-files | grep -i case-stud                  -> 392 paths: 386 apps, 4 runner files, ADR 123, handoff 22
git hash-object (copy) vs git rev-parse HEAD:path -> 386 of 386 equal
node --check scripts/case-studies/index.mjs       -> SyntaxError (the comment closes early)
largest history blobs                             -> coverage/tmp/coverage-*.json, 3.9 MB each
git ls-files coverage | wc -l                     -> 0 at HEAD (.gitignore ignores coverage/)
git grep -nE 'pixu1980/rule([^-A-Za-z0-9_]|$)'    -> 23 tracked files outside docs/adr and docs/handoff
curl -I https://github.com/pixu1980/rule          -> 404
gh repo view pixu1980/rule-mcp --json isPrivate   -> true
pnpm lint                                         -> 2294 problems (2204 errors)
pnpm audit --audit-level=moderate                 -> 2 moderate, both dev-only (c8, eslint)
pnpm view rule-mcp                                -> 404 (npm name unowned)
gh repo view pixu1980/homebrew-tap                -> not found
.github/workflows/*                               -> no workflow names docker or ghcr
node -e verifyAdr(<dir>, "<old pending slug>")     -> "not written" for a landed ADR (fixture in /tmp)
node -e commandNames() | grep update              -> rule-update (a slash command already exists)
sed -n 1,12p docs/adr/084-*.md                    -> "No npm placeholder is published now"; revisit 2027-03-10
```

On 2026-11-05 the audit copied all tracked case-study code from commit `92ed881c1` to the talk repo `~/Projects/talks/talk-deterministic-mcp`.

| From (this repo)             | To (talk repo)         | Files |
| ---------------------------- | ---------------------- | ----- |
| `docs/case-studies/**`       | `case-studies/apps/**` | 386   |
| `scripts/case-studies/*.mjs` | `case-studies/runner/` | 4     |

The 386 app files are byte-identical to the blobs at that commit. The runner changed in two places: the `CASES` path and two `@see` comments. The audit also fixed a bug from the original: the text `/*/` inside a JSDoc comment of `index.mjs` closed the comment early.

## 3 - Findings, worst first

| #   | Severity | Finding                                                                                                                                                                                                                                                                                                     | Where                                                                       |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| F1  | Medium   | `docs/case-studies` is 2.2 GB on disk, but git tracks only 1.2 MB there. `.git` is 65 MB. A clone is small. The weight is untracked `node_modules`. The tracked code is demo apps, not product.                                                                                                             | `docs/case-studies/**`                                                      |
| F2  | High     | 23 tracked files name `github.com/pixu1980/rule`, a repo that does not exist. Examples: the advisory link in `SECURITY.md:83`, the install URL in `packages/mcp/cli/setup/_next-steps.js`, the clone commands in 4 docs, and 4 tests that enforce the wrong value.                                          | list in WS2                                                                 |
| F3  | High     | `pnpm lint` fails with 2294 problems. About 2,000 come from one rule that rejects the repo's own JSDoc style. `_pi-integration-and-debt.md` WS3-T5 measured it and left the decision open.                                                                                                                  | `eslint.config.mjs`                                                         |
| F4  | High     | The tool applies a new release by itself: checkout `main`, pull, reinstall. Then, for stdio installs, it exits the process. `docs/05-env-variables.md` says the default is notify-only. The code default is `upgrade`. Docs and code disagree.                                                              | `packages/mcp/core/self-update/_config.js:20`, `docs/05-env-variables.md:6` |
| F5  | Medium   | `docs/04-operations.md` (lines 370-376) lists 5 install channels. None exists today: npm returns 404, the Homebrew tap repo is missing, no workflow publishes a Docker image, and Winget and Scoop pin a `v0.1.0` tag that does not exist. `pnpx rule-mcp serve` would run whoever registers that npm name. | `docs/04-operations.md`                                                     |
| F6  | Medium   | 8 ADR pairs in 001-020 are identical except the number in the heading. `settleDuplicateAdrs` catches only collisions on the same number. These pairs have different numbers.                                                                                                                                | `docs/adr/001,007 ... 011,017`                                              |
| F7  | Low      | A landed ADR cited by its old pending slug reports "not written". The numbered lookup matches `<id>-` as a prefix, and the slug is not a prefix. `PI-WS3-T1` closed a nearby case. This case stays.                                                                                                         | `packages/mcp/tools/handon/_verify-refs.js`                                 |
| F8  | Low      | 2 moderate advisories, both in dev-only packages (`c8`, `eslint`).                                                                                                                                                                                                                                          | `pnpm audit`                                                                |

These parts are solid. A reviewer does not need to re-open them:

- Commit hygiene: 1 odd subject in 1367.
- Exact dependency versions: 0 ranges.
- The `.npmrc` posture: `save-exact` and a 3-day registry delay.
- Retired skills: removed from disk.
- The closeout pipeline: 99 plan files became 9.
- The DCO, CodeQL, and SPDX reversals (ADR 173, 174, 176). Each has a written reason.

## 4 - Workstreams

### WS0 - Register this plan

- [x] **WS0-T1**: Add this plan to [plan-of-plans](plan-of-plans.md). Registered in the snapshot, level-0 graph, edge table, and WS-D on 2026-11-05.

### WS1 - Record the decisions as ADRs

Use `rule_tool_process_adr`. Do not hand-write the files.

- [ ] **WS1-T1**: Write one ADR that narrows ADR 169. Decision: the GitHub repo stays `pixu1980/rule-mcp`. The registry name in `server.json` becomes `io.github.pixu1980/rule-mcp` (D5). "RuleMCP" is a display name only. No file may name another repo URL as a current fact. Reason: `pixu1980/rule` returns 404, and the real remote is `git@github.com:pixu1980/rule-mcp.git`.
- [ ] **WS1-T2**: Write one ADR that replaces the default in ADR 131. The default update mode is notify. Automatic upgrade (checkout `main`, pull, reinstall, restart) is opt-in with `RULE_MCP_AUTO_UPDATE=upgrade`.
- [ ] **WS1-T3**: Write one ADR that turns off `unicorn/no-asterisk-prefix-in-documentation-comments`. Cite the measurement in [the reference plan](_plan-of-plans-reference.md): 2013 of 2297 lint problems at that time. The rule rejects the JSDoc style the whole repo uses.
- [ ] **WS1-T4**: Write one ADR that replaces the "no npm placeholder" part of ADR 084 (D9). The project publishes a placeholder package `rule-mcp` to reserve the npm name. The package does nothing. Keep the trademark posture of ADR 084 unchanged.

### WS2 - Fix the repo slug (F2, F5, D1, D5)

The real repo is `pixu1980/rule-mcp`. Find every wrong case with this command:

```
git grep -nE 'pixu1980/rule([^-A-Za-z0-9_]|$)'
```

A plain `\b` grep also matches `rule-mcp`. Do not use it. Do not edit `docs/adr/` or `docs/handoff/`. They record what was decided at the time.

Write the tests first. A test that enforces the wrong value must change before the files do.

- [ ] **WS2-T1**: Change these 4 tests to expect `pixu1980/rule-mcp`: `scripts/__tests__/docs/version-sync.test.mjs`, `scripts/__tests__/docs/security-policy.test.mjs`, `scripts/__tests__/docs/rename.test.mjs` (also `server.name` becomes `io.github.pixu1980/rule-mcp`), and `scripts/__tests__/docs/packaging-manifests.test.mjs`. Run them. They must fail.
- [ ] **WS2-T2**: Fix the manifests: `package.json`, `packages/mcp/package.json`, `server.json` (the URL fields and the `name`), `REUSE.toml`, `SECURITY-INSIGHTS.yml`, `.github/scoop/rule-mcp.json`, `.github/winget/pixu1980.rule-mcp.yaml`.
- [ ] **WS2-T3**: Fix the docs and code: `SECURITY.md` (the advisory link, line 83), `CONTRIBUTING.md`, `docs/01-getting-started.md`, `docs/04-operations.md`, `docs/07-quick-start.md`, `packages/mcp/cli/daemon/_systemd-unit.js`, `packages/mcp/cli/setup/_next-steps.js`, `.github/ISSUE_TEMPLATE/config.yml`.
- [ ] **WS2-T4**: Fix `scripts/install.sh`, `scripts/package.sh`, and `scripts/uninstall.sh`. Then run `pnpm checksums`. `scripts/SHA256SUMS` covers these files, and CI checks it.
- [ ] **WS2-T5**: Rewrite the false claims in `docs/migrations/rule-mcp-rename.md`. The repo did not move, and no redirect exists. The guide also says the npm package `rule-mcp` is "an unrelated third-party package". That is false today (npm returns 404). After D9 the package is the project's own placeholder. Say that. Keep the rest of the guide.
- [ ] **WS2-T6**: In `docs/04-operations.md`, list only the channels that exist today (the clone and the installer). Mark the rest `planned`. Do not tell users to run `pnpx rule-mcp`. The placeholder does nothing.
- [ ] **WS2-T7**: Check: the `git grep` above returns nothing outside `docs/adr/` and `docs/handoff/`. Run `pnpm test:all`.

### WS3 - Notify by default (F4, D4, D11)

Facts, all verified on 2026-11-05:

- `packages/mcp/core/self-update/_config.js` `updateMode()` returns `upgrade` unless `RULE_MCP_AUTO_UPDATE` is `notify`.
- Upgrade means checkout `main`, pull, and reinstall. For stdio installs the server then exits (`scheduleRestartIfNeeded` in `_schedule.js`).
- The notify mode already exists and works. The banner shows on the next tool result (`consumeUpdateBanner` in `_schedule.js`).
- `docs/05-env-variables.md` line 6 already says "default notify-only" and names a value `merge`. The code does not read `merge`. Docs and code disagree.

- [ ] **WS3-T1**: Write the test first. `updateMode()` returns `notify` when `RULE_MCP_AUTO_UPDATE` is unset. It returns `upgrade` only when the variable says `upgrade`.
- [ ] **WS3-T2**: Change the default in `_config.js`. Check every caller of `updateMode()`.
- [ ] **WS3-T3**: Change the banner in `_banner.js`. It now says "On main it applies itself". It must say: an update exists, run `/rule-update` in chat or `rule-mcp update` in a shell, and set `RULE_MCP_AUTO_UPDATE=upgrade` to apply updates automatically.
- [ ] **WS3-T4**: Align `docs/05-env-variables.md` (lines 6 and 156) with the code. The code reads `notify` and `upgrade`. The docs name `merge` and `auto`.
- [ ] **WS3-T5**: Add no new command name. `/rule-update` exists (D11). Check that the prompt `rule-update` in `packages/mcp/prompts/_task-prompts.js` applies the update, as its description says. Report if it does not.

Do not change `RULE_MCP_NO_AUTOUPDATE`, the behavior of `rule_tool_update`, or the restart logic.

### WS4 - Small cleanups

Make one commit for each task.

- [ ] **WS4-T1**: Settle the 8 duplicate ADR pairs in 001-020: 001/007, 002/013, 003/014, 004/008, 005/010, 006/016, 009/015, 011/017. Each pair is identical except the number in the heading. `settleDuplicateAdrs` in `packages/mcp/core/docs/adr-pending/_settle.js` catches only same-number collisions. Keep the older file. Move the newer to `_pending/` with a note, in the shape `_settle.js` produces.
- [ ] **WS4-T2**: Add `"unicorn/no-asterisk-prefix-in-documentation-comments": "off"` to the unicorn overrides in `eslint.config.mjs`, with a one-line reason. Run `pnpm lint`. Report the remaining count (about 280 are expected, from other rules). Do not fix other rules here. This task needs the ADR from WS1-T3.
- [ ] **WS4-T3**: Fix F7 in `resolveAdrFile` (`packages/mcp/tools/handon/_verify-refs.js`). A landed ADR cited by its old pending slug returns "not written". The fixture: `docs/adr/213-my-landed-slug.md` and id `my-landed-slug`. When the id is not a 3-digit number, also match a numbered file whose name, without `^\d+-` and `.md`, equals the id. Write the failing test first.
- [ ] **WS4-T4**: Bump `c8` and `eslint` to versions that clear the 2 moderate `pnpm audit` findings (`glob` and `minimatch`, dev-only). Run `pnpm audit` after.
- [ ] **WS4-T5**: Prepare the npm placeholder package (D9) in a folder outside this repo. Files: `package.json` (name `rule-mcp`, version `0.0.0`, license MIT, `repository` `github:pixu1980/rule-mcp`, no scripts, no dependencies, no `bin`, no `postinstall`) and a 3-line `README.md` that says the name is reserved and points to the repo. Use `pnpm`. Run `pnpm publish --dry-run` and show the file list. Do not publish. The owner publishes (A1).

## 5 - Notes for the talk repo

These are not tasks. The owner decides them.

- The talk repo scripts `format:prettier` and `format:biome` match every folder. They will reformat and lint the 386 app files. Add `case-studies/**` to the ignore lists of both tools if that is not wanted.
- The root `.gitignore` of the talk repo ignores only `/node_modules`. Each app has its own `.gitignore`, so nested `node_modules` stay ignored.
- Run the apps with `node case-studies/runner/index.mjs`. The runner installs missing dependencies and starts six apps. The talk `package.json` has no script for it.
- The audit did not run the apps. It checked syntax and that the six app directories resolve.

## 6 - What this plan does not decide

D2 stays with the owner. This plan does not reopen the license, the governance model, or the release target.
