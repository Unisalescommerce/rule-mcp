# asd-ste100 plan

Status: `in-progress`
Notes: subordinate plan (leading `_`); coordinated by `docs/plans/plan-of-plans.md` workstream WS-G. This plan owns how the server writes prose. It does not own skill routing.

- **Role**: ASD-STE100 writing + AI plan shape
- **Date**: 2026-10-31

Mark `[x]` when a step is done. Keep one owner per file set so AI work stays linear.

## Goal

Make every markdown document this MCP server helps create **clear, direct, and easy to act on**.

**Primary directive (refine and keep):**

> Write in ASD-STE100 style at about **80%**. Prefer short sentences, active voice, one idea per sentence, and the same word for the same thing. Keep ~20% natural tone so the text does not sound robotic. Prefer concrete verbs and named artifacts over abstract nouns.

Apply that directive to:

| Surface | Examples |
| ------- | -------- |
| plans | `docs/plans/**`, persona-generated plans |
| reviews / audits | `docs/reviews/**`, `docs/audits/**` |
| ADR | `docs/adr/**`, `rule_tool_process_adr` |
| handoff | `docs/handoff/**`, `rule_tool_handoff` / `handon` |
| newsletter / release notes | process skills that emit release prose |
| comments / commit subjects | styleguide-git, comment helpers |
| impersonation | `rule_tool_impersonation`, persona bodies, plan/audit/review sync |

Also: every **development plan** the server helps create must use workstreams and tasks with a dependency graph (list + diagram) so AI-assisted execution stays linear and conflict-free.

Also: **evaluate** which tools and skills must ignore paths listed in `.gitignore` (and related ignore files), then record the allow/deny matrix and implement only what the evaluation proves.

## Out of scope

- Replace ASD-STE100 with a full licensed STE toolkit or a paid dictionary product.
- Rewrite the whole historical docs tree in one pass (migrate generators first; rewrite old files only when a step opens them).
- Change BM25 routing or decision-model math.
- Soft-delete or undo for export session cleanup.

## Dependency graph

```
WS1  writing standard (STE100 profile + shared directive)
  |
  +--> WS2  generators + impersonation (ADR, handoff, review/audit, personas)
  |
  +--> WS3  development-plan shape (WSn / WSn-Tx.y + graph list/diagram + gates)
  |
  +--> WS4  gitignore-aware tools/skills (evaluate, then implement)
  |
  +--> WS5  docs, census, verification, handoff closeout
```

Edge list:

| From | To | Kind | Why |
| ---- | -- | ---- | --- |
| WS1 | WS2 | `HARD` | generators need the shared directive before they emit prose |
| WS1 | WS3 | `HARD` | plan templates need the same writing rules |
| WS2 | WS5 | `ORDER` | census/docs follow surface changes |
| WS3 | WS5 | `ORDER` | plan-format tests and ADR 154 amendment land before closeout |
| WS4 | WS5 | `ORDER` | ignore matrix must be documented before claiming done |
| WS2 | WS3 | `CONFLICT` | both may touch plan templates / review sync — serialize |
| WS4 | WS2 | `ORDER` | prefer evaluate ignore rules before widening generator file walks |

Depends on: ADR 154 (plan format), ADR 132 (impersonation), `plan-of-plans.md` (WS-G registration)

Feeds: every generator of plans/reviews/audits/ADR/handoff/persona prose; future plan authors on this server

Shared files: `docs/plans/plan-of-plans.md`, `src/tools/actions/_impersonation.js`, `src/core/review/**`, `src/tools/handoff/**`, `src/tools/adr/**`, `src/prompts/**`, `skills/rule-styleguide-markdown/**`, `skills/rule-process-ai/**`, `tests/plans/**`, `tests/docs/review-docs/**`

## Workstreams and tasks

### WS1 — Writing standard

- [x] **WS1-T1** Define the rule-mcp ASD-STE100 profile (~80%)
  - [x] WS1-T1.1 List allowed STE100 rules we enforce (sentence length, active voice, consistent terms, no synonym churn for key nouns)
  - [x] WS1-T1.2 List soft rules (~20% natural tone): limited hedging, light rhythm variation, no slang
  - [x] WS1-T1.3 Publish the canonical directive string for prompts and skills (English technical output stays English; user chat language stays per AGENTS.md)
- [x] **WS1-T2** Place the profile where writers load it
  - [x] WS1-T2.1 Prefer one shared module or skill section (candidate: `rule-styleguide-markdown` + `rule-process-ai`) over copy-paste
  - [x] WS1-T2.2 Add failing contract tests that sample generated prose for banned patterns (em dash abuse, “utilize”, stacked hedges) once the profile exists
- [x] **WS1-T3** Gate: profile text reviewed; tests red then green; no generator wired yet

### WS2 — Generators and impersonation

- [ ] **WS2-T1** Wire the directive into `rule_tool_impersonation` and persona bodies
  - [ ] WS2-T1.1 Plan / audit / review sync templates mention the STE100~80 rule
  - [ ] WS2-T1.2 Finding and summary fields stay short and actionable
- [ ] **WS2-T2** Wire ADR + handoff writers
  - [ ] WS2-T2.1 `rule_tool_process_adr` / pending ADR bodies
  - [ ] WS2-T2.2 `rule_tool_handoff` sections and resume prompts
- [ ] **WS2-T3** Wire other markdown emitters that this server owns (newsletter/release notes, comment helpers) — only those that already exist; do not invent new products
- [ ] **WS2-T4** Gate: fixture docs from each wired path pass the WS1 contract tests

### WS3 — Development plan shape (AI-assisted, conflict-free)

Every development plan this server helps create must include:

1. **Workstreams** `WS1` … `WSn` (or `WS-A` … when the level-0 index already uses letters; new product plans prefer `WS1`…`WSn`).
2. **Tasks** `WSi-Tj` and nested `WSi-Tj.k` as needed.
3. **Dependency graph** in **two forms**: a parseable edge list (table or `Depends on:` lines) **and** a text diagram (fenced block).
4. **Ownership rule**: one workstream owns a given file set; no two open tasks write the same path without a `CONFLICT` edge and a serialize rule.
5. **Linear AI execution**: the next open task is the first checkbox whose edges are closed; agents do not invent parallel work on CONFLICT edges.

Tasks:

- [ ] **WS3-T1** Amend ADR 154 (or add a sibling ADR) for WSn / WSn-Tx.y + dual graph form
- [ ] **WS3-T2** Update plan templates used by impersonation / review sync so new plans emit this shape by default
- [ ] **WS3-T3** Extend `tests/plans/**` (and review-docs gates if needed) to require workstream headings and a diagram fence when the plan is a development plan
- [ ] **WS3-T4** Gate: a fixture plan fails without WS/task ids or without a diagram; passes with both

### WS4 — Gitignore-aware tools and skills

- [ ] **WS4-T1** Inventory: which tools walk the tree today (check, search, file-tree, handon, sync, census inputs, tokensave callers, etc.)
- [ ] **WS4-T2** Evaluate per tool/skill: must honor `.gitignore` / `.ignore` / tooling ignores; must **not** (security scans that need to see ignored secrets patterns are a special case — document explicitly)
- [ ] **WS4-T3** Record the matrix in this plan (or a short ADR) before code
- [ ] **WS4-T4** Implement only the rows marked “must honor”, with failing tests first (temp repo with ignored noise that must not appear in results)
- [ ] **WS4-T5** Gate: matrix committed; implemented rows green; undecided rows stay open or deferred with reason

### WS5 — Closeout

- [ ] **WS5-T1** Update `plan-of-plans.md` progress; census if surface counts change
- [ ] **WS5-T2** Docs accuracy / plan graph tests green
- [ ] **WS5-T3** Product ADR for the STE100~80 directive + plan-shape amendment
- [ ] **WS5-T4** Handoff when WS1–WS4 gates that we chose to ship are closed

## Kill criteria

- If STE100~80 cannot be tested without a proprietary dictionary, ship a **documented subset** of STE100 rules and keep the 80% label honest.
- If dual graph form (list + diagram) breaks ADR 154 parsers, amend the parser with tests — do not drop the diagram requirement.
- If gitignore evaluation finds no safe default, ship the matrix as `evaluate-only` and leave implementation deferred.

## Model assignment

| Step | Class | Why |
| ---- | ----- | --- |
| WS1 profile + directive | `T1-plan` | product language |
| WS2 / WS3 / WS4 code | `T3-rules` | generators, tests, ignore filters |
| WS5 ADR + handoff | `T1-plan` | closeout prose |

Plan default: `T3-rules`. Fallback: `step-5-preview` for authoring, `glm-5.3-flash` for bulk edits.
