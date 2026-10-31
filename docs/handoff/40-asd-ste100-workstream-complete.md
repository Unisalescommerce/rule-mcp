# 40: ASD-STE100 workstream complete (WS-G)

- **Branch**: `rel/v0.1.0`
- **Commit range**: `a3ec1ad1`..HEAD (plan → WS1–WS5 → ADR 204)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0
- **Date**: 2026-10-31

## Done

1. **WS1** — Shared STE100~80 profile in `src/core/directive` (`WRITING_DIRECTIVE` / `STE100_ANCHOR`).
2. **WS2** — Wired into impersonation, personas, ADR/handoff writers, and related skill surfaces.
3. **WS3** — Development-plan shape `WSn` / `WSn-Tx.y` + dual dependency graph; ADR 154 amended; scanner in `src/core/plans/_shape.js`.
4. **WS4** — Gitignore matrix in the retired plan; `src/core/ignore` + file-tree honors `.gitignore` via `git check-ignore`. Tokensave / census / security deferred or must-not.
5. **WS5** — Census current; product ADR pending `docs/adr/_pending/mcp-authored-markdown-uses-asd-ste100-at-about-80-percent.md`; plan archived → [ADR 204](../adr/204-close-out-plan-asd-ste100.md).
6. Golden shape fixture moved to `tests/fixtures/plans/development-shape-golden.md` (live plan file deleted by closeout).

## State

- Index: `docs/plans/plan-of-plans.md` (WS-G done → ADR 204)
- Runtime: `src/core/directive`, `src/core/plans/_shape.js`, `src/core/ignore`
- Branch ahead of origin (do not push unless asked)

## Left out / next

- Number the pending STE100 product ADR on trunk land (`rule-mcp handoff land`).
- Do not fork tokensave ignore policy here; revisit when graph ownership allows.
- Next open single tracks: `_2026-10-01-scripts-mcp-layout.md`, `_decision-models.md`, or skills catalog leaves.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/40-asd-ste100-workstream-complete.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
WS-G (ASD-STE100) is done → ADR 204. Product ADR remains pending until trunk land.
Pick the next open track from plan-of-plans (scripts-layout, decision-models, or skills catalog).
Every commit is type(scope): subject. Do not push.
```
