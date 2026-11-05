# Prompts for the Deepseek session - all audit work, one file

This file merges the prompts of two plans. Copy one block at a time. Each
block is self-contained. The audit session only reads this repo, so none of
these ran here.

## ID map

The two plans both use `WS1`, `WS2`, and so on. Deepseek also has its own
`WS3` in `_pi-integration-and-debt.md`. To avoid a mix-up, every block here
has a prefix.

| Prefix  | Plan file                                           | Plan IDs inside it                       |
| ------- | --------------------------------------------------- | ---------------------------------------- |
| `OSS-`  | `_oss-readiness-and-repo-health.md`                 | `WS1`-`WS5`, `D1`-`D11` (no open choice) |
| `SURF-` | `_tool-and-skill-surface-audit.md`                  | `WS1`-`WS7`, `D1`-`D2`, `O1`-`O3`        |
| `PI-`   | `_pi-integration-and-debt.md` (Deepseek's own plan) | not in this file                         |

Example: `OSS-WS3` is workstream `WS3` of the OSS plan. `SURF-O1` is open
decision `O1` of the surface plan.

## Run order

| Step | Run                                                              | Wait for                                                   | Ask the owner                                    |
| ---- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| 0    | Register both plans with `rule_tool_write_plan`                  | nothing                                                    | nothing                                          |
| 1    | `OSS-WS1`                                                        | step 0                                                     | nothing                                          |
| 2    | `OSS-WS2`, `OSS-WS4`, `OSS-WS5` (inside `OSS-WS5`, run T1 first) | step 1                                                     | only if `feat/nyx` shows content in `OSS-WS5` T5 |
| 3    | `SURF-WS1` and `SURF-WS2`, then `SURF-WS3`                       | step 0                                                     | nothing                                          |
| 4    | `SURF-WS4`, then `SURF-WS5`, then `SURF-WS6`                     | step 0, and `PI-WS2` closed                                | `SURF-O2` and `SURF-O3` before `SURF-WS6` step 6 |
| 5    | `SURF-WS7`                                                       | `OSS-WS5` T1 done                                          | `SURF-O1` before anything                        |
| 6    | `OSS-WS3` (destructive)                                          | every step above landed, and the `feat/*` branches deleted | the talk-repo copy check, and the owner watching |

The owner then does four manual actions: remove the local `docs/case-studies`,
publish the npm placeholder, make the repo public, and re-clone any second
copy. The OSS plan lists them in section 6.

Rules that decide this order:

- One session at a time writes ADRs. These blocks regenerate
  `docs/adr/ADR.md`: `OSS-WS1`, `OSS-WS5` T1, `OSS-WS3` step 6, `SURF-WS5`
  step 5, and `SURF-WS7`.
- Registering a plan edits `docs/plans/plan-of-plans.md`. `SURF-WS5` edits the
  same file. Register first (step 0).
- `SURF-WS4` and `SURF-WS5` edit `docs/plans/skills/_skills-plan.md`. `PI-WS2`
  changes the bundler-family rows in the same file.
- `SURF-WS1` to `SURF-WS3` own the `CLAUDE.md` counts. No `OSS-` block
  touches them.
- `OSS-WS3` rewrites history and changes every commit hash. It runs last.

## Already done (do not repeat)

| Item                                                                            | Who           | Evidence                                                                                                             |
| ------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Pending ADR path check (`PI-WS3-T1`)                                            | Deepseek      | commit `e6a666062`                                                                                                   |
| Closeout keeps whole steps and plan prose (`PI-WS3-T2`, `PI-WS3-T3`)            | Deepseek      | commit `886a4b184`                                                                                                   |
| Reference-plan checkboxes (`PI-WS3-T4`) and lint finding recorded (`PI-WS3-T5`) | Deepseek      | commit `92ed881c1`                                                                                                   |
| Case-study code copied to the talk repo                                         | Audit session | 386 app files and 4 runner files in `~/Projects/talks/talk-deterministic-mcp/case-studies/`, from commit `92ed881c1` |

---

# Part 1 - OSS readiness and repo health

### OSS-WS1 - record four decisions as ADRs

```
OSS-WS1 - write four ADRs with rule_tool_process_adr. No code change.
A) Narrow ADR 169 (rename the server to RuleMCP). Decision: the GitHub repo
   stays pixu1980/rule-mcp. The registry name in server.json becomes
   io.github.pixu1980/rule-mcp. "RuleMCP" is a display name only. No file may
   name another repo URL as a current fact. Reason: pixu1980/rule returns 404
   (curl -I), the real remote is git@github.com:pixu1980/rule-mcp.git.
B) Replace the default of ADR 131. The default update mode becomes notify.
   Automatic upgrade (checkout main, pull, reinstall, restart) is opt-in with
   RULE_MCP_AUTO_UPDATE=upgrade.
C) Turn off unicorn/no-asterisk-prefix-in-documentation-comments. Cite the
   measurement recorded in docs/plans/_plan-of-plans-reference.md (2013 of
   2297 lint problems at that time). The rule rejects the JSDoc style the
   whole repo uses.
D) Replace the "no npm placeholder" part of ADR 084. The project publishes a
   placeholder package `rule-mcp` to reserve the npm name (npm view returns
   404 today; nobody owns it). The package does nothing. Keep the trademark
   posture of ADR 084 unchanged.
files_to_change: new ADR files only (four of them).
out_of_scope: any code. OSS-WS2, OSS-WS4, OSS-WS5 do the code.
```

### OSS-WS2 - fix the repo slug in 23 files, tests first

```
OSS-WS2 - fix the dead repo slug. Real repo: pixu1980/rule-mcp (private).
pixu1980/rule returns 404. Find every case with:
  git grep -nE 'pixu1980/rule([^-A-Za-z0-9_]|$)'
(A plain \b grep also matches rule-mcp. Do not use it.) 23 tracked files match
outside docs/adr and docs/handoff.
Step 1, tests first. Change these 4 tests to expect pixu1980/rule-mcp, run
them, watch them fail:
  scripts/__tests__/docs/version-sync.test.mjs
  scripts/__tests__/docs/security-policy.test.mjs
  scripts/__tests__/docs/rename.test.mjs  (also server.name -> io.github.pixu1980/rule-mcp)
  scripts/__tests__/docs/packaging-manifests.test.mjs
Step 2, manifests: package.json, packages/mcp/package.json, server.json (URL
fields AND the name), REUSE.toml, SECURITY-INSIGHTS.yml,
.github/scoop/rule-mcp.json, .github/winget/pixu1980.rule-mcp.yaml.
Step 3, docs and code: SECURITY.md (advisory link, line 83), CONTRIBUTING.md,
docs/01-getting-started.md, docs/04-operations.md, docs/07-quick-start.md,
packages/mcp/cli/daemon/_systemd-unit.js, packages/mcp/cli/setup/_next-steps.js,
.github/ISSUE_TEMPLATE/config.yml.
Step 4, scripts: scripts/install.sh, scripts/package.sh, scripts/uninstall.sh.
Then run `pnpm checksums`. scripts/SHA256SUMS covers these files and CI
checks it.
Step 5: docs/migrations/rule-mcp-rename.md says the repo moved and GitHub
keeps a redirect. Both are false. It also calls the npm package `rule-mcp`
"an unrelated third-party package". That is false today (npm 404); after the
placeholder (OSS-WS5 T6) it is the project's own reserved name. Rewrite those
claims. Keep the rest.
Step 6: docs/04-operations.md lines ~370-376 list 5 install channels that do
not exist (npm returns 404, no homebrew-tap repo, no workflow builds a Docker
image, Winget and Scoop pin a v0.1.0 tag that does not exist). List only the
clone plus installer. Mark the others "planned". Do not tell users to run
`pnpx rule-mcp`: the npm package will be a placeholder that does nothing.
Step 7, verify: the git grep above returns nothing outside docs/adr and
docs/handoff. Run `pnpm test:all`.
Do NOT edit docs/adr or docs/handoff text. It records what was decided then.
files_to_change: the files listed above and the 4 tests.
out_of_scope: ADR/handoff history, any version bump.
```

### OSS-WS3 - delete the case-study code and rewrite history (destructive, run last)

```
OSS-WS3 - DESTRUCTIVE. Run last. Do not run unattended. The owner decided:
case-study code lives only in the talk repo; delete it here; rewrite history
to drop docs/case-studies. Note the real numbers: .git is 65 MB, tracked
case-studies weigh 1.2 MB. The 2.2 GB on disk is untracked node_modules.
The history gain is small. The owner chose it anyway.
Already done: all tracked case-study code was copied from commit 92ed881c1
to ~/Projects/talks/talk-deterministic-mcp/case-studies/
  apps/   <- docs/case-studies/**       (386 files, byte-identical)
  runner/ <- scripts/case-studies/*.mjs (4 files; paths adapted)
Preconditions: every other block in this file has landed; no other session
writes to this repo; the six feat/* branches are already deleted (OSS-WS5
T5).
Steps, in order. Stop and report if one fails:
1. Verify the copy still matches (from the repo root; prints nothing if ok):
   git ls-files docs/case-studies | while read f; do
     [ "$(git rev-parse HEAD:$f)" = "$(git hash-object \
       ~/Projects/talks/talk-deterministic-mcp/case-studies/apps/${f#docs/case-studies/})" ] \
       || echo DIFF $f; done
   If docs/case-studies changed after 92ed881c1, copy again first.
2. One normal commit that deletes: `git rm -r docs/case-studies scripts/case-studies`
   and the "case-studies" script in package.json (line 19). Edit, do not
   delete: docs/plans/skills/ui/_rule-mcp-ui-design-system.md (remove the link
   into docs/case-studies); remove "case-studies" from the skip lists in
   scripts/__tests__/docs/docs-scan.mjs and
   scripts/__tests__/docs/link-integrity.test.mjs. Leave ADR 123 and
   handoff 22 as history. monorepo-layout.test.mjs needs no change. Run
   `pnpm test:all`.
3. git tag backup/pre-case-studies-removal (same pattern as backup/pre-spdx-removal).
4. git filter-repo --path docs/case-studies --path coverage/tmp --invert-paths
   (coverage/ is untracked at HEAD, but 4 commits in history touched
   coverage/tmp; its JSON blobs are the largest in history, 3.9 MB each).
   filter-repo drops the origin remote. Add it back.
5. Force-push every rewritten branch and tag. Do NOT push backup/* refs.
   The repo is private with one remote, so this is the lowest-risk moment.
6. Write one ADR (rule_tool_process_adr): case-study apps and runner live in
   the talk repo (supersedes ADR 123); hashes cited in ADRs and handoffs
   before this step no longer resolve; that is accepted.
7. Tell the owner to run `rm -rf docs/case-studies` by hand (untracked
   node_modules, dist, and a .env in bookmarks-manager-sonnet5/backend;
   look at that .env first).
files_to_change: as listed. Ask before step 4 and before step 5.
out_of_scope: the talk repo. Do not touch it.
```

### OSS-WS4 - notify by default

```
OSS-WS4 - make notify the default update mode. Facts, all verified:
- packages/mcp/core/self-update/_config.js updateMode() returns "upgrade"
  unless RULE_MCP_AUTO_UPDATE === "notify". Upgrade = checkout main, pull,
  reinstall; then for stdio installs the server exits (deferred
  process.exit(0) in _schedule.js scheduleRestartIfNeeded).
- notify mode already exists and works. The banner is shown on the next tool
  result (consumeUpdateBanner in _schedule.js).
- docs/05-env-variables.md line 6 already says "default notify-only", and
  names a value `merge`. The code does not read `merge`. Docs and code
  disagree.
Change:
1. Test first: updateMode() returns "notify" when the variable is unset;
   "upgrade" only when RULE_MCP_AUTO_UPDATE=upgrade.
2. Flip the default in _config.js. Check every caller of updateMode().
3. _banner.js: the available-update text says "On main it applies itself".
   Replace it: an update exists; run `/rule-update` in chat or
   `rule-mcp update` in a shell; set RULE_MCP_AUTO_UPDATE=upgrade to apply
   updates automatically.
4. Align docs/05-env-variables.md (lines 6 and 156) with what the code reads
   (`notify`, `upgrade`).
Add NO new command name. The owner's `/root-update` was a typo for
`/rule-update`, which already exists (docs/11-prompts.md line 40: "Apply an
available server update explicitly"; prompt `rule-update` in
packages/mcp/prompts/_task-prompts.js). Check that the prompt really applies
the update, as its description says. Report if it does not.
files_to_change: _config.js, _banner.js, their tests, docs/05-env-variables.md.
out_of_scope: RULE_MCP_NO_AUTOUPDATE, rule_tool_update behavior, restart logic.
```

### OSS-WS5 - small cleanups (one commit each, T6 has no commit)

```
OSS-WS5 - small cleanups, one commit each (T6 makes no commit).
T1 Settle 8 duplicate ADR pairs in 001-020: 001/007, 002/013, 003/014,
   004/008, 005/010, 006/016, 009/015, 011/017 (identical except the H1
   number). settleDuplicateAdrs
   (packages/mcp/core/docs/adr-pending/_settle.js) only catches same-number
   collisions. Keep the older file; move the newer to _pending/ with a note,
   the same shape _settle.js produces. Run before SURF-WS7 (it settles ADR
   136/155 and also regenerates ADR.md).
T2 eslint.config.mjs: add "unicorn/no-asterisk-prefix-in-documentation-comments":
   "off" next to the other unicorn overrides, with a one-line reason. Run
   `pnpm lint` and report the remaining count (about 280 expected, other
   rules). Do not fix other rules here. Needs the OSS-WS1 ADR C first.
T3 packages/mcp/tools/handon/_verify-refs.js resolveAdrFile(): a landed ADR
   cited by its old pending slug returns "not written" (verified with a
   fixture: docs/adr/213-my-landed-slug.md, id "my-landed-slug"). The numbered
   lookup uses name.startsWith(`${id}-`). When id is not a 3-digit number,
   also match a numbered file whose name, minus /^\d+-/ and .md, equals id.
   Test first.
T4 Bump c8 and eslint to versions that clear the 2 moderate pnpm audit
   findings (glob, minimatch; dev-only). Run `pnpm audit` after.
T5 Delete the six remote feat/* branches (decision-models, export,
   guardrails, guardrails-aligned, guardrails-evolution, nyx). The owner
   decided. Ancestry checks fail because history was rewritten, so check the
   tree: `git diff --stat rel/v0.1.0 origin/feat/<name>`. ADR 181 says these
   refs carry no content the tree lacks. Delete a branch only if the diff
   shows nothing missing. If feat/nyx shows content (nyx is a sibling
   project), stop and ask the owner. Do it before OSS-WS3.
T6 Prepare the npm placeholder package (the owner decided). Make it in a
   folder OUTSIDE this repo. Files: package.json (name "rule-mcp", version
   "0.0.0", license MIT, repository "github:pixu1980/rule-mcp", no scripts, no
   dependencies, no bin, no postinstall) and a 3-line README.md that says the
   name is reserved and points to the repo. Use pnpm, not npm. Run
   `pnpm publish --dry-run` and show the file list. DO NOT publish. The owner
   publishes by hand (npm login and 2FA), at the same time the repo goes
   public, because the README links to the repo.
out_of_scope: the CLAUDE.md counts (SURF-WS1..3), the reference-plan
checkboxes (done).
```

---

# Part 2 - Tool and skill surface audit

### SURF-WS1 - fix the stale counts in CLAUDE.md

```
SURF-WS1 - fix: CLAUDE.md (repo root), "Repository state" section.
It says "107 tools / 186 resources / 37 prompts / 89 skills". Runtime-verified
numbers today: 106 tools / 174 resources / 41 prompts / 83 skills (83 is the
"rule-"-prefixed catalog; skills/ has 84 entries because of the root skill
`rule`).
Source of truth: node --import ./scripts/alias-hook.mjs --test
scripts/__tests__/docs/docs-accuracy.test.mjs. It passes and prints the real
counts on its last line. Re-run it first, then copy what it prints.
files_to_change: CLAUDE.md (the counts only).
out_of_scope: the "212 checks" figure (SURF-WS2), README.md (already correct).
```

### SURF-WS2 - confirm what "212 checks" counts

```
SURF-WS2 - verify before fixing: CLAUDE.md says "212 checks". A static count
finds 120 guardrail files (find skills -path "*/guardrails/_*.js" -not -path
"*__tests__*" | wc -l) in 22 of 84 skills. "Checks" may count something else.
Get the real number from the project's runtime (rule_tool_stats, or the call
docs-accuracy.test.mjs would use). Do not use grep. Fix the CLAUDE.md line to
the confirmed number AND name the unit (files or assertions). If 212 was
right for some unit, only add the unit.
files_to_change: CLAUDE.md (one line).
out_of_scope: adding or removing any guardrail.
```

### SURF-WS3 - extend the guard to CLAUDE.md

```
SURF-WS3 - scripts/__tests__/docs/docs-accuracy.test.mjs asserts README.md
against the runtime counts. CLAUDE.md states the same numbers and nothing
checks it. Add assertions for CLAUDE.md using the `actual` values the test
already computes. Write the failing assertion first (run it before
SURF-WS1/SURF-WS2 land, or against a wrong number). Then confirm it passes
after.
files_to_change: scripts/__tests__/docs/docs-accuracy.test.mjs.
out_of_scope: any other document that mentions counts.
```

### SURF-WS4 - remove the duplicate text in the orchestrator plan

```
SURF-WS4 - docs/plans/skills/_skills-plan.md is 864 lines. Sections "6 - The
cross-cutting commits" through "13 - Open notes and risks", and "Model
assignment", appear twice (lines 276-565 and 567-864). The two copies differ.
The two "Model assignment" tables are not the same. The progress table is in
both copies.
Start only after PI-WS2 (_pi-integration-and-debt.md) is closed (same file
rows).
1. Run node --import ./scripts/alias-hook.mjs --test
   scripts/__tests__/plans/skills-plan.test.mjs and keep the result.
2. Diff the two copies. Keep the one the test and `git log -p` show as
   current. Keep the newer "Model assignment" table. Remove the other copy.
   If the copies disagree on a fact, report it. Do not pick silently.
3. Run the test again. It must pass. The file should end near 575 lines.
files_to_change: docs/plans/skills/_skills-plan.md.
out_of_scope: stages, edges, progress-table values, skill plans.
```

### SURF-WS5 - retire the six superseded area guardrail plans

```
SURF-WS5 - decision made by the owner: delete the six superseded area plans.
Files: docs/plans/_ai-guardrails.md, _backend-guardrails.md, _data-guardrails.md,
_devops-guardrails.md, _frontend-guardrails.md, _meta-guardrails.md. Each says
"Status: superseded by docs/plans/skills/_skills-plan.md (ADR 153)". The plans
in docs/plans/skills win. Everything they plan stays planned. Do SURF-WS4
first, so only one copy of the orchestrator exists.
1. Confirm no test names these files (the audit found none). Run
   skills-plan.test.mjs and development-shape.test.mjs and keep the result.
2. Delete the six files.
3. In docs/plans/skills/_skills-plan.md, turn the "nine area plans are not
   nodes" table into one short paragraph. Cite ADR 153. Still name which
   plans took each area: ai -> rule-ai-agent-architecture; backend -> the 8
   backend leaves; data -> rule-data and the 8 data leaves; devops -> 4
   leaves; frontend -> 7 leaves; meta -> 4 leaves. Do not drop the mapping.
4. In docs/plans/plan-of-plans.md remove the snapshot row "area guardrails ...
   six files, superseded". In docs/plans/skills/DEPENDENCIES.md remove the
   `*-guardrails` bullet under "What is not a dependency".
5. Record the retirement in one ADR (rule_tool_process_adr). Do not paste the
   old plans into it. Git history keeps them.
6. Run both tests again. They must pass.
files_to_change: the 6 plan files (delete), _skills-plan.md, plan-of-plans.md,
DEPENDENCIES.md, one new ADR.
out_of_scope: any skill plan, any guardrail, ADR 136-141 and 155 (SURF-WS7).
```

### SURF-WS6 - refresh the catalog docs

```
SURF-WS6 - docs/plans/skills/README.md is stale. It says "Total: 81 skills"
and lists rule-process-cargo-release (88) and rule-process-uv-release (89) as
"planned skills that do not exist yet". Both exist in skills/ today.
1. Set the catalog total to what exists today (83 catalog skills; skills/ has
   84 entries because of the root skill `rule`).
2. List as "planned, not yet built" only the three still hypothetical:
   rule-platform-mobile (85), rule-toolchain-electron (86),
   rule-toolchain-tauri (87). Their plan files exist
   (docs/plans/skills/platform/_rule-mcp-platform-mobile.md and the two under
   toolchain/).
3. Add one column to the table: guardrails = has | planned | none.
   has = skills/<s>/guardrails/ exists (22 skills today).
   planned = no directory, but the skill plan has a step that creates
   skills/<s>/guardrails/ (37 today).
   none = neither (24 today). The root skill `rule` has no plan and stays
   outside the table.
4. Add one sentence: "none" means prose-only unless a plan adds a guardrail
   step. Do NOT add a guardrail step to any plan. The owner decided: planned
   stays planned; nothing new is imposed.
5. Add one sentence: the progress table in _skills-plan.md is the live
   status; the `Status:` line inside a skill plan is the status at
   registration (the table marks many rows in-progress while the file says
   planned).
6. SURF-O2 and SURF-O3 (delete or fix DEPENDENCIES.md; keep or rename the
   `_rule-mcp-*` plan file prefix) wait for the owner. Ask. Do not decide.
files_to_change: docs/plans/skills/README.md (and DEPENDENCIES.md only after
the owner answers SURF-O2).
out_of_scope: renaming plan files (SURF-O3), editing skill plans.
```

### SURF-WS7 - close the seven proposed ADRs (ask the owner first)

```
SURF-WS7 - ADR 136, 137, 138, 139, 140, 141 and 155 are all
`Status: proposed`, dated 2026-10-17. ADR 136 and ADR 155 have the same body
(only the heading differs). ADR 140 names `vanilla-reactive`, which ADR 152
retired. ADR 140 and 141 plan shared rules on the routers rule-frontend and
rule-meta (xss-sink-sanitized, meta-public-env-secret ...), but the skill
plans for rule-frontend and rule-meta have no guardrail step, so those rules
have no owner.
ASK THE OWNER (SURF-O1) before writing anything:
 (a) mark all seven `superseded by` the skill plans; or
 (b) accept the six distinct ones as rationale and settle 155 as a duplicate;
 (c) another choice.
Then:
- Settle ADR 155 as the duplicate of ADR 136 (keep the older file), the way
  settleDuplicateAdrs (packages/mcp/core/docs/adr-pending/_settle.js) does.
  Run after OSS-WS5 T1.
- Write the status change or the supersede pair with rule_tool_process_adr.
- If the shared router rules still matter, list them as an open owner
  decision in the report. Do not add a guardrail step to any plan.
files_to_change: docs/adr/ (status lines or a pending ADR), nothing else.
out_of_scope: writing any guardrail, editing any skill plan.
```
