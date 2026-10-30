# plan-of-plans - level-0 orchestration on `rel/v0.1.0`

Status: `in-progress`. This file is the **only unprefixed plan** under `docs/plans/`: it is the index that coordinates every other plan. Every subordinate plan file starts with `_` (top-level and `skills/**`) so a reader can tell the coordinator from the work it orders. It plans no skill, and it never touches `main`.

Format: the contract of ADR 154 (status line, `## Dependency graph`, checkbox steps), in its **four-line in-branch form** (ADR 181).

Topology: **`rel/v0.1.0` is where the work is.** Every commit lands here. `main` is out of scope until the owner opens the merge request. Measured again 2026-10-30 after handoff 36.

## 0 - Naming convention

| Path pattern | Role |
| ------------ | ---- |
| `docs/plans/plan-of-plans.md` | level-0 index (this file); the only plan without a leading `_` |
| `docs/plans/_*.md` | non-skill subordinate plans |
| `docs/plans/skills/<area>/_*.md` | skill and cross-skill subordinate plans |
| `docs/plans/skills/_skills-plan.md` | level-1 catalog orchestrator |
| `docs/plans/skills/README.md`, `docs/plans/skills/DEPENDENCIES.md` | indexes, not executable plans (no `_`) |

Node ids in graph lines stay skill names (`rule-process-ai`), not filenames. Filenames carry `_` + the prior stem (`_rule-mcp-process-ai.md`).

## 1 - Snapshot (2026-10-30)

| Group | Path | Status | Open work |
| ----- | ---- | ------ | --------- |
| this index | `plan-of-plans.md` | `in-progress` | workstream ordering + owner merge gate |
| catalog orchestrator | `skills/_skills-plan.md` | `in-progress` | 3 release nodes done; remaining leaves per its stages |
| host integration | `_mcp-host-integration-depth.md` | `done` | 37/37; per-host tokens deferred (pending ADR close-host-…) |
| launcher | `_stable-launcher-outside-the-checkout.md` | `done` | Phase 4 closed 2026-10-30 (pending ADR the-launcher-owns-…) |
| port / installer scope | _(retired)_ | done → ADR 198 | file gone; HARD edge to host plan satisfied |
| export | `_export.md` | `in-progress` | Steps 0–1 done; next Step 2 (flight emit) |
| scripts layout | `_2026-10-01-scripts-mcp-layout.md` | `planned` | own graph |
| decision models | `_decision-models.md` | `planned` | own graph |
| area guardrails (`_*-guardrails.md`) | six files | `superseded` | absorbed into leaf plans; no new work |
| plan-graph audit | `_plan-of-plans-reference.md` | `done` | history (ADR 171) |

Branch history that motivated stages 1-5 (2026-10-21) lives in git and in ADR 181; it is not re-executed. The remote `feat/*` refs carry no content this tree lacks.

## 2 - What this file is not

`docs/plans/skills/_skills-plan.md` is the level-1 orchestrator of the catalog: ~87 nodes, stages 0-10, edge taxonomy, precedence policies, human gates (ADR 153/154/175/181). This file **delegates to it** for skill plans and does not restate its order.

| Group | Orchestrator | State |
| ----- | ------------ | ----- |
| skills catalog | `skills/_skills-plan.md` | in progress: npm/uv/cargo-release done |
| host + launcher (installer infrastructure) | this file, workstreams A–B | both done |
| single-document tracks | each plan's `## Dependency graph` | export, scripts-layout, decision-models |
| superseded area plans | none (historical) | `_*-guardrails.md` |
| repository policy / OSS Stage 0 | ADR 135 + handoff 27 | closed |

## 3 - Edges (in-branch)

| Kind | Meaning | Executor rule |
| ---- | ------- | ------------- |
| `HARD` | B cannot start before A is closed | block |
| `ORDER` | B can start, but after A avoids churn | warn |
| `CONFLICT` | A and B edit the same shared file | serialize |
| `CONTRACT` | A exports a surface B consumes, named by phase | block on that phase |

Cross-branch kinds (`MERGE`, `REBASE`, `DIVERGENCE`, `SUPERSEDES`) are retired with ADR 181.

## 4 - Dependency graph (level 0)

```
rel/v0.1.0
├── plan-of-plans.md .................... this index (unprefixed)
├── WS-A  host closeout
│   └── _mcp-host-integration-depth.md .. HARD← installer-scope (ADR 198, done)
├── WS-B  launcher Phase 4
│   └── _stable-launcher-outside-the-checkout.md
│       └── independent of WS-A (ORDER only vs catalog churn)
├── WS-C  skills catalog
│   └── skills/_skills-plan.md ......... stages 0-10; 3 release nodes done
├── WS-D  single tracks (parallel, no mutual HARD)
│   ├── _export.md
│   ├── _2026-10-01-scripts-mcp-layout.md
│   └── _decision-models.md
├── WS-E  superseded / historical ........ no execution
└── WS-F  owner merge to main ........... human gate only
```

| From | To | Kind | Why |
| ---- | -- | ---- | --- |
| installer-scope (ADR 198) | `_mcp-host-integration-depth` | `HARD` | host path table consumed by host Phase 1+; **satisfied** |
| `skills/_skills-plan` catalog | host / launcher | `ORDER` | avoid re-testing install against a moving catalog |
| WS-A, WS-B, WS-D | each other | _(none)_ | no shared-file CONFLICT across these tracks today |
| catalog leaves | area routers | `HARD` / `CONTRACT` | owned inside `_skills-plan.md` |

## 5 - Workstreams (linear, conflict-free)

Execute one workstream at a time when it touches shared files (section 8). Otherwise WS-A, WS-B and WS-D may proceed in parallel. WS-C serializes on the five shared catalog files named in `_skills-plan.md`.

### WS-A — Host integration closeout

Plan: [`_mcp-host-integration-depth.md`](_mcp-host-integration-depth.md)

- [x] Port plan closed (ADR 198); HARD edge satisfied.
- [x] Phases 0–5 of the host plan (35/37 checkboxes).
- [x] Close or explicitly defer the two remaining boxes (per-host token measurement / E2E host driver). Hook cost closed by ADR 187–189; per-host tokens deferred until an in-repo E2E driver exists (pending ADR `close-host-integration-depth-with-deferred-per-host-token-measurement`).
- [x] Mark the plan `done` and fold residual decisions into an ADR at handoff.

### WS-B — Launcher Phase 4

Plan: [`_stable-launcher-outside-the-checkout.md`](_stable-launcher-outside-the-checkout.md)

- [x] Phases 1–3: deploy-based copy, resolution order, skip recording (handoff 36).
- [x] Phase 4: `setup --uninstall` removes `~/.rule-mcp/launcher/` then the shim; `docs/04-operations.md`; pending ADR `the-launcher-owns-a-copy-outside-the-checkout`.
- [x] Mark the plan `done`.

### WS-C — Skills catalog (delegated)

Orchestrator: [`skills/_skills-plan.md`](skills/_skills-plan.md)

- [x] Format contract on every skill node (ADR 154); Stage 7 id-mismatch finding owned by that test.
- [x] Three release nodes done (`rule-process-npm/uv/cargo-release`).
- [ ] Take the first node whose edges are closed in the current `_skills-plan` stage; one commit per stage; human gates as that file lists.
- [ ] Exhaust stages 0–10 until every catalog node is `done` or `superseded`.

### WS-D — Single-document tracks

Run only when WS-A/B/C are idle on the shared files in section 8, or in parallel when the track edits none of them.

- [ ] [`_export.md`](_export.md) — Steps 0–1 done; continue from Step 2 (flight emit keep vs drain).
- [ ] [`_2026-10-01-scripts-mcp-layout.md`](_2026-10-01-scripts-mcp-layout.md) — own dependency graph.
- [ ] [`_decision-models.md`](_decision-models.md) — own dependency graph.

### WS-E — Superseded / historical (no execution)

- [x] Six `_*-guardrails.md` marked `superseded` into leaf plans.
- [x] [`_plan-of-plans-reference.md`](_plan-of-plans-reference.md) retired (ADR 171).
- [x] Cross-branch stages 3–5 retired (ADR 181).

### WS-F — Owner merge to `main`

- [ ] Owner opens the merge request to `main`. No stage reads or writes `main` from this graph.

## 6 - Protocol: how the agent picks the next node

1. Read section 5; take the first open checkbox whose edges in section 4 are closed.
2. If the node is a skill plan, open `skills/_skills-plan.md` and take its next node — do not invent order here.
3. Work on `rel/v0.1.0` only.
4. Close the node's own checkboxes; run its gates plus section 8 shared gates.
5. Commit `type(scope): subject`; docs in their own commit when possible; never push.
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

| File | Who touches it | Resolution |
| ---- | -------------- | ---------- |
| `tests/fixtures/guardrail-corpus.mjs` | every plan that adds a rule | append-only, one plan at a time |
| `tests/fixtures/census.json` | surface changes | `pnpm census`, never by hand |
| generated `docs/0*.md`, `docs/16-*.md`, `docs/17-*.md`, `README.md` | same | regenerate; README accuracy tests |
| `docs/adr/ADR.md` and ADR numbering | ADR writers | `rule_tool_process_adr` |
| `docs/handoff/HANDOFF.md` | handoff writers | regenerate index |
| `skills/rule-process/SKILL.md` | process skill plans | one row per skill, one plan at a time |

## 9 - Gates

Automatic: corpus/router suites, `census:check`, lint, the node's own verification.

Human only:

| Gate | Where | Why |
| ---- | ----- | --- |
| Anything that touches `main` | WS-F | owner merge request |
| Generated documents | census surface | hand-edited generated files fail tests |
| Destructive skill removals | ADR 151/152 | one-way in review |
| Changes to this graph | this file | the graph is the contract |

## 10 - Verification

- `tests/plans/skills-plan.test.mjs` over catalog nodes (paths may start with `_`).
- `pnpm census:check`, `tests/docs/docs-accuracy.test.mjs`.
- Section 5 workstreams and `_skills-plan.md` stage tables agree on ownership.

## Dependency graph

Depends on: ADR 154 (format), ADR 181 (one-branch orchestration), ADR 153/175 (catalog edges), ADR 198 (installer-scope closed).

Feeds: every subordinate `_*.md` plan; WS-A through WS-F; `skills/_skills-plan.md` for catalog leaves.

Shared files: `docs/plans/plan-of-plans.md` only. Generated documents belong to the nodes that touch them.

## 11 - Open notes and risks

- **Underscore index rule.** Only this file is unprefixed. A new plan under `docs/plans/` must start with `_` and be registered in section 1 and the matching workstream.
- **Host plan almost done.** Do not reopen closed host phases; close the two open boxes or defer with an ADR.
- **Launcher Phase 4 is the last launcher work.** Phases 1–3 already shipped (handoff 36); measurement chose `pnpm deploy --prod --legacy`, not `pnpm pack`.
- **`main` diverged ~870 commits.** Merge is a review, not a cherry-pick.
- **Remote `feat/*` still exist.** Deleting them is a repository decision, not this plan's.
- **Prettier debt (~74 files)** can fail `pre-push` independently of launcher health; reformatting is a separate decision.

## 12 - Model assignment

Classes and evidence: historical section retained in git history through 2026-10-22. Current default for this file's remaining steps:

| Step | Class | Notes |
| ---- | ----- | ----- |
| WS-A / WS-B closeout | `T1-plan` / `T3-rules` | product + installer code |
| WS-C catalog leaves | per node | see each plan's `## Model assignment` |
| WS-D single tracks | per plan | see each plan |
| WS-F owner summary | `T1-plan` | human gate |
