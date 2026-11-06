# tool-and-skill-surface-audit

- **Plan**: `docs/plans/_tool-and-skill-surface-audit.md` (retired)
- **ADR**: 218 (`209-close-out-plan-tool-and-skill-surface-audit.md`)

## Delivered

- WS0-T1: Add this plan to [plan-of-plans](plan-of-plans.md). Registered in the snapshot, level-0 graph, edge table, and WS-D on 2026-11-05.
- WS1-T1: Run node --import ./scripts/alias-hook.mjs --test scripts/__tests__/docs/docs-accuracy.test.mjs. It passes and prints the real counts on its last line. Copy those counts into CLAUDE.md. Change only the counts. Leave the "212 checks" figure for WS2. Measured 2026-11-06: 106 tools / 174 resources / 41 prompts / 83 skills / 44 commands, now in CLAUDE.md (commit 183b42c16).
- WS2-T1: Get the real count from the project runtime (rule_tool_stats, or the call that docs-accuracy.test.mjs would use). Do not use grep. Find what "212" counted. Measured 2026-11-06 through loadLayerGuardrails and the engine registry. It reports 84 skill directories, with 22 owning rules. It counts 116 owned entries and 110 distinct owned rule IDs. Resolved rules sum to 200 across skills, and 67 distinct baseline rule IDs apply to every check. Static file counts are 120 rule files and 14 test files, also not 212. The figure has no verifiable unit and was replaced, not relabeled.
- WS2-T2: Write the confirmed number and its unit (files or assertions) into CLAUDE.md. If 212 was right for some unit, only add the unit. CLAUDE.md now states 110 guardrail rules owned by 22 of 84 skill directories, plus 67 baseline rules every check runs.
- WS3-T1: Extend scripts/__tests__/docs/docs-accuracy.test.mjs. It must assert the CLAUDE.md counts against the runtime values it already computes for README.md. Write the failing assertion first. Run it before WS1 and WS2 land, or against a wrong number. Then confirm it passes after. Verified 2026-11-06: against the previous CLAUDE.md the new assertion fails and names all seven stale claims; against the current file it passes.
- WS4-T1: Run node --import ./scripts/alias-hook.mjs --test scripts/__tests__/plans/skills-plan.test.mjs. Keep the result.
- WS4-T2: Diff the two copies of sections 6-13. Keep the copy that the test and git log -p show as current. Keep the newer "Model assignment" table. Remove the other copy. If the copies disagree on a fact, report it. Do not pick silently. The only disagreement was the model assignment table: the kept one names the split stages 0a to 10 and the plan's own phases, the removed one still described stages 1-9 as a single block. Sections 6-13 were byte-identical.
- WS4-T3: Run the test again. It must pass. The file must end near 575 lines. Measured 2026-11-06: 568 lines, and the plan tests pass.
- WS5-T1: Run the plan-shape tests before the change and keep the green baseline.
- WS5-T2: Assign every retained rule ID to an owning skill plan, with a regression test over the complete mapping.
- WS5-T3: Delete the six superseded files after the ownership test passes.
- WS5-T4: Remove their active references from the level-0 plan, catalog orchestrator, dependency guide, and execution runbook.
- WS5-T5: Record the retirement through rule_tool_process_adr. Git history keeps the detailed source material.
- WS5-T6: Run the plan and handon graph tests after deletion.
- WS6-T1: In docs/plans/skills/README.md, set the catalog total to what exists today: 83 catalog skills, and 84 directories because of the root skill rule. The file says "Total: 81 skills" and lists rule-process-cargo-release (88) and rule-process-uv-release (89) as "planned skills that do not exist yet". Both exist.
- WS6-T2: In the same file, list as "planned, not yet built" only the three that are still hypothetical: rule-platform-mobile (85), rule-toolchain-electron (86), and rule-toolchain-tauri (87). Their plan files exist (docs/plans/skills/platform/_rule-mcp-platform-mobile.md and two under toolchain/).
- WS6-T3: Add one column to the README table: guardrails has, planned, or none. has means skills/<s>/guardrails/ exists (22 skills today). planned means no directory, but the skill plan has a step that creates skills/<s>/guardrails/ (37 today). none means neither (24 today). The root skill rule has no plan and stays outside the table.
- WS6-T4: Add two sentences to the README. First: none means prose-only unless a plan adds a guardrail step. Second: the progress table in _skills-plan.md is the live status, and the Status: line inside a skill plan is the status at registration. Do not add a guardrail step to any plan. The owner decided: planned stays planned, and nothing new is imposed.
- WS6-T5: Fix the counts in docs/plans/skills/DEPENDENCIES.md (D4). It says "the 83 leaf plans", "84 plans: the catalog plus the planned mobile skill", and "the 83 leaves plus the one planned leaf (84 plans)". Recount from the tree. Today there are 81 skill plan files (_rule-mcp-*.md): 78 for built skills and 3 for skills not built yet. Keep the file. Change the counts only. Measured 2026-11-06: 81 skill plan files, 78 for built skills and 3 not built. The guardrail column counts 22 has, 37 planned, 24 none.
- WS7-T1: Evaluate each of the seven ADRs. For each rule an ADR lists, find out: is it built in skills/, is it planned in a skill plan (name the plan and the step), or does nobody own it. Write the result as a table directly under this workstream in this file. Columns: ADR, rule, state (built, planned in <plan>, unowned), and a proposal (supersede, accept as rationale, needs an owner decision). Add a short summary of three to five lines. State plainly which rules would be lost if all seven ADRs became superseded.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
