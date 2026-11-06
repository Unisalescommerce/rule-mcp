# Session handoff: ADR numbering fixed, corpus compacted, two plans closed

- Branch: `main` (the only branch).
- Covers: `0b0bfec9..44f17bf4`, nine commits.
- Date: 2026-11-06.

## The numbering defect is closed

ADR 210 records the rule: a sweep numbers a pending ADR at max+1 and never moves
a document that already has a number. Closing the holes is a separate command.

The code follows the ADR:

- `planRenumber` takes `compact`, off by default. A sweep reports the holes and
  moves nothing.
- `rewriteCitations` rewrites the link, the path and the prose form across
  `docs/`, `packages/`, `skills/` and `scripts/`. It skips test fixtures, whose
  numbers are arranged rather than cited.
- `rule-mcp handoff compact --fix` closes the holes, rewrites the citations, and
  exits 1 while a mention of a moved number survives in a form it does not own.

## What the corpus looks like now

`handoff compact --fix` closed the nine holes (007, 008, 010, 013 to 017, 155),
moved 236 documents and rewrote 2032 citations in 313 files. The sequence runs
001 to 242 with no hole and no duplicate.

The shift needed repair in the same commit:

- `scripts/data/adr-legacy.data.mjs` holds ADR numbers. 140 tokens were
  remapped, and the 22 records that landed from `_pending/` joined the ends-when
  list, which is what that list measures.
- Four ADRs named a tool as author, or named nobody. They name the person now.
- Two tests cite real ADR files by name. The fixture exclusion leaves them
  alone, so the paths were updated by hand.
- `_citations.js` and `_register-handoff.js` passed the 150-line cap, so the
  compact command moved to `packages/mcp/cli/commands/_handoff-compact.js`.

## Plans closed

| Plan                      | Result                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| `_publication-cutover.md` | ADR 243. WS3 closed on the local equivalent, not on a remote run.  |
| `_deepseek-prompts.md`    | Deleted. Support runbook, not a graph node, so the sweep skips it. |

WS3 asked for a CI dispatch on `rel/v0.1.0`, a branch ADR 205 removed. The
evidence it closed on: `pnpm run ci` reports 3135 tests, 3132 pass, 0 fail, 3
skipped; `pnpm audit:gate` finds no known vulnerability; `pnpm docs:build`
writes 58 pages; a secret scan of the 14 commits a push would add finds no
credential.

`docs/plans/` now holds only `plan-of-plans.md`. 69 plans are ready in the graph.

## Two repairs outside the numbering work

- Betterleaks 2.0.0-rc.7 sits in `~/.local/bin`, checked against the release
  `checksums.txt`. The pre-commit gate scans now: every commit prints
  `no credentials found`.
- The census hook stages `docs/01-getting-started.md` and
  `scripts/__tests__/fixtures/census.json`. Both were missing, so an ADR commit
  left the snapshot modified. The five hook tests now run in the foundation
  suite, which went from 716 to 721 files.

## Read this before running a tool that writes

The MCP server this session talks to was started before the numbering fix, so it
holds the old code in memory. The launcher copy on disk is current.

- Use `rule-mcp <command>` from a shell for anything that writes.
- A new session gets a fresh server and needs no workaround.

## Open work

- One remote run of `ci.yml` on `main`, once a push is authorized. The workflow's
  own environment stays unobserved until then.
- The seven example credentials the owner kept. A push to `main` scans only the
  new commits, so they do not block it.
- 69 plans are ready; the graph lists them by level.

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp-workspace on `main`, the only branch. Read `docs/handoff/55-numbering-fixed-corpus-compacted-and-plans-closed.md` first, then run `rule_tool_handon` with closeout disabled until you confirm the server runs the current code: the MCP server of the previous session held pre-fix numbering code in memory, so a sweep from a tool could renumber the corpus again. Use `rule-mcp <command>` from a shell for anything that writes.
The numbering rule is ADR 210: a sweep numbers a pending ADR at max+1 and never moves an existing file, and `rule-mcp handoff compact --fix` is the only command that closes a hole. The sequence runs 001 to 242 with no gap, so nothing is pending there.
First step: decide whether to push `main` and dispatch `ci.yml` for the one run ADR 243 records as open, or take the first open step of a ready plan from the cascade (69 ready). Ask before pushing: no push has been authorized.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message. The credential gate runs: betterleaks 2.0.0-rc.7 on `~/.local/bin`. Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
