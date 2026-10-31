# 41: Scripts-layout ready — plan home in docs/plans

- **Branch**: `rel/v0.1.0`
- **Commit range**: `1082c215`..HEAD (no new code this session; planning only)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in long range: 2
- **Date**: 2026-10-31

## Session outcome

ASD-STE100 (WS-G) was already closed → [ADR 204](../adr/204-close-out-plan-asd-ste100.md); handoff [40](40-asd-ste100-workstream-complete.md).

This session planned **scripts-layout** (full monorepo) and fixed where durable plans must live.

### Decisions (locked)

1. **Full monorepo now** on `rel/v0.1.0` (ADR 181). Do not create `refactor/packages-mcp-[removed]-workspace`.
2. **Rename/replace** `docs/plans/_2026-10-01-scripts-mcp-layout.md` → `docs/plans/_scripts-mcp-layout.md` with executable WS0–WS7 body; update `plan-of-plans.md`.
3. **Plan home**: host CreatePlan writes only to `~/.local/share/opencode/plans/` (session UI). Source of truth for this repo is `docs/plans/_*.md` registered in `plan-of-plans.md`. MCP cannot patch Cursor CreatePlan; ship an MCP plan-writer that materializes `_*.md` + index rows, and instruct agents to use it (CreatePlan host file is not durable).
4. Structural task already declared via `rule_tool_structural` (first write asks one confirmation).

### Monorepo shape (unchanged from product plan)

| Piece | Value |
| ----- | ----- |
| Root | `rule-mcp-workspace` (`private: true`) |
| Packages | `rule-mcp`, `rule-mcp-shared`, `rule-mcp-docs` |
| Shared IN | `src/shared` + `src/utils` → `packages/shared` (+ `utils/`), no shim |
| Alias | `@src/*` → `@mcp/*`; hook → `packages/mcp/` |
| [removed] | workspace `../[removed]`; specifier `[removed]-gateway/mcp`; CI stub + `RULE_MCP_NO_[removed]=1` if sibling missing |
| Relocate | `tests/` → `scripts/__tests__/`; `case-studies/` → `docs/case-studies/` |
| Publish | `pnpm pack --filter rule-mcp` from `packages/mcp` |

### Workstreams to execute next

- **WS0** (HARD first): MCP plan-writer → `docs/plans/_<slug>.md` + `plan-of-plans` patch; AGENTS/CLAUDE instructions; TDD. Before any `git mv src`.
- **Authoring**: write `_scripts-mcp-layout.md`, delete Oct-1 file, update index (may land with WS0 or as first docs commit).
- **WS1–WS7**: layout contract tests → shared+mcp → docs package → relocate tests/case-studies → Docker/CI/pack sweep → ADR + census + handoff.

Host session plans (ephemeral, not source of truth):

- `~/.local/share/opencode/plans/1793468638739-scripts-monorepo-layout.md`
- `~/.local/share/opencode/plans/1793469085976-scripts-layout-docs-plans.md`

## State

- Working tree clean at handoff start; branch ahead of `origin/rel/v0.1.0` (~108). Do not push.
- Open single tracks also include `_decision-models.md` and skills catalog leaves — scripts-layout is the chosen next track.
- Pending STE100 product ADR still under `docs/adr/_pending/` until trunk land.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/41-scripts-layout-plan-home-ready.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
WS-G (ASD-STE100) is done → ADR 204.
Next: scripts-layout. First step: author docs/plans/_scripts-mcp-layout.md (replace _2026-10-01-scripts-mcp-layout.md), update plan-of-plans, then WS0 MCP plan-writer (TDD) so durable plans land in docs/plans/_*.md — host CreatePlan under ~/.local/share/opencode/plans/ is not the source of truth. Then full monorepo WS1–WS7 on this branch.
Every commit is type(scope): subject. Do not push.
```
