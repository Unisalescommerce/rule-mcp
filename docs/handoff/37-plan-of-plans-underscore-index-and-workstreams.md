# 37: plan-of-plans is the sole unprefixed index, with workstreams

- **Branch**: `rel/v0.1.0`
- **Commit range**: `408da69e..8316b219` (this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0
- **Date**: 2026-10-30

## Done

1. **`docs/plans/plan-of-plans.md` rewritten as the level-0 index.** Naming rule: only this file stays unprefixed under `docs/plans/`. Snapshot dated 2026-10-30 (host 35/37, launcher phases 1–3 done, installer-scope → ADR 189). Six workstreams WS-A…WS-F with a dependency graph so execution can stay linear and conflict-free.
2. **100 subordinate plans renamed with a leading `_`** (top-level + `skills/**`), including `_skills-plan.md`. `skills/README.md` and `skills/DEPENDENCIES.md` stay unprefixed indexes.
3. **References retargeted** in ADRs, handoffs, reviews, `@see` comments, and `tests/plans/skills-plan.test.mjs` (`nodeId` strips `_` then `rule-mcp-` → `rule-`; `plan-of-plans.md` excluded from the catalog node set).
4. **Sub-plans annotated** with Notes pointing at the owning workstream (WS-A host, WS-B launcher, WS-C catalog, WS-D single tracks; superseded guardrails marked no-execution).
5. **Commit**: `8316b219` `docs(plans): make plan-of-plans the sole unprefixed index` (122 files). `tests/plans/skills-plan.test.mjs`: 9/9 pass.

## State

- Index: `docs/plans/plan-of-plans.md`
- Catalog orchestrator: `docs/plans/skills/_skills-plan.md` (WS-C)
- Next product nodes per the index: WS-A closeout (`_mcp-host-integration-depth.md`) or WS-B Phase 4 (`_stable-launcher-outside-the-checkout.md`)
- Working tree after this handoff may still carry a regenerated `docs/adr/ADR.md` from `rule_tool_handoff`

## Left out / next

- Do not reopen closed host phases or launcher phases 1–3; follow WS-A / WS-B checkboxes in the index.
- WS-C remains delegated entirely to `_skills-plan.md`.
- Historical handoffs that cite deleted plans (`oss.md`, `security.md`, …) were left as history on purpose.
- Persona-generated plans under `docs/plans/<role>.md` are outside this underscore convention (sync tooling).

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/37-plan-of-plans-underscore-index-and-workstreams.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Start from docs/plans/plan-of-plans.md: it is the only unprefixed plan and the workstream index.
Every other plan file under docs/plans/ (including skills/**) starts with _. skills/README.md and
skills/DEPENDENCIES.md are indexes, not plans.
Next executable work: WS-A (close _mcp-host-integration-depth.md, 35/37) or WS-B (launcher Phase 4
on _stable-launcher-outside-the-checkout.md). WS-C is delegated to skills/_skills-plan.md.
Catalog contract test: node --test tests/plans/skills-plan.test.mjs (9/9 green at handoff).
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message. Do not push.
```
