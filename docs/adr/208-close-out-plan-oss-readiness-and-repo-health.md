# 208: Close out plan _oss-readiness-and-repo-health

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/_oss-readiness-and-repo-health.md, "Plan: OSS readiness and repo health", finished with 22 closed items.

## Outcome

- WS0-T1: Add this plan to [plan-of-plans](plan-of-plans.md). Registered in snapshot, level-0 graph, edge table, and WS-D on 2026-11-05.
- WS1-T1: Write one ADR that narrows ADR 160. Decision: GitHub repo stays pixu1980/rule-mcp. registry name in server.json becomes io.github.pixu1980/rule-mcp (D5). "RuleMCP" is display name only. No file may name another repo URL as current fact. Reason: pixu1980/rule returns 404, and real remote is rule-mcp repository. Written 2026-11-06 as docs/adr/240-the-repository-stays-pixu1980-rule-mcp-and-the-registry-name-is-io-github-pixu19.md.
- WS1-T2: Write one ADR that replaces default in ADR 123. default update mode is notify. Automatic upgrade (checkout main, pull, reinstall, restart) is opt-in with RULE_MCP_AUTO_UPDATE=upgrade. Written 2026-11-06 as docs/adr/238-an-update-notifies-by-default-and-upgrades-only-when-asked.md.
- WS1-T3: Write one ADR that turns off unicorn/no-asterisk-prefix-in-documentation-comments. Cite measurement in [reference plan](_plan-of-plans-reference.md): 2013 of 2297 lint problems at that time. Written 2026-11-06 as docs/adr/241-turn-off-the-asterisk-prefix-documentation-rule.md, on fresh measurement of 2015 of 2297. rule rejects JSDoc style whole repo uses.
- WS1-T4: Write one ADR that replaces the "no npm placeholder" part of ADR 076 (D9). project publishes placeholder package rule-mcp to reserve npm name. package does nothing. Keep trademark posture of ADR 076 unchanged. Written 2026-11-06 as docs/adr/239-publish-an-npm-placeholder-to-reserve-the-rule-mcp-name.md.
- WS2-T1: Change these 4 tests to expect pixu1980/rule-mcp: scripts/**tests**/docs/version-sync.test.mjs, scripts/**tests**/docs/security-policy.test.mjs, scripts/**tests**/docs/rename.test.mjs (also server.name becomes io.github.pixu1980/rule-mcp), and scripts/**tests**/docs/packaging-manifests.test.mjs. Run them. They must fail. Done 2026-11-06: all four failed on old slug before manifests changed.
- WS2-T2: Fix manifests: package.json, packages/mcp/package.json, server.json (URL fields and name), REUSE.toml, SECURITY-INSIGHTS.yml, .github/scoop/rule-mcp.json, .github/winget/pixu1980.rule-mcp.yaml.
- WS2-T3: Fix docs and code: SECURITY.md (advisory link, line 83), CONTRIBUTING.md, docs/01-getting-started.md, docs/04-operations.md, docs/07-quick-start.md, packages/mcp/cli/daemon/_systemd-unit.js, packages/mcp/cli/setup/_next-steps.js, .github/ISSUE_TEMPLATE/config.yml.
- WS2-T4: Fix scripts/install.sh, scripts/package.sh, and scripts/uninstall.sh. Then run pnpm checksums. scripts/SHA256SUMS covers these files, and CI checks it. Regenerated 2026-11-06.
- WS2-T5: Rewrite false claims in docs/migrations/rule-mcp-rename.md. repo did not move, and no redirect exists. guide also says npm package rule-mcp is "unrelated third-party package". That is false today (npm returns 404). After D9 package is project's own placeholder. Say that. Keep rest of guide.
- WS2-T6: In docs/04-operations.md, list only channels that exist today (clone and installer). Mark rest planned. Do not tell users to run pnpx rule-mcp. placeholder does nothing.
- WS2-T7: Check: git grep above returns nothing outside docs/adr/ and docs/handoff/. Run pnpm test:all. Verified 2026-11-06: no match outside ADR and handoff record, and fresh clone reports 3105 tests with 0 failures.
- WS3-T1: Write test first. updateMode() returns notify when RULE_MCP_AUTO_UPDATE is unset. It returns upgrade only when variable says upgrade. Done 2026-11-06 in packages/mcp/core/self-update/**tests**/_update-mode.test.mjs, seen red first.
- WS3-T2: Change default in _config.js. Check every caller of updateMode(). Done 2026-11-06: two callers in _run.js read default, so automatic path now announces. explicit tool and CLI pass explicitMode(), because asking for update is opt-in.
- WS3-T3: Change banner in _banner.js. It now says "On main it applies itself". It must say: update exists, run /rule-update in chat or rule-mcp update in shell, and set RULE_MCP_AUTO_UPDATE=upgrade to apply updates automatically. Done 2026-11-06, with test that reads banner.
- WS3-T4: Align docs/05-env-variables.md (lines 6 and 156) with code. code reads notify and upgrade. docs name merge and auto. Aligned 2026-11-06 in variable table, in feature catalog and in its reader.
- WS3-T5: Add no new command name. /rule-update exists (D11). Check that prompt rule-update in packages/mcp/prompts/_task-prompts.js applies update, as its description says. Report if it does not. Checked 2026-11-06: it did not, because tool and CLI both took ambient default and would only announce. Both now pass explicit upgrade mode.
- WS4-T1: Settle 8 duplicate ADR pairs in 001-020: 001/007, 002/013, 003/014, 004/008, 005/010, 006/016, 009/015, 011/017. Each pair is identical except number in heading. settleDuplicateAdrs in packages/mcp/core/docs/adr-pending/_settle.js catches only same-number collisions. Keep older file. Move newer to _pending/ with note, in shape _settle.js produces. Done 2026-11-06: newer file of each pair moved to _pending/, headings became # Pending, and numbered count fell from 213 to 204.
- WS4-T2: Add "unicorn/no-asterisk-prefix-in-documentation-comments": "off" to unicorn overrides in eslint.config.mjs, with one-line reason. Run pnpm lint. Report remaining count (about 280 are expected, from other rules). Do not fix other rules here. This task needs ADR from WS1-T3. Done 2026-11-06: rule is off in eslint.config.mjs, and run reports 282 problems (192 errors, 90 warnings) from other rules.
- WS4-T3: Fix F7 in resolveAdrFile (packages/mcp/tools/handon/_verify-refs.js). landed ADR cited by its old pending slug returns "not written". fixture: docs/adr/213-my-landed-slug.md and id my-landed-slug. When id is not 3-digit number, also match numbered file whose name, without ^\d+- and.md, equals id. Write failing test first. Done 2026-11-06 with fixture plan names.
  -...and 2 more step(s) in closed record.

### Plan prose

Notes: subordinate plan; coordinated by [plan-of-plans](plan-of-plans.md).

Source: a read-only audit of the repository on 2026-11-05.

owner made every decision in section 1. No choice stays open.

This plan holds full instructions. session does not need separate prompt.

Depends on: none.

Feeds: `_publication-cutover.md` (it waits for this plan to close).

Shared files: `package.json`, `packages/mcp/package.json`, `server.json`, `scripts/SHA256SUMS`, `docs/adr/ADR.md`, `docs/adr/_pending/`, `eslint.config.mjs`, `docs/05-env-variables.md`, `docs/plans/plan-of-plans.md`.

WS0 registers this plan.

WS1 writes ADRs and changes no code.

WS2, WS3, and WS4 touch different files and can run in any order after WS1.

plan [tool and skill surface audit](209-close-out-plan-tool-and-skill-surface-audit.md) shared `docs/adr/ADR.md` and `CLAUDE.md` with this plan.

Run only one of two plans at time. This plan never edits `CLAUDE.md` counts. other plan owns them.

This plan settles 8 duplicate ADR pairs in 001-020 (WS4-T1). other plan settles ninth pair (136 and 155). Run WS4-T1 first.

history rewrite and case-study deletion are not here. They are WS5 of [publication cutover](_publication-cutover.md).

No session does these. They are not checkbox tasks.

| # | When | Action | | --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | | A1 | After WS4-T5 | Publish the placeholder package: `pnpm publish --access public` in the prepared folder. This needs the owner's npm login and 2FA. Do it when the repo goes public. The package README links to the repo, and a private repo gives a 404. | | A2 | See the cutover plan | Make the GitHub repo public (decision D2). | | A3 | After the push in the cutover plan | If another clone of this repo exists on a second machine, delete it and clone again. Its hashes no longer match. |

All eleven decisions are made.

| # | Question | Decision | Consequence | | --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | | D1 | The repo is `pixu1980/rule-mcp`. ADR 160 and 23 tracked files name `pixu1980/rule`, which returns HTTP 404. | Decouple. The repo stays `rule-mcp`. "RuleMCP" is a display name only. | WS2 fixes the files and 4 tests. WS1-T1 writes one ADR that narrows ADR 160. | | D2 | The repo is private. When does it go public? | The owner, by hand, at talk time. | No step in this plan changes visibility. | | D3 | What happens to the history of `docs/case-studies`? | Rewrite history to remove the path. The owner chose this after seeing the numbers: the gain is small (about 1.2 MB). | Cutover plan, WS5. Every commit hash changes. ADRs and handoffs keep their old hashes as history. | | D4 | The tool applies updates by itself. What is the new default? | Notify only. The tool tells the user in the agent's chat that an update exists and names the command to run by hand. | WS3. The notify mode already exists. WS3 makes it the default. | | D5 | What is the registry name in `server.json`? | `io.github.pixu1980/rule-mcp`. | WS2. `rename.test.mjs` changes with it. The name was never published. | | D6 | The lint rule `unicorn/no-asterisk-prefix-in-documentation-comments` rejects the JSDoc style of the whole repo. What now? | Turn the rule off. Record the decision in an ADR. | WS1-T3 and WS4-T2. No rewrite of about 2,000 comments. | | D7 | Where does case-study code live? | In the talk repo only. Delete it from this repo, including the runner. | The copy is done (see section 2). The cutover plan deletes the originals. | | D8 | Six `feat/*` branches showed in the local branch list. What now? | Nothing to delete. `git ls-remote --heads origin` lists only `main` and `rel/v0.1.0`. The local remote-tracking refs were stale. The audit pruned them. | No task. | | D9 | Nobody owns the npm name `rule-mcp`. `npm view` returns 404. | Publish a placeholder package to reserve the name. | WS1-T4 writes an ADR that replaces the "no placeholder yet" part of ADR 076. WS4-T5 prepares the package. The owner publishes it (A1). The package does nothing. | | D10 | The largest blobs in history are `coverage/tmp/*.json` files (about 3.9 MB each). Git does not track `coverage/` at HEAD. | Remove `coverage/tmp` in the same rewrite as `docs/case-studies`. | Cutover plan, WS5. | | D11 | The owner wrote `/root-update` as the manual update command. | The command is `/rule-update`. It already exists (`docs/11-prompts.md`: "Apply an available server update explicitly"). The words `/root-update` were a typo. | WS3 adds no new command. The banner names `/rule-update` in chat, and `rule-mcp update` in a shell. |

audit ran these commands read-only from repo root on `rel/v0.1.0`.

On 2026-11-05 audit copied all tracked case-study code from commit `92ed881c1` to talk repo `~/Projects/talks/talk-deterministic-mcp`.

| From (this repo) | To (talk repo) | Files | | ---------------------------- | ---------------------- | ----- | | `docs/case-studies/**` | `case-studies/apps/**` | 386 | | `scripts/case-studies/*.mjs` | `case-studies/runner/` | 4 |

386 app files are byte-identical to blobs at that commit. runner changed in two places: `CASES` path and two `@see` comments. audit also fixed bug from original: text `/*/` inside JSDoc comment of `index.mjs` closed comment early.

| # | Severity | Finding | Where | | --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | | F1 | Medium | `docs/case-studies` is 2.2 GB on disk, but git tracks only 1.2 MB there. `.git` is 65 MB. A clone is small. The weight is untracked `node_modules`. The tracked code is demo apps, not product. | `docs/case-studies/**` | | F2 | High | 23 tracked files name `github.com/pixu1980/rule`, a repo that does not exist. Examples: the advisory link in `SECURITY.md:83`, the install URL in `packages/mcp/cli/setup/_next-steps.js`, the clone commands in 4 docs, and 4 tests that enforce the wrong value. | list in WS2 | | F3 | High | `pnpm lint` fails with 2294 problems. About 2,000 come from one rule that rejects the repo's own JSDoc style. `_pi-integration-and-debt.md` WS3-T5 measured it and left the decision open. | `eslint.config.mjs` | | F4 | High | The tool applies a new release by itself: checkout `main`, pull, reinstall. Then, for stdio installs, it exits the process. `docs/05-env-variables.md` says the default is notify-only. The code default is `upgrade`. Docs and code disagree. | `packages/mcp/core/self-update/_config.js:20`, `docs/05-env-variables.md:6` | | F5 | Medium | `docs/04-operations.md` (lines 370-376) lists 5 install channels. None exists today: npm returns 404, the Homebrew tap repo is missing, no workflow publishes a Docker image, and Winget and Scoop pin a `v0.1.0` tag that does not exist. `pnpx rule-mcp serve` would run whoever registers that npm name. | `docs/04-operations.md` | | F6 | Medium | 8 ADR pairs in 001-020 are identical except the number in the heading. `settleDuplicateAdrs` catches only collisions on the same number. These pairs have different numbers. | `docs/adr/001,007 ... 011,017` | | F7 | Low | A landed ADR cited by its old pending slug reports "not written". The numbered lookup matches `<id>-` as a prefix, and the slug is not a prefix. `PI-WS3-T1` closed a nearby case. This case stays. | `packages/mcp/tools/handon/_verify-refs.js` | | F8 | Low | 2 moderate advisories, both in dev-only packages (`c8`, `eslint`). | `pnpm audit` |

These parts are solid. reviewer does not need to re-open them:

- Commit hygiene: 1 odd subject in 1367. - Exact dependency versions: 0 ranges. - `.npmrc` posture: `save-exact` and 3-day registry delay. - Retired skills: removed from disk. - closeout pipeline: 99 plan files became 9. - DCO, CodeQL, and SPDX reversals (ADR 164, 174, 176). Each has written reason.

Use `rule_tool_process_adr`. Do not hand-write files.

real repo is `pixu1980/rule-mcp`. Find every wrong case with this command:

plain `\b` grep also matches `rule-mcp`. Do not use it. Do not edit `docs/adr/` or `docs/handoff/`. They record what was decided at time.

Write tests first. test that enforces wrong value must change before files do.

Facts, all verified on 2026-11-05:

- `packages/mcp/core/self-update/_config.js` `updateMode()` returns `upgrade` unless `RULE_MCP_AUTO_UPDATE` is `notify`. - Upgrade means checkout `main`, pull, and reinstall. For stdio installs server then exits (`scheduleRestartIfNeeded` in `_schedule.js`). - notify mode already exists and works. banner shows on next tool result (`consumeUpdateBanner` in `_schedule.js`). - `docs/05-env-variables.md` line 6 already says "default notify-only" and names value `merge`. code does not read `merge`. Docs and code disagree.

Do not change `RULE_MCP_NO_AUTOUPDATE`, behavior of `rule_tool_update`, or restart logic.

Make one commit for each task.

These are not tasks. owner decides them.

- talk repo scripts `format:prettier` and `format:biome` match every folder. They will reformat and lint 386 app files. Add `case-studies/**` to ignore lists of both tools if that is not wanted. - root `.gitignore` of talk repo ignores only `/node_modules`. Each app has its own `.gitignore`, so nested `node_modules` stay ignored. - Run apps with `node case-studies/runner/index.mjs`. runner installs missing dependencies and starts six apps. talk `package.json` has no script for it. - audit did not run apps. It checked syntax and that six app directories resolve.

D2 stays with owner. This plan does not reopen license, governance model, or release target.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/_oss-readiness-and-repo-health.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
