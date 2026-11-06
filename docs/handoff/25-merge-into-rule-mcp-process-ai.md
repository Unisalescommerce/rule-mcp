# 25 - Merge of three skills into rule-process-ai

- **Branch**: `feat/guardrails-evolution`
- **Date**: 2026-10-21
- **Commit range**: `6b540b66..HEAD`
- **Plans**: `docs/plans/skills/DEPENDENCIES.md`, `docs/plans/skills/process/_rule-mcp-process-ai.md`

## What this session did

Three skills folded into `rule-process-ai`, with their nine guardrails, their plans
and their index rows collapsing into one, and dependency graph that puts that
skill first. Before that, twelve red gates were closed: tracked governance
hooks were restored, `site-dist` stopped being tracked, and machine-wide
`core.hooksPath` can no longer be adopted by installer. One gate remains
red, 150-line ratchet over five pre-existing files.

decision-models audit, review, plan and probe harness moved to
`feat/decision-models` so this branch keeps guardrails and skill-plan track.

### What the merge cost

Moving body into `references/` removes it from text ranker indexes. The
routing corpus fell from 77 to 71 exact and scope prompt lost its top route
until scope contract and house language were restated in `SKILL.md`. The
corpus is back to 76 exact and 89 top-or-alternative, above its floors.

### Commits (merge thread)

- `605f6f15` docs(plans): add rule-process-tdd implementation plan
- `bca072ab` chore(docs): stop tracking generated site
- `2956e5c3` fix(commit): never adopt machine-wide core.hooksPath
- `e05fb191` fix(hooks): restore tracked governance hooks
- `d1c34b8f` feat(skills): merge simplicity, English and fingerprint into rule-process-ai
- `7ad3a593` test(skills): guard that every area router lists its children
- `e9d4c945` docs(plans): one plan for rule-process-ai and next two skills
- `71a3d906` docs(adr): record merge into rule-process-ai

### Open, recorded in the plans

- `rule-process-ai` Phase 1-4: eight guardrails absorbed plans promised and
  never built (`ai-bidi-controls` blocking, seven advisory), `-ogue` stem fix,
  spelling-map gaps, and reduction signal still undocumented.
- `rule-process-npm-release`: eight rules planned, none written, and cooldown
  handed to `rule-toolchain-pnpm` beside `pkg-*`.
- `rule-process-code-review`: four rules planned, and three of them overlap what
  `validateTrio` already checks in this repository.
- Eight router rows are missing and recorded in `scripts/data/router-gaps.data.mjs`;
  ratchet only shrinks.
- Decision-models workstreams: resume on `feat/decision-models`.

### Resume Prompt

This document: `docs/handoff/24-merge-into-rule-process-ai.md`.

```prompt
Resume work on rule-mcp from `docs/handoff/24-merge-into-rule-process-ai.md`. Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The ADR log and the context snapshot capture what has been decided; do not re-ask answered questions. ADR 140 records the merge, and ADR 139 the hooks boundary.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message, and `pnpm hooks:check` says whether the hooks are installed.
The merged skill is `rule-process-ai` with nine `ai-*` guardrails and the tool `rule_tool_process_ai`; the three skills it absorbed no longer exist, and a running server needs a restart before it serves the new catalog.
Decision-models (audit, plan, harness) live on `feat/decision-models`.
First step: run `pnpm test:all` and confirm the only red gate is the 150-line ratchet over five pre-existing files, then start `rule-process-changelog` (#31 in `docs/plans/skills/README.md`) unless the developer prefers closing that ratchet first.
```
