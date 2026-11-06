# Session handoff: ADR numbering fixed, corpus compacted, two plans closed

- Branch: `main` (only branch).
- Covers: `0b0bfec9..44f17bf4`, nine commits.
- Date: 2026-11-06.

## The numbering defect is closed

ADR 210 records the rule: a sweep numbers a pending ADR at max+1 and never moves
document that already has number. Closing holes is separate command.

code follows ADR:

- `planRenumber` takes `compact`, off by default. sweep reports holes and
  moves nothing.
- `rewriteCitations` rewrites link, path and prose form across
  `docs/`, `packages/`, `skills/` and `scripts/`. It skips test fixtures, whose
  numbers are arranged rather than cited.
- `rule-mcp handoff compact --fix` closes holes, rewrites citations, and
  exits 1 while mention of moved number survives in form it does not own.

## What the corpus looks like now

`handoff compact --fix` closed nine holes (007, 008, 010, 013 to 017, 155),
moved 236 documents and rewrote 2032 citations in 313 files. sequence runs
001 to 242 with no hole and no duplicate.

shift needed repair in same commit:

- `scripts/data/adr-legacy.data.mjs` holds ADR numbers. 140 tokens were
  remapped, and 22 records that landed from `_pending/` joined ends-when
  list, which is what that list measures.
- Four ADRs named tool as author, or named nobody. They name person now.
- Two tests cite real ADR files by name. fixture exclusion leaves them
  alone, so paths were updated by hand.
- `_citations.js` and `_register-handoff.js` passed 150-line cap, so the
  compact command moved to `packages/mcp/cli/commands/_handoff-compact.js`.

## Plans closed

| Plan                      | Result                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| `_publication-cutover.md` | ADR 243. WS3 closed on the local equivalent, not on a remote run.  |
| `_deepseek-prompts.md`    | Deleted. Support runbook, not a graph node, so the sweep skips it. |

WS3 asked for CI dispatch on `rel/v0.1.0`, branch ADR 205 removed. The
evidence it closed on: `pnpm run ci` reports 3135 tests, 3132 pass, 0 fail, 3
skipped; `pnpm audit:gate` finds no known vulnerability; `pnpm docs:build`
writes 58 pages; secret scan of 14 commits push would add finds no
credential.

`docs/plans/` now holds only `plan-of-plans.md`. 69 plans are ready in graph.

## Two repairs outside the numbering work

- Betterleaks 2.0.0-rc.7 sits in `~/.local/bin`, checked against release
  `checksums.txt`. pre-commit gate scans now: every commit prints
  `no credentials found`.
- census hook stages `docs/01-getting-started.md` and
  `scripts/__tests__/fixtures/census.json`. Both were missing, so ADR commit
  left snapshot modified. five hook tests now run in foundation
  suite, which went from 716 to 721 files.

## Read this before running a tool that writes

MCP server this session talks to was started before numbering fix, so it
holds old code in memory. launcher copy on disk is current.

- Use `rule-mcp <command>` from shell for anything that writes.
- new session gets fresh server and needs no workaround.

## Open work

- One remote run of `ci.yml` on `main`, once push is authorized. workflow's
  own environment stays unobserved until then.
- seven example credentials owner kept. push to `main` scans only the
  new commits, so they do not block it.
- 69 plans are ready; graph lists them by level.

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp-workspace on `main`, the only branch. Read `docs/handoff/55-numbering-fixed-corpus-compacted-and-plans-closed.md` first, then run `rule_tool_handon` with closeout disabled until you confirm the server runs the current code: the MCP server of the previous session held pre-fix numbering code in memory, so a sweep from a tool could renumber the corpus again. Use `rule-mcp <command>` from a shell for anything that writes.
The numbering rule is ADR 210: a sweep numbers a pending ADR at max+1 and never moves an existing file, and `rule-mcp handoff compact --fix` is the only command that closes a hole. The sequence runs 001 to 242 with no gap, so nothing is pending there.
First step: decide whether to push `main` and dispatch `ci.yml` for the one run ADR 243 records as open, or take the first open step of a ready plan from the cascade (69 ready). Ask before pushing: no push has been authorized.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message. The credential gate runs: betterleaks 2.0.0-rc.7 on `~/.local/bin`. Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
