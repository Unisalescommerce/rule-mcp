# 23 - Git workflow evolution, WS0-WS9, and the close-squash consolidation

- **Branch**: `main`
- **Date**: 2026-09-29
- **Commit range**: `1704a0b4..5de53654` (13 commits)
- **Plan**: `docs/plans/mcp-git-workflow-evolution-plan.md`

## What this session did

Implemented plan end to end (WS0 through WS9 plus section 20), then closed
the gap the developer raised in an interview: the close squash was leaving the
feature's ADRs and handoffs as their own commits.

### Commits

- `1c6dca49` docs(plan): plan and WS0 architecture map
- `b47261c1` refactor(case-studies): split launcher under file-size cap
- `4935cc40` fix(docs-site): tolerate directory that vanishes while collecting markdown
- `58a17859` feat(git): shared git foundation (WS1)
- `9b1a7cca` feat(commit): one Conventional Commit rule and init git governance (WS3)
- `a369c236` feat(sync): base-branch guard and confirmed rebase (WS2)
- `eaa98508` feat(git): `/rule-git` audit, reword and linearize (WS4)
- `2a344c7e` feat(handoff): feature close and range in handoff (WS5 + WS6)
- `4b448c08` feat(release): derive next version and gate changelog (WS7 + WS8 + WS9)
- `42be49f7` feat(init): exact dependency pins (plan section 20)
- `be87ab1b` style(version): lint fixes in version entry and its test
- `71fbaf32` feat(handoff): consolidate feature ADRs and handoffs at close squash
- `5de53654` chore(case-studies): app bookmark and architect artifacts (data, not code)

### Decisions (ADR 116-128)

- **124** - tool-call host is list, so self-update and sync guard coexist.
- **125** - normalize feature history on merge base, and hold every rewrite to tree invariant.
- **126** - close feature with `reset --soft` onto merge base and one validated commit.
- **127** - derive next version and changelog from commit rule.
- **128** - close squash consolidates feature ADRs and handoffs into one document each.

### Surfaces added

- `src/core/git/` - runner, repository state, base-branch detection, feature range, freshness, working-tree safety.
- `src/core/commit/` - one rule, linter, hook writer and idempotent governance installer; CLI `commit-lint`.
- `src/core/sync/` - branch-sync guard and `rule_tool_sync` (confirmed rebase only).
- `src/core/history/` - audit, reword, linearize, squash, and document consolidation.
- `src/core/release/` - release-tooling detection and exact-pin check.
- `rule_tool_git`, `/rule-git`, `/rule-handoff --close-feature --squash`.
- `scripts/build/version/index.mjs --next` / `--apply-next`; `scripts/build/changelog/index.mjs --check`; CI `release-preview` job.

## Verification

- `pnpm test:all` -> exit 0, 2141 pass, 0 fail, 3 skip (CI-equivalent suite).
- `pnpm census:check` current; `pnpm hooks:check` 3 installed and current; `version --check` in sync; `pnpm audit:gate` clean.
- End-to-end smoke of close squash: 5 commits become 1, merged ADR and
  handoff reproduce every original verbatim, both indexes are rebuilt, and only
  planned document paths differ from pre-squash tree.

## Known state, not fixed in this session

- `pnpm lint` is red with 22 errors and `pnpm format` with about 30 files. All
  are pre-existing and untouched here: counts match `1704a0b4`.
- `changelog --check` reports stale in clone with no tags; CI runs that gate
  only when tags define boundary.
- base-branch guard reads local refs. Remote updates need `rule_tool_sync fetch=true`.
- handoff index `docs/handoff/HANDOFF.md` does not list this file yet; the
  next `handoff doctor` or `rule_tool_handoff` run rebuilds it.

## Continuation context

Nothing is blocked, and plan has no open workstream. natural next moves,
in order: fix the two pre-existing red gates (lint and format) or leave them by
decision; then decide whether WS9 should tag automatically, which was left
manual on purpose.

### Resume Prompt

```prompt
Resume work on rule-mcp from `docs/handoff/23-git-workflow-evolution-and-close-squash.md`.
Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The ADR log (124-128) and the plan record what was decided; do not re-ask answered questions.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message, and `pnpm hooks:check` says whether the hooks are installed.
First step: run `pnpm test:all` to confirm the close-squash consolidation still holds, then decide with the developer whether to fix the two pre-existing red gates (`pnpm lint` 22 errors, `pnpm format` about 30 files).
```
