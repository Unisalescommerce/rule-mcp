# 42: Scripts-mcp-layout complete (WS0–WS7)

- **Branch**: `rel/v0.1.0`
- **Commit range**: `aca06507`..HEAD (plan home → WS0–WS7 → ADR 196)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0
- **Date**: 2026-11-01

## Done

1. **WS0** — `rule_tool_write_plan` for durable `docs/plans/_*.md` + plan-of-plans registration; AGENTS/CLAUDE instruction block.
2. **WS1** — Red layout contract suite under `scripts/__tests__/plans/monorepo-layout.test.mjs`.
3. **WS2–WS3** — `packages/shared` (`rule-mcp-shared`) + `packages/mcp` (`rule-mcp`); root facade `rule-mcp-workspace`; `@mcp/*` alias; [removed] via `[removed]-gateway` workspace.
4. **WS4–WS5** — `packages/docs` (`rule-mcp-docs`); `tests/` → `scripts/__tests__/`; `case-studies/` → `docs/case-studies/`; foundations path/entrypoint fixes.
5. **WS6** — Dockerfile/compose `COPY packages/` + `bin/rule-mcp.js`; CI [removed] stub (`scripts/ci/ensure-[removed]-stub.sh`) + `RULE_MCP_NO_[removed]=1`; `pnpm pack --filter rule-mcp`; docs sweep.
6. **WS7** — Product ADR pending `docs/adr/231-pnpm-workspace-with-packages-mcp-shared-docs-and-publish-from-packages-mcp.md` (does not amend ADR 126); plan archived → [ADR 196](../adr/196-close-out-plan-scripts-mcp-layout.md); `pnpm census:check` + `pnpm test:all` green.

## State

- Index: `docs/plans/plan-of-plans.md` (WS-D scripts-layout done → ADR 196)
- Layout live: `packages/{mcp,shared,docs}`, `scripts/__tests__/`, `docs/case-studies/`
- Branch ahead of `origin/rel/v0.1.0` (do not push unless asked)

## Left out / next

- Number pending workspace product ADR on trunk land (`rule-mcp handoff land`).
- Other pending ADRs under `docs/adr/_pending/` stay until trunk.
- Next open single tracks: `_decision-models.md`, or skills catalog leaves.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/42-scripts-mcp-layout-complete.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Scripts-layout (WS0–WS7) is done → ADR 196. Product workspace ADR remains pending until trunk land.
Pick the next open track from plan-of-plans (decision-models or skills catalog).
Every commit is type(scope): subject. Do not push.
```
