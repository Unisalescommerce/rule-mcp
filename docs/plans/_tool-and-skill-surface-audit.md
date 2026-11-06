# Plan: Tool and skill surface audit

Status: `planned`.

Notes: subordinate plan; coordinated by [plan-of-plans](plan-of-plans.md).

Source: a read-only audit of 2026-11-05. It read the skill plans in [skills](skills/_skills-plan.md), the retired area guardrail plans, and [the pi plan](_pi-integration-and-debt.md).

The owner made every decision in section 2. No choice stays open.

This plan holds the full instructions. A session does not need a separate prompt.

## Dependency graph

```
WS0 --> WS1 --> WS3
WS0 --> WS2 --> WS3
WS0 --> WS4 --> WS5 --> WS6
WS0 --> WS7
```

Depends on: `pi-integration-and-debt` (ORDER), `oss-readiness-and-repo-health` (CONFLICT).

Feeds: `_publication-cutover.md` (it waits for this plan to close).

Shared files: `CLAUDE.md`, `docs/plans/plan-of-plans.md`, `docs/plans/skills/README.md`, `docs/plans/skills/DEPENDENCIES.md`, `docs/plans/skills/_skills-plan.md`, `docs/adr/ADR.md`, `docs/adr/_pending/`, `scripts/__tests__/docs/docs-accuracy.test.mjs`.

WS0 registers this plan.

WS1 and WS2 are small doc fixes and run in parallel. WS3 adds a test guard, so it waits for both.

WS4 removes the duplicate text in the orchestrator before WS5 edits it. WS6 edits the catalog docs after the area plans are gone. WS7 has no other edge.

Start WS4 and WS5 after WS2 of the pi plan closes. That workstream changes the progress rows of the bundler-family plan in the same file.

The plan [OSS readiness and repo health](_oss-readiness-and-repo-health.md) shares `docs/adr/ADR.md` and `CLAUDE.md` with this plan.

Run only one of the two plans at a time. This plan owns the `CLAUDE.md` counts. The other plan settles the 8 duplicate ADR pairs in 001-020 (its WS4-T1). This plan settles the ninth pair, 136 and 155 (WS7-T2). Run its WS4-T1 first.

The history rewrite in [publication cutover](_publication-cutover.md) runs after this plan.

## 1 - What this plan is

An audit of the tool surface (106 tools) and the skill catalog (84 directories), tied to the plan files that govern them. The audit used the project's own loader (`node --import ./scripts/alias-hook.mjs`), not static grep. Out of scope: the prose of the 84 `SKILL.md` files.

How the plan files relate:

```
plan-of-plans.md                      level 0: indexes every plan
  |
  +-- skills/_skills-plan.md          level 1: orders 83 nodes in stages 0-10
  |     |
  |     +-- skills/<area>/_*.md       level 2: 82 plan files (see the table)
  |     +-- skills/README.md          index table of the skill plans
  |     +-- skills/DEPENDENCIES.md    old run order; section 5 of _skills-plan.md supersedes it
  |
  +-- retired area guardrail plans    removed after their rule IDs moved to owners
  |
  +-- _pi-integration-and-debt.md     separate track; its WS2 touches the same
                                      orchestrator rows as WS4 and WS5 here
```

| File or group            | Role                                                                                                                                                                                                                           | State today                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `plan-of-plans.md`       | Level-0 index. Lists the six area plans as `superseded`, "no new work".                                                                                                                                                        | Current.                                                                                          |
| `skills/_skills-plan.md` | Level-1 orchestrator. 864 lines. Owns order, gates, and the progress table.                                                                                                                                                    | Sections 6-13 and "Model assignment" appear twice (lines 276-565 and 567-864). The copies differ. |
| `skills/<area>/_*.md`    | 82 plan files: 78 for built skills, 3 for skills not built yet (`rule-platform-mobile`, `rule-toolchain-electron`, `rule-toolchain-tauri`), and `_bundler-family.md`. All 82 say `Status: planned`. All 82 mention guardrails. | The plans command. Keep them all.                                                                 |
| `skills/README.md`       | Index table. Says "81 skills". Lists `cargo-release` and `uv-release` as "planned, do not exist".                                                                                                                              | Stale. Both skills exist.                                                                         |
| `skills/DEPENDENCIES.md` | Old run order. Says "83 leaves plus one".                                                                                                                                                                                      | Stale counts. The owner keeps the file (D4).                                                      |
| retired area plans       | Former area-level guardrail backlogs, 1,261 lines before retirement.                                                                                                                                                           | Removed after 76 rule IDs were assigned to owning skill plans.                                    |
| ADR 136-141 and 155      | The reasons behind about 76 planned guardrails.                                                                                                                                                                                | All seven are `proposed`. ADR 136 and ADR 155 are the same text.                                  |

The area plans and the skill plans overlapped. ADR 175 removed the area plans from the execution graph. The owner required every retained rule ID to move to an owning skill plan before deletion.

## 2 - Decisions

All five decisions are made.

| #   | Question                                                                                                  | Decision                                                                                                                                                              | Consequence                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 62 of 84 skills have no guardrail. The area plans and ADR 136-141 promise about 76. Which wins?           | The plans in `docs/plans/skills` win. Everything planned stays planned. If prose is enough for a skill, this audit adds no guardrail unless a plan already plans one. | 37 guardrail-less skills keep their planned step. 24 have none planned and stay prose-only. WS6 records which is which. No guardrail work here. |
| D2  | What happens to the six superseded area plans?                                                            | Delete them.                                                                                                                                                          | WS5. Git history keeps the old text.                                                                                                            |
| D3  | The seven `proposed` ADRs (136-141, 155) never got accepted or superseded. What does this plan write?     | The plan does not decide. A session evaluates the situation and writes a table. The owner reads the table and decides later.                                          | WS7. No ADR changes status in this plan, except that ADR 155 is settled as a duplicate of ADR 136.                                              |
| D4  | `skills/DEPENDENCIES.md` calls itself history. Keep it?                                                   | Keep it. Fix its counts.                                                                                                                                              | WS6-T4.                                                                                                                                         |
| D5  | All 81 `_rule-mcp-*` plan files keep the old prefix. The skills use `rule-*` (ADR 169). Rename the files? | No. Keep the prefix.                                                                                                                                                  | No task. The plan reader already turns `rule-mcp-` into `rule-` in plan ids.                                                                    |

## 3 - Evidence

```
node --import ./scripts/alias-hook.mjs --test scripts/__tests__/docs/docs-accuracy.test.mjs
  -> PASS 6/6. Counts: 106 tools / 174 resources / 41 prompts / 83 skills / 44 commands.
ls skills | wc -l                                  -> 84 directories (83 "rule-" skills and the root `rule`)
listTools() against the expected tool name of each skill directory
  -> 0 skills without a tool. 0 orphan tools beyond the 22 cross-cutting ones.
find skills -path "*/guardrails/_*.js" -not -path "*__tests__*" | wc -l   -> 120 files in 22 skills
for each guardrail-less skill: does its plan have a step "skills/<s>/guardrails/"?
  -> 37 yes, 24 no, 1 root skill (`rule`) with no plan
ls docs/plans/skills/*/_*.md | wc -l               -> 82 files, all `Status: planned`
first progress table in _skills-plan.md            -> 87 rows, 248 of 1508 steps closed
grep -c '^- \[x\]' docs/plans/skills/toolchain/_rule-mcp-toolchain-biome.md  -> 4
  (the table says `in-progress` for it; the file says `planned`)
ADR status: `proposed` -> 7 (136-141, 155); `superseded` -> 8
body hash of every ADR minus its first line        -> 9 duplicate pairs (8 in 001-020, plus 136/155)
diff of _skills-plan.md lines 276-565 vs 567-864   -> not empty
grep for the six area plan names outside the plans -> _skills-plan.md (2 copies), plan-of-plans.md,
  DEPENDENCIES.md. No test names them.
```

The 24 skills with no guardrail step: `rule-data-validation`, `rule-frontend`, `rule-meta`, `rule-platform`, `rule-process-bmad`, `rule-process-readme`, `rule-process-tdd`, `rule-styleguide`, `rule-styleguide-baseline`, `rule-styleguide-configuration`, `rule-styleguide-git`, `rule-styleguide-i18n`, `rule-styleguide-json`, `rule-styleguide-markdown`, `rule-toolchain`, `rule-toolchain-biome`, `rule-toolchain-eslint`, `rule-toolchain-husky`, `rule-toolchain-parcel`, `rule-toolchain-rspack`, `rule-toolchain-turborepo`, `rule-toolchain-vite`, `rule-ui`, `rule-ui-design-system`. Six are area routers. The rest are toolchain and style skills.

## 4 - Findings

| #   | Severity        | Finding                                                                                                                                                                                | Where                                       |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| G1  | Info (strength) | The surface is a clean 1:1. Every skill has one tool. Twenty-two cross-cutting tools have no skill. No orphan. No gap.                                                                 | runtime `listTools()`                       |
| G2  | Medium          | `CLAUDE.md` says 107 tools, 186 resources, 37 prompts, 89 skills. The real counts are 106, 174, 41, 83. Only `README.md` is under test.                                                | `CLAUDE.md`                                 |
| G3  | Low             | `CLAUDE.md` says "212 checks". The file count is 120. The unit is not confirmed.                                                                                                       | `CLAUDE.md`                                 |
| G4  | Resolved        | Six area guardrail plans stayed in the tree after ADR 175 removed them from the graph. Their 76 rule IDs now have owning skill plans, and the files are retired.                       | skill-plan ownership regression test        |
| G5  | Medium          | `_skills-plan.md` holds sections 6-13 twice. The copies drift (two "Model assignment" tables). The progress table is in both copies, so a test can read the wrong one.                 | `docs/plans/skills/_skills-plan.md:276-864` |
| G6  | Medium          | Seven ADRs stay `proposed`. ADR 136 and ADR 155 are one text. That is a ninth duplicate pair, outside 001-020.                                                                         | `docs/adr/136-*`, `155-*`                   |
| G7  | Low             | `skills/README.md` says 81 skills and lists two built skills as "do not exist". `DEPENDENCIES.md` says "83 leaves plus one". The "89" in `CLAUDE.md` most likely came from the README. | `docs/plans/skills/`                        |
| G8  | Info            | The backlog is large: 248 of 1,508 steps are closed in the first progress table. For an outside reader this is an honest roadmap. Present it as one.                                   | `docs/plans/skills/`                        |
| G9  | Low             | The progress table marks many rows `in-progress`. Their plan files say `Status: planned`. Two sources, two answers.                                                                    | `skills/_skills-plan.md`, skill plan files  |

## 5 - Workstreams

### WS0 - Register this plan

- [x] **WS0-T1**: Add this plan to [plan-of-plans](plan-of-plans.md). Registered in the snapshot, level-0 graph, edge table, and WS-D on 2026-11-05.

### WS1 - Fix the stale counts in CLAUDE.md (G2)

The repo-root `CLAUDE.md` says "107 tools / 186 resources / 37 prompts / 89 skills" in "Repository state". The runtime-verified counts on 2026-11-05 are 106 tools, 174 resources, 41 prompts, and 83 skills. The 83 is the `rule-` catalog. `skills/` has 84 entries because of the root skill `rule`.

- [x] **WS1-T1**: Run `node --import ./scripts/alias-hook.mjs --test scripts/__tests__/docs/docs-accuracy.test.mjs`. It passes and prints the real counts on its last line. Copy those counts into `CLAUDE.md`. Change only the counts. Leave the "212 checks" figure for WS2. Measured 2026-11-06: 106 tools / 174 resources / 41 prompts / 83 skills / 44 commands, now in `CLAUDE.md` (commit `183b42c16`).

### WS2 - Confirm the check count (G3)

A static count finds 120 guardrail files: `find skills -path "*/guardrails/_*.js" -not -path "*__tests__*" | wc -l`. They sit in 22 of 84 skills. "Checks" may count something else.

- [x] **WS2-T1**: Get the real count from the project runtime (`rule_tool_stats`, or the call that `docs-accuracy.test.mjs` would use). Do not use grep. Find what "212" counted. Measured 2026-11-06 through `loadLayerGuardrails` and the engine registry. It reports 84 skill directories, with 22 owning rules. It counts 116 owned entries and 110 distinct owned rule IDs. Resolved rules sum to 200 across skills, and 67 distinct baseline rule IDs apply to every check. Static file counts are 120 rule files and 14 test files, also not 212. The figure has no verifiable unit and was replaced, not relabeled.
- [x] **WS2-T2**: Write the confirmed number and its unit (files or assertions) into `CLAUDE.md`. If 212 was right for some unit, only add the unit. `CLAUDE.md` now states 110 guardrail rules owned by 22 of 84 skill directories, plus 67 baseline rules every check runs.

### WS3 - Stop the drift (G2, G3)

- [ ] **WS3-T1**: Extend `scripts/__tests__/docs/docs-accuracy.test.mjs`. It must assert the `CLAUDE.md` counts against the runtime values it already computes for `README.md`. Write the failing assertion first. Run it before WS1 and WS2 land, or against a wrong number. Then confirm it passes after.

### WS4 - Remove the duplicate text in the orchestrator (G5)

`docs/plans/skills/_skills-plan.md` is 864 lines. The sections "6 - The cross-cutting commits" to "13 - Open notes and risks", and "Model assignment", appear twice (lines 276-565 and 567-864). The copies differ. The progress table is in both.

Start after WS2 of the pi plan closes.

- [ ] **WS4-T1**: Run `node --import ./scripts/alias-hook.mjs --test scripts/__tests__/plans/skills-plan.test.mjs`. Keep the result.
- [ ] **WS4-T2**: Diff the two copies of sections 6-13. Keep the copy that the test and `git log -p` show as current. Keep the newer "Model assignment" table. Remove the other copy. If the copies disagree on a fact, report it. Do not pick silently.
- [ ] **WS4-T3**: Run the test again. It must pass. The file must end near 575 lines.

### WS5 - Retire the six superseded area plans (G4, D2)

The owner chose migration before deletion. The check found that AI already kept its eight IDs, while the other five areas were missing 68 IDs. All 76 now have explicit owners in skill plans.

- [x] **WS5-T1**: Run the plan-shape tests before the change and keep the green baseline.
- [x] **WS5-T2**: Assign every retained rule ID to an owning skill plan, with a regression test over the complete mapping.
- [x] **WS5-T3**: Delete the six superseded files after the ownership test passes.
- [x] **WS5-T4**: Remove their active references from the level-0 plan, catalog orchestrator, dependency guide, and execution runbook.
- [x] **WS5-T5**: Record the retirement through `rule_tool_process_adr`. Git history keeps the detailed source material.
- [x] **WS5-T6**: Run the plan and handon graph tests after deletion.

### WS6 - Refresh the catalog docs (G7, G9, D1, D4)

- [ ] **WS6-T1**: In `docs/plans/skills/README.md`, set the catalog total to what exists today: 83 catalog skills, and 84 directories because of the root skill `rule`. The file says "Total: 81 skills" and lists `rule-process-cargo-release` (88) and `rule-process-uv-release` (89) as "planned skills that do not exist yet". Both exist.
- [ ] **WS6-T2**: In the same file, list as "planned, not yet built" only the three that are still hypothetical: `rule-platform-mobile` (85), `rule-toolchain-electron` (86), and `rule-toolchain-tauri` (87). Their plan files exist (`docs/plans/skills/platform/_rule-mcp-platform-mobile.md` and two under `toolchain/`).
- [ ] **WS6-T3**: Add one column to the README table: guardrails `has`, `planned`, or `none`. `has` means `skills/<s>/guardrails/` exists (22 skills today). `planned` means no directory, but the skill plan has a step that creates `skills/<s>/guardrails/` (37 today). `none` means neither (24 today). The root skill `rule` has no plan and stays outside the table.
- [ ] **WS6-T4**: Add two sentences to the README. First: `none` means prose-only unless a plan adds a guardrail step. Second: the progress table in `_skills-plan.md` is the live status, and the `Status:` line inside a skill plan is the status at registration. Do not add a guardrail step to any plan. The owner decided: planned stays planned, and nothing new is imposed.
- [ ] **WS6-T5**: Fix the counts in `docs/plans/skills/DEPENDENCIES.md` (D4). It says "the 83 leaf plans", "84 plans: the catalog plus the planned mobile skill", and "the 83 leaves plus the one planned leaf (84 plans)". Recount from the tree. Today there are 81 skill plan files (`_rule-mcp-*.md`): 78 for built skills and 3 for skills not built yet. Keep the file. Change the counts only.

Do not rename the plan files (D5).

### WS7 - Evaluate the seven proposed ADRs (G6, D3)

ADR 136, 137, 138, 139, 140, 141, and 155 are all `Status: proposed`, dated 2026-10-17. ADR 136 and ADR 155 have the same body. ADR 140 names `vanilla-reactive`, which ADR 152 retired. ADR 140 and ADR 141 plan shared rules on the routers `rule-frontend` and `rule-meta` (for example `xss-sink-sanitized` and `meta-public-env-secret`). The skill plans of those two routers have no guardrail step, so those rules have no owner.

The owner has not decided what to do. This workstream evaluates. It changes no ADR status.

- [ ] **WS7-T1**: Evaluate each of the seven ADRs. For each rule an ADR lists, find out: is it built in `skills/`, is it planned in a skill plan (name the plan and the step), or does nobody own it. Write the result as a table directly under this workstream in this file. Columns: ADR, rule, state (`built`, `planned in <plan>`, `unowned`), and a proposal (`supersede`, `accept as rationale`, `needs an owner decision`). Add a short summary of three to five lines. State plainly which rules would be lost if all seven ADRs became `superseded`.
- [ ] **WS7-T2**: Settle ADR 155 as the duplicate of ADR 136. Keep the older file, as `settleDuplicateAdrs` does. Run it after WS4-T1 of the OSS plan.
- [ ] **WS7-T3**: Stop. Do not change the status of any other ADR. Do not add a guardrail step to any plan. The owner reads the table and decides in a later session.

## 6 - What this plan does not decide

This plan adds no guardrail and no guardrail step. It does not rate any skill's prose. It does not change the order of the skill plans. It does not rename any plan file.
