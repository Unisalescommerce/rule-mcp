# plan-of-plans - level-0 orchestration on `main`

Status: `in-progress`. This file is the **only unprefixed plan** under `docs/plans/`: it is the index that coordinates every other plan. Every subordinate plan file starts with `_` (top-level and `skills/**`) so a reader can tell the coordinator from the work it orders. It plans no skill, and it never touches `main`.

Format: the contract of ADR 154 (status line, `## Dependency graph`, checkbox steps), in its **four-line in-branch form** (ADR 181).

Topology: **`main` is the only branch.** The cutover of 2026-11-06 replaced it with the history that was on `rel/v0.1.0` and deleted the old branch (ADR 214). After the repository goes public there is no rewrite and no force-push.

## 0 - Naming convention

| Path pattern                                                       | Role                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `docs/plans/plan-of-plans.md`                                      | level-0 index (this file); the only plan without a leading `_` |
| `docs/plans/_*.md`                                                 | non-skill subordinate plans                                    |
| `docs/plans/_deepseek-prompts.md`                                  | support runbook for audit plans; not an executable plan        |
| `docs/plans/skills/<area>/_*.md`                                   | skill and cross-skill subordinate plans                        |
| `docs/plans/skills/_skills-plan.md`                                | level-1 catalog orchestrator                                   |
| `docs/plans/skills/README.md`, `docs/plans/skills/DEPENDENCIES.md` | indexes, not executable plans (no `_`)                         |

Node ids in graph lines stay skill names (`rule-process-ai`), not filenames. Filenames carry `_` + the prior stem (`_rule-mcp-process-ai.md`).

## 1 - Snapshot (2026-11-05)

| Group                           | Path                          | Status         | Open work                                                                           |
| ------------------------------- | ----------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| this index                      | `plan-of-plans.md`            | `in-progress`  | workstream ordering + owner merge gate                                              |
| catalog orchestrator            | `skills/_skills-plan.md`      | `in-progress`  | 3 release nodes done; remaining leaves per its stages                               |
| host integration                | _(retired)_                   | done → ADR 200 | 37/37; per-host tokens deferred (pending ADR close-host-…)                          |
| launcher                        | _(retired)_                   | done → ADR 201 | Phase 4 closed 2026-10-30 (pending ADR the-launcher-owns-…)                         |
| port / installer scope          | _(retired)_                   | done → ADR 198 | file gone; HARD edge to host plan satisfied                                         |
| export                          | _(retired)_                   | done → ADR 199 | Steps 0–8 complete 2026-10-31; review/audit → ADR 202/203                           |
| scripts layout                  | _(retired)_                   | done → ADR 205 | WS0–WS7 closed 2026-11-01; product ADR pending land                                 |
| decision models                 | _(retired)_                   | done → ADR 209 | own graph                                                                           |
| ASD-STE100 writing + plan shape | _(retired)_                   | done → ADR 204 | WS-G closed 2026-10-31; product pending ADR mcp-authored-markdown-uses-asd-ste100…  |
| plan-graph audit                | _(retired)_                   | done → ADR 213 | history (ADR 171)                                                                   |
| Pi integration and catalog debt | `_pi-integration-and-debt.md` | `in-progress`  | WS1 installed-skill verification; WS2 catalog debt                                  |
| OSS readiness and repo health   | _(retired)_                   | done → ADR 217 | WS1 records four decisions; serialize ADR writes with the surface audit             |
| tool and skill surface audit    | _(retired)_                   | done → ADR 218 | closed 2026-11-06: counts guarded, catalog refreshed, ADRs decided                  |
| publication cutover             | `_publication-cutover.md`     | `planned`      | HARD-waits for the OSS and surface plans, then fixes tests, CI, secrets and cutover |
| Deepseek audit runbook          | `_deepseek-prompts.md`        | support        | prompt order for the OSS and surface plans; not an executable graph node            |
| Secrets guardrails              | _(retired)_                   | done → ADR 212 | closeout recorded                                                                   |

Branch history that motivated stages 1-5 (2026-10-21) lives in git and in ADR 181; it is not re-executed. The remote `feat/*` refs carry no content this tree lacks.
| Installer: remove the pnpm global link, fix the launcher deploy | _(retired)_ | done → ADR 216 | scaffold shape check |

## 2 - What this file is not

`docs/plans/skills/_skills-plan.md` is the level-1 orchestrator of the catalog: ~87 nodes, stages 0-10, edge taxonomy, precedence policies, human gates (ADR 154/175/181). This file **delegates to it** for skill plans and does not restate its order.

| Group                                      | Orchestrator                      | State                                                                            |
| ------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------- |
| skills catalog                             | `skills/_skills-plan.md`          | in progress: npm/uv/cargo-release retired (ADR 206-208)                          |
| host + launcher (installer infrastructure) | this file, workstreams A–B        | both done                                                                        |
| single-document tracks                     | each plan's `## Dependency graph` | Pi, OSS readiness and surface audit can start; publication waits for both audits |
| audit execution runbook                    | none                              | `_deepseek-prompts.md` supports OSS and surface; it owns no work                 |
| repository policy / OSS Stage 0            | ADR 135 + handoff 27              | closed                                                                           |

## 3 - Edges (in-branch)

| Kind       | Meaning                                        | Executor rule       |
| ---------- | ---------------------------------------------- | ------------------- |
| `HARD`     | B cannot start before A is closed              | block               |
| `ORDER`    | B can start, but after A avoids churn          | warn                |
| `CONFLICT` | A and B edit the same shared file              | serialize           |
| `CONTRACT` | A exports a surface B consumes, named by phase | block on that phase |

Cross-branch kinds (`MERGE`, `REBASE`, `DIVERGENCE`, `SUPERSEDES`) are retired with ADR 181.

## 4 - Dependency graph (level 0)

```
main
├── plan-of-plans.md .................... this index (unprefixed)
├── WS-A  host closeout ................. done → ADR 200 (HARD← ADR 198)
├── WS-B  launcher Phase 4 .............. done → ADR 201
├── WS-C  skills catalog
│   └── skills/_skills-plan.md ......... stages 0-10; 3 release nodes done
├── WS-D  single tracks and publication preparation
│   ├── export ........................ done → ADR 199
│   ├── scripts layout ................ done → ADR 205
│   ├── decision models ............... done → ADR 209
│   ├── Pi integration ................ in progress
│   ├── OSS readiness ................. planned
│   ├── tool and skill surface audit .. done (ORDER <- Pi; CONFLICT <-> OSS)
│   ├── publication cutover ........... in progress (cutover done)
│   └── Deepseek prompts .............. support runbook, not a node
├── WS-G  ASD-STE100 writing + plan shape
│   └── _asd-ste100.md ................. done → ADR 204
├── WS-E  superseded / historical ........ no execution
└── WS-F  owner merge to main ........... human gate only
```

| From                             | To                                    | Kind                | Why                                                               |
| -------------------------------- | ------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| installer-scope (ADR 198)        | `_mcp-host-integration-depth`         | `HARD`              | host path table consumed by host Phase 1+; **satisfied**          |
| `skills/_skills-plan` catalog    | host / launcher                       | `ORDER`             | avoid re-testing install against a moving catalog                 |
| WS-A, WS-B                       | WS-D tracks                           | _(none)_            | no shared-file conflict with the remaining active tracks          |
| WS-G (`_asd-ste100`)             | WS-D decision-models / scripts-layout | `ORDER`             | writing rules land before new prose-heavy plan work when possible |
| `_pi-integration-and-debt`       | `_tool-and-skill-surface-audit`       | `ORDER`             | finish Pi WS2 before the audit edits the same catalog rows        |
| `_oss-readiness-and-repo-health` | `_tool-and-skill-surface-audit`       | `CONFLICT`          | both write ADR indexes and repository-level documentation         |
| OSS readiness + surface audit    | `_publication-cutover`                | `HARD`              | cutover rewrites and publishes only after both audits close       |
| catalog leaves                   | area routers                          | `HARD` / `CONTRACT` | owned inside `_skills-plan.md`                                    |

## 5 - Workstreams (linear, conflict-free)

Execute one workstream at a time when it touches shared files (section 8). Otherwise WS-A, WS-B, WS-D and WS-G may proceed in parallel when they do not share files. WS-C serializes on the five shared catalog files named in `_skills-plan.md`. Prefer WS-G (STE100 writing) before new prose-heavy plan work on WS-D.

### WS-A — Host integration closeout

Plan: retired → [ADR 200](../adr/200-close-out-plan-mcp-host-integration-depth.md)

- [x] Port plan closed (ADR 198); HARD edge satisfied.
- [x] Phases 0–5 of the host plan (35/37 checkboxes).
- [x] Close or explicitly defer the two remaining boxes (per-host token measurement / E2E host driver). Hook cost closed by ADR 187–189; per-host tokens deferred until an in-repo E2E driver exists (pending ADR `close-host-integration-depth-with-deferred-per-host-token-measurement`).
- [x] Mark the plan `done` and fold residual decisions into an ADR at handoff.

### WS-B — Launcher Phase 4

Plan: retired → [ADR 201](../adr/201-close-out-plan-stable-launcher-outside-the-checkout.md)

- [x] Phases 1–3: deploy-based copy, resolution order, skip recording (handoff 36).
- [x] Phase 4: `setup --uninstall` removes `~/.rule-mcp/launcher/` then the shim; `docs/04-operations.md`; pending ADR `the-launcher-owns-a-copy-outside-the-checkout`.
- [x] Mark the plan `done`.

### WS-C — Skills catalog (delegated)

Orchestrator: [`skills/_skills-plan.md`](skills/_skills-plan.md)

- [x] Format contract on every skill node (ADR 154); Stage 7 id-mismatch finding owned by that test.
- [x] Three release nodes done (`rule-process-npm/uv/cargo-release`); retired → [ADR 206](../adr/206-close-out-plan-rule-mcp-process-cargo-release.md), [ADR 207](../adr/207-close-out-plan-rule-mcp-process-npm-release.md), [ADR 208](../adr/208-close-out-plan-rule-mcp-process-uv-release.md).
- [ ] Take the first node whose edges are closed in the current `_skills-plan` stage; one commit per stage; human gates as that file lists.
- [ ] Exhaust stages 0–10 until every catalog node is `done` or `superseded`.

### WS-D - Single-document tracks and publication preparation

Run only when WS-A/B/C are idle on the shared files in section 8. The OSS and surface plans can advance independently, but serialize their ADR and repository-document writes. The publication cutover cannot start until both close.

- [x] export — Steps 0–8 complete; retired → [ADR 199](../adr/199-close-out-plan-export.md) (review ADR 202, audit ADR 203).
- [x] scripts-layout — WS0–WS7 complete; retired → [ADR 205](../adr/205-close-out-plan-scripts-mcp-layout.md); product ADR pending `docs/adr/_pending/pnpm-workspace-with-packages-mcp-shared-docs-and-publish-from-packages-mcp.md`.
- [x] decision models — DM-04 closed by its kill criterion: the harness and the registry ship, the Italian routing claim is dropped; retired → [ADR 209](../adr/209-close-out-plan-decision-models.md).
- [ ] [`_pi-integration-and-debt.md`](_pi-integration-and-debt.md) - WS1 installed-skill verification and WS2 catalog debt remain.
- [x] [`_oss-readiness-and-repo-health.md`](_oss-readiness-and-repo-health.md) - registration is complete. WS1 records the four repository decisions; retired → [ADR 217](../adr/217-close-out-plan-oss-readiness-and-repo-health.md).
- [x] [`_tool-and-skill-surface-audit.md`](_tool-and-skill-surface-audit.md) - closed 2026-11-06: counts guarded by a test, catalog documents refreshed, proposed ADRs decided, orchestrator deduplicated.
- [ ] [`_publication-cutover.md`](_publication-cutover.md) - the history rewrite and the branch cutover landed 2026-11-06; the lint and coverage debt it records stays open.
- [x] [`_deepseek-prompts.md`](_deepseek-prompts.md) - registered as a support runbook for the OSS and surface plans, not as an executable node.
- [x] Secret guardrails - WS1-WS3 complete; retired to [ADR 212](../adr/212-close-out-plan-secrets-guardrails.md).
- [x] [`_installer-global-link-and-launcher-deploy.md`](_installer-global-link-and-launcher-deploy.md) - scaffold shape check; retired → [ADR 216](../adr/216-close-out-plan-installer-global-link-and-launcher-deploy.md).

### WS-G — ASD-STE100 writing and AI plan shape

Retired → [ADR 204](../adr/204-close-out-plan-asd-ste100.md). Product decision pending: `docs/adr/_pending/mcp-authored-markdown-uses-asd-ste100-at-about-80-percent.md`.

- [x] WS1 writing standard (STE100~80 profile + shared directive).
- [x] WS2 generators + impersonation (ADR, handoff, review/audit, personas).
- [x] WS3 development-plan shape: `WSn` / `WSn-Tx.y`, edge list + diagram, conflict-free AI execution.
- [x] WS4 evaluate (then implement) which tools/skills must honor `.gitignore`.
- [x] WS5 docs, census, ADR, handoff closeout.

### WS-E — Superseded / historical (no execution)

- [x] Six area guardrail plans retired after their 76 rule IDs moved to owning skill plans.
- [x] [`_plan-of-plans-reference.md`](_plan-of-plans-reference.md) retired (ADR 171).
- [x] Cross-branch stages 3–5 retired (ADR 181).

### WS-F — Owner merge to `main`

- [x] Owner merged to `main` on 2026-11-06 by the cutover itself (ADR 214). There is no merge request: the branch is the history.

## 6 - Protocol: how the agent picks the next node

1. Read section 5; take the first open checkbox whose edges in section 4 are closed.
2. If the node is a skill plan, open `skills/_skills-plan.md` and take its next node — do not invent order here.
3. Work on `main` only; it is the only branch (ADR 214).
4. Close the node's own checkboxes; run its gates plus section 8 shared gates.
5. Commit `type(scope): subject`; docs in their own commit when possible; push only when the owner asks.
6. Update the matching workstream row here (or the catalog progress table) before the next node.

A node that cannot finish is marked `blocked` with the blocking edge, never moved to another workstream.

## 7 - Historical stages (record)

Kept so the fold and retirement remain auditable. Not a queue.

### Stage 0 — Project policy — done 2026-10-22

- [x] ADR 135 + OSS-01..08 closed with tests.

### Stage 1 — Fold `dm` — done 2026-10-22

- [x] `decision-models` folded; `feat/decision-models` retired as plan owner.

### Stage 2 — Retrofit `ex` and `nyx` — done 2026-10-22

- [x] `_export.md` and `_2026-10-01-scripts-mcp-layout.md` carry graph lines.

### Stages 3–5 — Merges into `feat/evolution` — retired 2026-10-25

- [x] Recorded as retired (ADR 181); content already in this tree.

### Stage 6 — Hand over to the owner

- [ ] Same as WS-F.

### Stage 7 — Format on every plan

- [x] ADR 154 contract on catalog nodes.
- [ ] Skills-plan test id sweep if any assertion still mismatches after the `_` rename (strip leading `_` then `rule-mcp-` → `rule-`).

### Stage 8–10 — Catalog / installer / launcher

Superseded as an execution queue by workstreams A–C above; checkbox progress lives there.

## 8 - Shared files (serialize)

| File                                                                | Who touches it              | Resolution                            |
| ------------------------------------------------------------------- | --------------------------- | ------------------------------------- |
| `scripts/__tests__/fixtures/guardrail-corpus.mjs`                   | every plan that adds a rule | append-only, one plan at a time       |
| `scripts/__tests__/fixtures/census.json`                            | surface changes             | `pnpm census`, never by hand          |
| generated `docs/0*.md`, `docs/16-*.md`, `docs/17-*.md`, `README.md` | same                        | regenerate; README accuracy tests     |
| `docs/adr/ADR.md` and ADR numbering                                 | ADR writers                 | `rule_tool_process_adr`               |
| `docs/handoff/HANDOFF.md`                                           | handoff writers             | regenerate index                      |
| `skills/rule-process/SKILL.md`                                      | process skill plans         | one row per skill, one plan at a time |

## 9 - Gates

Automatic: corpus/router suites, `census:check`, lint, the node's own verification.

Human only:

| Gate                         | Where          | Why                                    |
| ---------------------------- | -------------- | -------------------------------------- |
| Anything that touches `main` | WS-F           | owner merge request                    |
| Generated documents          | census surface | hand-edited generated files fail tests |
| Destructive skill removals   | ADR 151/152    | one-way in review                      |
| Changes to this graph        | this file      | the graph is the contract              |

## 10 - Verification

- `scripts/__tests__/plans/skills-plan.test.mjs` over catalog nodes (paths may start with `_`).
- `pnpm census:check`, `scripts/__tests__/docs/docs-accuracy.test.mjs`.
- Section 5 workstreams and `_skills-plan.md` stage tables agree on ownership.

## Dependency graph

Depends on: ADR 154 (format), ADR 181 (one-branch orchestration), ADR 175 (catalog edges), ADR 198 (installer-scope closed).

Feeds: every subordinate `_*.md` plan; WS-A through WS-F; `skills/_skills-plan.md` for catalog leaves.

Shared files: `docs/plans/plan-of-plans.md` only. Generated documents belong to the nodes that touch them.

## 11 - Open notes and risks

- **Underscore index rule.** Only this file is an unprefixed executable plan. A new plan under `docs/plans/` must start with `_` and be registered in section 1 and the matching workstream. `_deepseek-prompts.md` is the explicit support-runbook exception and is not a graph node.
- **ASD-STE100 (~80%).** New product prose from this server follows ADR 204 closeout + pending product ADR (`mcp-authored-markdown-uses-asd-ste100…`): short, direct, same word for the same thing, still slightly natural. Development plans use `WSn` / `WSn-Tx.y` with a dependency list **and** a diagram (ADR 154 amendment).
- **Host plan almost done.** Do not reopen closed host phases; close the two open boxes or defer with an ADR.
- **Launcher Phase 4 is the last launcher work.** Phases 1–3 already shipped (handoff 36); measurement chose `pnpm deploy --prod --legacy`, not `pnpm pack`.
- **`main` diverged ~870 commits.** Merge is a review, not a cherry-pick.
- **Remote `feat/*` still exist.** Deleting them is a repository decision, not this plan's.
- **Prettier debt (~74 files)** can fail `pre-push` independently of launcher health; reformatting is a separate decision.

## 12 - Model assignment

Classes and evidence: historical section retained in git history through 2026-10-22. Current default for this file's remaining steps:

| Step                 | Class                  | Notes                                 |
| -------------------- | ---------------------- | ------------------------------------- |
| WS-A / WS-B closeout | `T1-plan` / `T3-rules` | product + installer code              |
| WS-C catalog leaves  | per node               | see each plan's `## Model assignment` |
| WS-D single tracks   | per plan               | see each plan                         |
| WS-F owner summary   | `T1-plan`              | human gate                            |
