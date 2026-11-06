# Session handoff: publication cutover and the branch it leaves

- **Branch**: `main`. It is only branch.
- **Commit range**: `34d44536..8cd7734d`.
- **Date**: `2026-11-06`.
- **Base**: old `main` at `e6f8e753`, which no longer exists.

## Delivered

- Closed Publication WS1: shell completion for `secrets`, token-rarity helper moved out of rules folder, `keep` tool test isolated from real home, and docs site that never emits dead link.
- Closed surface audit: counts guarded by test, catalog documents refreshed, seven proposed ADRs decided, orchestrator deduplicated from 850 to 568 lines.
- Closed OSS readiness: four ADRs written, dead repository slug fixed in 23 files and 4 tests, notify default update mode, `glob` and `minimatch` overridden to clear both advisories, npm placeholder prepared outside repository.
- Closed Publication WS2: every trace of retired sibling left tree, with regression test that reads whole tree.
- Closed Publication WS4: full history scanned, 1403 commits, 23 findings in paths that no longer exist and 7 in tracked files, all example values owner chose to keep.
- Closed Publication WS5: one history rewrite that drops `docs/case-studies` and `coverage/tmp` and fixes one commit message, then `rel/v0.1.0` became `main` and old branch was deleted.
- Wrote ADR 205 for topology, removal, invalidated hashes and freeze.

## What the rewrite did

|                                | Before           | After |
| ------------------------------ | ---------------- | ----- |
| commits                        | 1413             | 1414  |
| `.git`                         | 68 MB            | 32 MB |
| `docs/case-studies` in history | present          | gone  |
| `coverage/tmp` in history      | 387 MiB unpacked | gone  |
| commits with a bad type        | 1                | 0     |

lease push needs full 40-character sha: `--force-with-lease=main:e6f8e75364c6a78398b80d11aa60b110986fdcea`. short one is rejected.

## Verification

- Full suite on rewritten tree: 3111 tests, 3108 passed, 0 failed, 3 skipped.
- Census current, smoke test green.
- CI on `main`: commit lint passes on rewritten history; three OS test jobs, security audit and release preview pass.

## What stays red, and why

- **Lint + Format**: 193 errors from rules other than one turned off, 88 of them `no-unused-vars`.
- **Coverage gate**: branch coverage 90.7 percent against 92 percent floor.
- **Secret scan**: push to `main` reads full history and blocks on seven example credentials owner kept. manual dispatch is advisory unless its `blocking` input is set.

owner chose to record these as debt rather than block cutover. first two need their own ADR.

## Open work

- Lint sweep and coverage, with one ADR for debt and one for whatever floor is kept.
- npm placeholder is prepared in `~/Projects/pixu1980/ai/rule-mcp-npm-placeholder`; only owner publishes it.
- repository is still private. Making it public, turning on branch protection, restoring CodeQL workflow and checking Dependabot are owner actions listed in publication plan.
- `rule-mcp-backups/rule-mcp-before-cutover.bundle` file is only copy of pre-rewrite history. Decide whether to keep it.

## A trap this session hit

`rule_tool_handoff` on trunk numbers pending ADRs and closes numbering gaps, and it does not rewrite ADR references inside `docs/plans`. Running it without `--no-archive` renumbered 232 records and left `plan-of-plans.md` pointing at wrong ones. change was reverted. Use `--no-archive` unless renumbering is task.

### Resume Prompt

```prompt
Resume work on rule-mcp-workspace on `main`, the only branch. Read `docs/handoff/52-publication-cutover-and-the-branch-it-leaves.md`, then run `rule_tool_handon` with closeout disabled: on this trunk the handoff tool numbers pending ADRs and closes numbering gaps without rewriting the ADR references inside `docs/plans`, which corrupts them. First take the lint debt: 193 errors, 88 of them `no-unused-vars`, recorded in `docs/plans/_publication-cutover.md`. Write the debt ADR before the sweep, keep commits `type(scope): subject`, and never rewrite history again: ADR 205 froze it. The credential scan blocks a push to main on seven example values the owner kept, so ask before changing them.
```
