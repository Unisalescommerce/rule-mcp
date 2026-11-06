# 43: Plan closeout automation

- **Branch**: `rel/v0.1.0`
- **Commit range**: `f20e7312`..HEAD (closeout automation → first live sweep → ADRs 206-208)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-02

## Done

1. **Closeout runs on close** — `rule_tool_handoff` and `rule_tool_handon` archive completed working papers by default and repair ADR numbering. `closeout: false` stays read-only; `closeout: "preview"` lists prospective ADR numbers and writes nothing (a boolean union on the existing parameter, not a new tool).
2. **Completeness rule** — a paper is archivable only with `Status:` in `done|complete|completed|closed`, at least one closed checkbox and zero open ones, fenced blocks ignored. `plan-of-plans.md`, `README.md` and `DEPENDENCIES.md` are never archivable.
3. **One ADR per plan** — the ADR carries `## Outcome` with the closed steps and ends with `## What would end this`. The session handoff cites it (ADR 163); no per-plan handoff file is created.
4. **Index retirement** — `_plan-index.js`, `_plan-index-lines.js` and `_plan-index-shape.js` retire snapshot rows, workstream checkboxes (description kept), graph leaves, Plan/Orchestrator links and `_skills-plan.md` progress rows. Matching is conservative on line shape and idempotent on a second run.
5. **File split** — `_closeout.js` is a three-line barrel over `_closeout-scan.js`, `_closeout-archive.js` and `_closeout-docs.js`, inside the 150-line cap and its ratchet.
6. **Census** — the tool renderer prints `anyOf`/`oneOf`/`const` unions (`boolean \`preview\``) instead of `any`; `docs/10-tools.md` and `scripts/__tests__/fixtures/census.json` regenerated.
7. **Instructions** — the plan-lifecycle note went into `AGENTS.md` only; `CLAUDE.md` stays byte-identical to the installer's `RULES_BLOCK` because a static test enforces it.
8. **Gates** — `pnpm test:all` 2971 pass, 0 fail, 3 skip; `rule_tool_check` mode project 6/7 (graph check skipped, tokensave unavailable for the project run); `pnpm census:check` current.
9. **First live sweep** — cargo-release, npm-release and uv-release plans retired as ADRs 206, 207 and 208; the three sources are deleted; `_skills-plan.md` rows read `retired`; `plan-of-plans.md` rows point at the new ADRs.

## State

- `rule_tool_git` audit: base `main`, merge base `325936e6`, range `325936e6..HEAD`, 443 feature commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- Working tree clean; branch ahead of its remote, nothing pushed.
- 12 pending ADRs under `docs/adr/_pending/`, including the workspace product ADR.
- Closeout applies to plans, audits and reviews; the plan case is the one exercised end to end.

## Left out / next

- `docs/plans/_plan-of-plans-reference.md` still carries 8 open boxes while ADR 162 declared it deleted. It is therefore not archivable. Flagged, not fixed.
- A plan whose prose is not English is skipped forever by the ADR English gate. Behavior unchanged and documented.
- `docs/02-architecture.md` ADR counts still need the repo-side `pnpm census`; the MCP tool cannot regenerate them.
- Snapshot prose such as `in progress: npm/uv/cargo-release done` matched no retirement shape and was edited by hand this session: a candidate line shape for the sweep.
- Next open tracks: `_decision-models.md`, or the skills catalog stages in `_skills-plan.md`.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/43-plan-closeout-automation.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Plan closeout is automated: a completed plan becomes one ADR with an ## Outcome section, its source file is deleted, and its lines retire from the plan indexes. Preview with rule_tool_handoff closeout: "preview".
First step: pick the next open track from plan-of-plans (_decision-models.md or the skills catalog), or close the feature (443 commits, 2 merge commits) with --close-feature --squash.
Every commit is type(scope): subject. Do not push.
```
