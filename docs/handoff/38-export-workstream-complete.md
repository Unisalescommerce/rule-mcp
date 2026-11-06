# 38: export workstream complete (Steps 0–8)

- **Branch**: `rel/v0.1.0`
- **Commit range**: `8316b219..d0eedb36` (this handoff excluded; plus closeout ADRs 199–203)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0
- **Date**: 2026-10-31

## Done

1. **WS-D export Steps 0–8 shipped on `rel/v0.1.0`.** Session map, idempotent telemetry merge, distill keep-by-default, export-owned decision-cache, `/rule-keep` + heuristics, `/rule-adr` restore, confirm-gated cleanup keep-set, tool-cache promote via existing NON_CACHEABLE rules, docs/privacy/census (EX-10).
2. **False positive fixed:** `js-*` guardrails skip non-JavaScript `fileName` (commit `7d478236`).
3. **Step 8 docs gate:** `RULE_MCP_EXPORT_KEEP_SESSIONS` documented; `docs/06-privacy.md` covers `/rule-export cleanup` hard-delete + redact alignment; DM plan points durable choices at `decision-cache.json`; README/tool-surface/census counts updated; `pnpm test:foundations` 2931 pass / 0 fail at close.
4. **Handoff closeout archived** finished plans/review/audit → ADR 190 (export plan), 200 (host), 201 (launcher), 202 (export review), 203 (export audit). `plan-of-plans.md` retargeted to those ADRs.
5. **Pending ADRs still unnumbered on trunk:** restore-rule-adr-…, host deferral, launcher PATH (land via `rule-mcp handoff land` on trunk).

## State

- Index: `docs/plans/plan-of-plans.md` (export / host / launcher rows → retired ADRs)
- Decision-models still open: `docs/plans/_decision-models.md` (durable cache = export-owned store; DM-07 must not invent a second one)
- Catalog: `docs/plans/skills/_skills-plan.md` (WS-C)
- Branch ahead of origin ~98+ (do not push unless asked)

## Left out / next

- Hook short-circuit from decision-cache remains out of scope (decision-models).
- Soft-delete / undo for sessions remains out of scope.
- Next executable work: WS-C (`skills/_skills-plan.md`) or WS-D leftovers (`_decision-models.md`, `_2026-10-01-scripts-mcp-layout.md`), then WS-F owner merge to `main`.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/38-export-workstream-complete.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Export v1 is done and archived as ADR 190 (review 202, audit 203). Host/launcher plans are ADR 191/201.
Start from docs/plans/plan-of-plans.md. Next open product tracks: skills/_skills-plan.md (WS-C),
_decision-models.md, or _2026-10-01-scripts-mcp-layout.md. Durable choices live in
~/.rule-mcp/projects/<slug>/decision-cache.json (export-owned); do not invent a second store.
Foundations were green at handoff (2931/0). Every commit is type(scope): subject. Do not push.
```
