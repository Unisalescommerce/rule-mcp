# plan-of-plans - level-0 orchestration on `rel/v0.1.0`

Status: `in-progress`. This is the level-0 orchestrator of the work that lives in this branch: it names the plans, the order they can run in, and the node to execute next. It plans no skill, and it never touches `main`.

Format: the contract of ADR 154 (status line, `## Dependency graph`, checkbox steps), in its **four-line in-branch form**. The six-line cross-branch variant is gone with the branches: `Branch:` and `Path:` had one possible value each, and a field nobody can get wrong is a field that documents nothing (ADR 181).

Topology (2026-10-25): **`rel/v0.1.0` is where the work is.** Every commit of every stage lands here. `main` is out of scope - the release line diverged from it, and the owner opens the merge request when the catalog is ready. The five `feat/*` branches this file was written around are remote history, and their content is already in this tree (section 1).

## 1 - The branches that were, and the one that is

Measured on 2026-10-25, from `rel/v0.1.0`:

| Ref                           | Local  | Reachable from HEAD | What it is today                                                                                  |
| ----------------------------- | ------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| `rel/v0.1.0`                  | yes    | -                   | the only working branch                                                                           |
| `main`                        | yes    | **no** (870)        | out of scope: the release line diverged; the owner opens the merge request                        |
| `feat/evolution`              | **no** | -                   | the graph's destination. It does not exist, locally or as a remote, so no stage can merge into it |
| `origin/feat/guardrails`      | no     | no (150)            | its content is here: 87 plan nodes, ADR 151-154, `skills-plan.md`                                 |
| `origin/feat/decision-models` | no     | no (932)            | folded into `ge` in stage 1; no unique content left                                               |
| `origin/feat/export`          | no     | **yes**             | content here: `docs/plans/export.md`                                                              |
| `origin/feat/nyx`             | no     | no (875)            | content here: `docs/plans/2026-10-01-scripts-mcp-layout.md`                                       |

The counts are not a backlog. A branch that diverged before the release line has commits HEAD does not reach, which is not the same as work missing from the tree - and the tree is what decides: the plans, the ADRs, the skills and the evidence the graph was written to merge are all here.

### The 2026-10-21 measurement, kept as the record

This is what motivated stages 1-5, not what anyone executes today:

| Branch                             | Commits ahead of the common base | Plan files |       Unique plan paths | Contended with `ge` |
| ---------------------------------- | -------------------------------: | ---------: | ----------------------: | ------------------: |
| `feat/evolution` (the destination) |                                5 |          2 |                       2 |                   - |
| `feat/guardrails` (`ge`)           |                               97 |         97 | 95 plans plus 2 indexes |                   - |
| `feat/decision-models` (`dm`)      |                               66 |         45 |                       1 |       **233 files** |
| `feat/export` (`ex`)               |                                8 |          3 |                       1 |             3 files |
| `feat/nyx` (`nyx`)                 |                                9 |          3 |                       1 |              1 file |

Totals: 150 plan-file instances, 102 unique plan paths. After stage 1 (2026-10-22): `ge` carried 98 files under `docs/plans` and `dm` carried none, because 44 of 44 shared plans diverged and `ge`'s versions superseded all of them.

Reference for the retired layer: [`plan-of-plans-reference.md`](plan-of-plans-reference.md) - the audit that asked whether the graph allowed a linear implementation, with its findings and their resolution. `Status: done`, kept as history.

## 2 - What this file is not

`docs/plans/skills/skills-plan.md` is the level-1 orchestrator of the catalog: 87 nodes, stages 0-10, edge taxonomy, ten precedence policies, human gates, ADR 153/154 behind it. This file **delegates to it** for anything that is a skill plan, and does not restate its order.

The hierarchy has one rule: **every group of more than one plan gets an orchestrator, and this file names it or says why not.**

| Group                                                     | Orchestrator                        | State                                                                   |
| --------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| the skills catalog (84 leaves, 10 routers, 1 cross-skill) | `docs/plans/skills/skills-plan.md`  | in progress: 3 nodes done (`rule-process-npm/uv/cargo-release`)         |
| installer and host integration (2 plans)                  | this file, stage 9                  | `installer-scope-adr-policy-features` then `mcp-host-integration-depth` |
| repository policy, OSS and release duties                 | retired into ADR 135 and handoff 27 | closed                                                                  |
| single-document tracks                                    | their own `## Dependency graph`     | `export.md`, `2026-10-01-scripts-mcp-layout.md`, `decision-models.md`   |

## 3 - Nodes: one level

**87 skill nodes** (counted by `tests/plans/skills-plan.test.mjs`) plus **five documents tracked on their own**, which are not nodes and are named in the table above: `export.md`, `2026-10-01-scripts-mcp-layout.md`, `decision-models.md`, `installer-scope-adr-policy-features.md`, `mcp-host-integration-depth.md`. Six area plans are `superseded` into their leaf plans and are not nodes either.

Every node carries four parseable lines in its own plan:

```
Status: planned
Depends on: rule-process-ai (HARD), rule-mcp-process-npm-release#1 (CONTRACT)
Feeds: rule-process (HARD)
Shared files: tests/fixtures/guardrail-corpus.mjs
```

A `CONTRACT` edge names the exporting phase (`id#2`), which is why a contract may point at a plan in the same stage: the phase closes first, not the plan.

## 4 - Edges

Four kinds, all of them within this branch:

| Kind       | Meaning                                        | Executor rule       |
| ---------- | ---------------------------------------------- | ------------------- |
| `HARD`     | B cannot start before A is closed              | block               |
| `ORDER`    | B can start, but after A avoids churn          | warn                |
| `CONFLICT` | A and B edit the same shared file              | serialize           |
| `CONTRACT` | A exports a surface B consumes, named by phase | block on that phase |

Four more existed for the cross-branch layer and are retired with it (ADR 181): `MERGE` (a branch had to enter `feat/evolution`), `REBASE` (two branches touched one path), `DIVERGENCE` (one path, two contents), `SUPERSEDES` (a plan replaced another across branches). They are kept here so a document that cites them still reads; nothing uses them now.

## 5 - The graph

```
main ................................ out of scope (the owner's merge request)
rel/v0.1.0
├── skills-plan.md ................. the catalog, 87 nodes, 3 done
│   ├── stages 0a, 0b .............. the prose rules, the ADR record format
│   ├── stages 1-6 ................. 84 leaves plus 10 routers, per skills-plan
│   └── stage 10 ................... the area routers
├── installer-scope-adr-policy-features  (tracked on its own, planned)
│   └── --HARD--> mcp-host-integration-depth  (Phase 1 and later; Phase 0 does not wait)
├── export.md, 2026-10-01-scripts-mcp-layout.md, decision-models.md  (independent)
└── this file ...................... the order between the groups above
```

Edges spelled out:

| From                                  | To                           | Kind    | Why                                                                                                                  |
| ------------------------------------- | ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `installer-scope-adr-policy-features` | `mcp-host-integration-depth` | `HARD`  | the port plan writes the host path table the host records consume; Phase 1 divides 23 modules over it                |
| `skills-plan.md`'s catalog            | `mcp-host-integration-depth` | `ORDER` | the catalog is the surface the installer exposes; a host level installed against a moving catalog is re-tested twice |
| `skills-plan.md`'s catalog            | this file                    | `ORDER` | three release nodes are done; the rest order themselves inside their own orchestrator                                |

## 6 - Protocol: how the agent picks the next node

1. Read section 7 and take the first node whose edges are closed. If it is a skill plan, the order is inside `skills-plan.md`, not here.
2. Work on `rel/v0.1.0`. There is nowhere to switch to, and a node is never implemented on a branch that does not hold it.
3. Work the node's own phases, in order, closing its checkboxes as they complete.
4. Run the node's gates plus the shared ones in section 9.
5. Commit on `rel/v0.1.0`, `type(scope): subject`, docs in their own commit, never push.
6. Update the node's row here (or in `skills-plan.md` when the node is a skill) before taking the next one.

A node that cannot be finished is marked `blocked` with the edge that blocks it, never moved to another group.

## 7 - Stages

### Stage 0 - Project policy decisions (prerequisite to everything else) - done 2026-10-22

The five public commitments are decided in ADR 135: signed release tags with the Ed25519 key at `.github/release-signing-key.asc`; the `0.1.x` line supported until `1.0.0`; BDFL recusal and GitHub Trust & Safety as the escalation channel; GitHub Sponsors with an annual aggregate and no donor identities; `inbound = outbound MIT` with the DCO as provenance certification only.

The eight OSS findings closed with them: OSS-01 unsigned tags (a `git verify-tag` gate in `release.yml`), OSS-02 the support table (aligned with `package.json` and `server.json`), OSS-03 the appeal route (independent contact and confidential channel), OSS-04 response targets (2 and 7 business days), OSS-05 local lint and census on a clean tree, OSS-06 the funding cadence, OSS-07 the DCO wording, OSS-08 README policy links. Each has its own test in `tests/docs/` and `tests/release/`.

- [x] All five decisions recorded (ADR 135), and every OSS finding closed with a test.

### Stage 1 - Fold `dm` - done 2026-10-22

- [x] 45 plan paths deleted from `dm`, `decision-models.md` moved to `ge`, the audit/review/probe harness moved with it.
- [x] `feat/decision-models` retired as a plan owner: it carries no plan file.

### Stage 2 - Retrofit `ex` and `nyx` - done 2026-10-22

- [x] `export.md` and `2026-10-01-scripts-mcp-layout.md` gained the graph lines and their own `## Dependency graph`.
- [x] Both are present on this branch, which is what the retrofit was waiting for.

### Stages 3, 4, 5 - The merges into `feat/evolution` - retired 2026-10-25

- [x] Recorded as retired rather than done: `feat/evolution` does not exist, and the content these three stages would have merged is already in this tree (section 1).
- [x] Nothing is rebased and nothing is merged. The remote `feat/*` refs are left untouched; deleting them is a repository decision, not this plan's.

### Stage 6 - Hand over to the owner

- [ ] The owner opens the merge request to `main`. No stage reads or writes `main`, and this file does not rebase onto it: the release line diverged 870 commits ago, which makes the merge a review question, not a cherry-pick.

### Stage 7 - Bring the format to every plan

- [x] The contract exists (ADR 154) and every one of the 87 nodes carries the status line, the graph section and checkboxes.
- [ ] Two assertions of `tests/plans/skills-plan.test.mjs` are red for one reason: plan files are named `rule-mcp-<skill>.md` while the stage tables list `<skill>`, so the test's node id never matches. One sweep fixes it - either rename the files or widen the id in the test - and the choice is the owner's.

### Stage 8 - The catalog's remaining leaves

- [ ] Delegated: open `docs/plans/skills/skills-plan.md`, take the first node whose edges are closed in the current stage. Three nodes are done (npm, uv and cargo release, all 20/20 or 19/19); the rest carry their own phases and gates.

### Stage 9 - The installer track (next)

- [ ] `installer-scope-adr-policy-features.md`: the port of ADR policy, project-scope installs, features, host paths and the wizard. Its step 3 (`_hosts.data.js`, one table read by install, uninstall and detection) is what the host plan's Phase 1 consumes.
- [ ] `mcp-host-integration-depth.md` Phase 0: 31 evidence rows with a status and a source, the Roo Code and Codex-prompt contradictions resolved, the eight products with no installer row registered. **This is the next node: it is unblocked today**, because only Phase 1 and later wait on the port plan.
- [ ] Then Phase 1 of the host plan, once the port plan's host table exists.

## 8 - Shared files inside this branch

Everything here is one branch, so these are the files two plans may not edit at the same time:

| File                                                                                                                              | Who touches it                            | Resolution                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `tests/fixtures/guardrail-corpus.mjs`                                                                                             | every plan that adds a rule               | append-only, one plan at a time                                                            |
| `tests/fixtures/census.json`                                                                                                      | any plan whose change reaches the surface | `pnpm census`, never by hand                                                               |
| `docs/02-architecture.md`, `docs/09-skills.md`, `docs/10-tools.md`, `docs/16-resources.md`, `docs/17-surface-map.md`, `README.md` | the same                                  | regenerated by census; `README.md` by hand, checked by `tests/docs/docs-accuracy.test.mjs` |
| `docs/adr/ADR.md` and ADR numbering                                                                                               | every plan that writes an ADR             | one allocator: `rule_tool_process_adr`, numbers taken on landing                           |
| `docs/handoff/HANDOFF.md`                                                                                                         | every session that writes a handoff       | regenerate the index, never edit it                                                        |
| `skills/rule-process/SKILL.md`                                                                                                    | every plan that adds a process skill      | one row per skill, one plan at a time                                                      |

## 9 - Gates

Automatic on every node: the corpus and router suites, `census:check`, lint, and the node's own verification section.

Human, and only there:

| Gate                               | Where                                       | Why                                                    |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Anything that touches `main`       | nowhere in this plan                        | the owner opens the merge request                      |
| Generated documents                | any change to `census.json` or `docs/0*.md` | a hand-edited generated file is a lie the test catches |
| Destructive plans                  | ADR 151/152 removals, the `dm` fold (done)  | one-way in review terms                                |
| Any commit that changes this graph | this file                                   | the graph is the contract                              |

## 10 - Verification

The cross-branch test (`tests/plans/plan-of-plans.test.mjs`) lived on the retired destination branch and does not exist here. What verifies this file now:

- `tests/plans/skills-plan.test.mjs` over the 87 nodes: 7 of 9 assertions green, the two red ones are Stage 7's single finding.
- `pnpm census:check` for the generated documents, `tests/docs/docs-accuracy.test.mjs` for the README counts.
- The stage tables and this file's section 7 agree on which group owns which plan; a change to one without the other is the one drift no test catches, so it is the gate above.

## Dependency graph

Depends on: nothing. This is the level-0 node: it waits only on the decisions already recorded (ADR 154 for the format, ADR 181 for the retirement of the cross-branch layer, ADR 153 for the catalog's edge model) and on the branch state measured in section 1.

Feeds: every node in the tree, `skills-plan.md`'s stage 8 delegation, and the installer track in stage 9.

Shared files: `docs/plans/plan-of-plans.md` only. The generated documents in section 8 belong to the nodes that touch them, not to this file.

## 12 - Open notes and risks

- **The historical stages stay in the file.** Stages 0-2 are records with their commit and test evidence, and stages 3-5 say "retired" in their own headings so a reader cannot mistake them for work. Deleting them would lose the only evidence that the fold happened and why.
- **The two red assertions are one finding, not two.** A plan file is named `rule-mcp-process-adr.md` while the stage table lists `rule-process-adr`, so the test's node id matches nothing. Any new node inherits the mismatch until the sweep in Stage 7.
- **`main` diverged 870 commits ago.** This is why nothing here rebases onto it: the merge is the owner's review, and the release line is the tree the catalog was built in.
- **The remote `feat/*` branches still exist.** They are 150, 932 and 875 commits away from HEAD and carry no content this tree lacks. Deleting them is a repository decision and is deliberately not taken here.
- **Two merge commits remain in the range** (`e9d29e8e`, `df6ba117`). `rule_tool_git action=linearize force=true` is the proposal; it needs the owner's confirmation and is not part of any stage.
- **The census under-reports guardrails.** It counts 9 distinct rules while the tree carries roughly 100 skill-owned ones, because it reads the engine's own families. Recorded by the three release plans, not fixed here.

## 13 - Fixes the review requires before the first node

From `docs/reviews/plan-graph.md`. All of them were resolved on the branch that
became this tree (`3553780c` test, `6cda42ea` fix) and are kept as the record of
what the retrofit required. Nothing here is open.

- [x] F1 - every plan carries a `## Dependency graph` section: 92 files
      retrofitted, checked by `tests/plans/skills-plan.test.mjs`.
- [x] F2 - the same-stage edge is gone: stages split into `0a/0b`, `3a/3b`,
      `7a/7b`, and a `CONTRACT` edge is exempt because a phase closes first.
- [x] F3 - `rule-toolchain-electron` and `rule-toolchain-tauri` have their own
      plans (index #86, #87) as Stage 4 nodes.
- [x] F4 - one id per node: `rule-process-bmad`, with `Produces: rule-method`.
- [x] F5 - ADR 154 amended in place: four lines inside a branch, six in a
      cross-branch document.
- [x] F8 - the five-value status line on all 95 plan files, original wording on
      the `Notes:` line.
- [x] F9 - `installer-scope-adr-policy-features.md` has its step; the three
      non-skill plans stay in scope of the checkbox assertion.
- [x] Stage lists - a table per stage, 85 nodes, counts summed by the test
      instead of asserted.
- [x] F6 - one contended-file list (section 8), referenced by `skills-plan.md`.
- [x] F7 - the unique path count is 99, not 98.

One finding came out of the fix work and is not resolved: the sync guard prepends
a `⚠️ Base branch ... advanced` banner as the first content item, and six tests
read `content[0]` or `content[1]`. They pass in a detached worktree and fail in
a checkout whose base advanced. It needs a decision - change the banner position
and its contract test, or give every affected test a shared reader - and it is
not part of this graph.

## 14 - Task classes and model assignment

Every plan in every branch carries a `## Model assignment` section that maps its
own steps to one of these classes. This is the taxonomy those sections cite, so
a plan can be executed without re-deciding which model to reach for.

**Pool:** the models this pi instance can reach, minus OpenAI and Anthropic
families (excluded by decision, including those served through other providers).
Evidence gathered 2026-10-22 from three sources, cited per claim:

- **Artificial Analysis** model leaderboard: intelligence index, price per 1M
  tokens, output speed in tokens/s.
- **Arena (LMArena)** Agent leaderboard: share of head-to-head wins, plus its
  cost-per-task Pareto frontier.
- **Aider polyglot** leaderboard: percentage of edits applied correctly, which is
  the closest public measure of "can it change a file without breaking it".

### The classes

| Class       | Task                                                               | Model                      | Why, from the evidence                                                                                                                                              |
| ----------- | ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T1-plan`   | Planning, architecture, ADRs, prose that argues                    | `gemini-4-argon` (high)    | Arena Agent #6 overall and AA index 53 at $1.99; the Google family leads public edit-format compliance (Gemini 2.5 Pro 83.1% on Aider, the best non-excluded score) |
| `T2-git`    | Cross-branch work: fold, rebase, merge resolution                  | `grok-4.7` (xhigh)         | AA index 46 with 500k context; Grok 4 scored 79.6% on Aider, the strongest agentic-coding family outside the excluded two                                           |
| `T3-rules`  | Guardrail rules: small deterministic code, regex, engine contracts | `kimi-k2.7-code`           | A code-tuned family (Kimi K2: 59.1% Aider at $1.24) at $0.54 per 1M; the cheap end of the code-correctness range                                                    |
| `T4-tests`  | Test writing: node:test suites, fixtures, assertions               | `deepseek-v4.1-flash`      | AA index 45 at **$0.26** and 206 tokens/s; DeepSeek's reasoning line scored 74.2% on Aider at a tenth of the frontier price                                         |
| `T5-bulk`   | Mechanical edits at scale: retrofits, renames, regeneration        | `minimax-m3.1-flash`       | AA index 43 at $0.22, 93 tokens/s, 1M context; MiMo-V2.6-Flash ($0.06) is the cheaper alternate and sits on the Arena cost/task Pareto                              |
| `T6-review` | Audits, contradiction hunting, evidence measurement                | `muse-wonder-full` (max)   | AA index **56**, the highest reachable score, with a 1M context window; Arena Agent #7                                                                              |
| `T7-author` | Skill bodies: framework content, references, prose trimming        | `qwen3.8-max`              | AA index 45 with the broadest framework knowledge of the pool (Qwen3-235B: 59.6% Aider)                                                                             |
| `T8-verify` | Verification loops, gate runs, small format fixes                  | `gemini-3.8-flash` (high)  | AA index 41 at $1.24 with 137 tokens/s: fast enough to re-run a gate loop without waiting                                                                           |
| `T9-local`  | Offline checks with no network                                     | `llama.cpp/Laya-GGUF:Q8_0` | The only local model served here; use it for trivial mechanical reads, never for judgment                                                                           |

Two alternates worth naming because the pool is deep: `step-5-preview` (AA 44,
$1.03, 95 tokens/s) for `T7` when Qwen is unavailable, and `glm-5.3-flash`
(AA 42, $0.28) for `T5` when MiniMax is.

### How a plan uses this

Each plan's `## Model assignment` section lists its own phases against these
classes, with the model and one line of reasoning, and names a fallback. A step
that mixes classes takes the class of its **riskier** half: a rule implementation
that also writes prose is `T3-rules`, not `T7-author`.

The classes are about the work, not the file: the same `T4-tests` step in a
frontend plan and a data plan gets the same model, because the work is the same
and the evidence does not distinguish them.

## 15 - Model assignment

| Step in this plan                            | Class       | Model                    | Why                                                                                |
| -------------------------------------------- | ----------- | ------------------------ | ---------------------------------------------------------------------------------- |
| Stage 0 - policy decisions                   | `T1-plan`   | `gemini-4-argon` (high)  | five public commitments argued from evidence; needs long context and careful prose |
| Stage 0 - OSS-01/02/07 code and config edits | `T3-rules`  | `kimi-k2.7-code`         | workflow gates, SECURITY.md tables, DCO wording: small precise edits               |
| Stage 1 - fold `dm`                          | `T2-git`    | `grok-4.7` (xhigh)       | skip a cherry-pick, move a track, delete 45 files, retire a branch: git judgment   |
| Stage 2 - retrofit `ex` and `nyx`            | `T5-bulk`   | `minimax-m3.1-flash`     | the same section added to a handful of files                                       |
| Stages 3-5 - merges and rebases (retired)    | `T2-git`    | `grok-4.7` (xhigh)       | kept as the record of what the stages would have cost; ADR 181 retired them        |
| Stage 6 - hand over to the owner             | `T1-plan`   | `gemini-4-argon` (high)  | a status summary the owner reads before opening the merge request                  |
| Stage 7 - format across every plan           | `T5-bulk`   | `minimax-m3.1-flash`     | mechanical, 87 files, checked by the test                                          |
| Stage 8 - the catalog's remaining leaves     | per node    | see each plan            | delegated to `skills-plan.md`, which orders them                                   |
| Stage 9 - the installer track                | `T1-plan`   | `gemini-4-argon` (high)  | 31 host evidence rows and the level ladder argued from sources                     |
| Section 14 - keep the evidence current       | `T6-review` | `muse-wonder-full` (max) | re-reading three leaderboards and re-deriving the mapping                          |

Fallback: if `muse-wonder-full` is unreachable, `glm-5.3` (max) is the next
highest allowed index at 45, and it is on the Arena open-model trend list.

## 16 - Plans written after this graph (2026-10-25)

This section is a register, not a node. The stages above are the 2026-10-21
measurement and they stay as they were; the plans below were written later, on
`rel/v0.1.0`, and they are tracked where each one says it is tracked.

| Plan                                               | Subject                                                                                   | Tracked by                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `skills/process/rule-mcp-process-cargo-release.md` | the release skill for a Rust crate: a token that cannot be removed, so the rules bound it | `skills/skills-plan.md`, stage 2, node #88                     |
| `skills/process/rule-mcp-process-uv-release.md`    | the release skill for a Python package managed with `uv` and PyPI Trusted Publishing      | `skills/skills-plan.md`, stage 2, node #89                     |
| `mcp-host-integration-depth.md`                    | per-host integration levels `L0..L4`, the install/uninstall split, the server↔host wiring | itself, outside the skills graph, section 9 of the skills plan |

Why the first two are not stages here: they are skill nodes, and the skills plan
owns their ordering. The third has since become Stage 9 of this file, which is
what ADR 181 changed - this file used to order branches, and it now orders the
groups that no other orchestrator covers. The register stays as the dated
answer to _"is there a plan I have not seen?"_ until a plan exists that neither
section 2 nor this table names.

Two things the 2026-10-25 session measured that the earlier stages do not know
about, and that the plans above own:

- the installer carries four registries (23 agents, 15 command targets, 13
  documented command gaps, 15 hook hosts of which 5 are writable) that do not
  agree with each other, and an uninstall that removes less than the install
  wrote;
- the spike in `docs/spike/Slash-Commands-MCP-Complete-Obsidian/` measures 32
  host notes, 8 of whose products have no installer row at all.
