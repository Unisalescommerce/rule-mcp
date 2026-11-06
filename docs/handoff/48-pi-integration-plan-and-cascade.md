# 48: Cascade gate, plan shape, and the debt plan

- **Branch**: `rel/v0.1.0`
- **Commit range**: `39fd8624`..HEAD, 5 commits.
- **Base**: `main` (merge base `325936e6`). Conventional Commit violations: 0.
- **Date**: 2026-11-04.

## Done

1. **Cascade gate.** `c08ee095` makes handoff and handon read every plan. A proposal is an open plan whose hard edges are met. A superseded plan is not offered. Unknown edges and cycles are named.
2. **Plan shape.** `27cba829` requires workstreams, checkbox tasks, one file link, and a dependency graph. The graph needs a fenced diagram. The writer refuses a body that misses a part.
3. **Hash remap.** `e88bc8e1` rewrites 150 citations in 20 files. They now name the commits after the rebase. `backup/pre-linearize-46` (`c7fe22b6`) still holds the old history.
4. **Decision record.** The pending file is `docs/adr/235-handoff-proposes-only-the-plan-cascade-and-every-plan-carries-workstreams-checkb.md`. It gets a number when it lands on the trunk.
5. **Debt plan.** `7e503811` adds `docs/plans/_pi-integration-and-debt.md`. The graph lists it ready, at level 1, with 15 open steps. It does not copy the bundler family steps.

## State

- The feature line has 476 commits and 0 merge commits.
- Sixteen ADRs wait under `docs/adr/_pending/`.
- The plan graph has 71 ready plans, 12 blocked plans, 0 unknown edges, and 0 cycles.
- `pnpm lint` is still red on `unicorn/no-asterisk-prefix-in-documentation-comments`.

## Left out / next

- The running MCP server still has the old handon. Restart it before trusting a client resume.
- The plan writer inserts a snapshot row before the next heading. Prose under the table pushed this row out. The row was moved into the table by hand.
- No release tag has been cut.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/48-pi-integration-plan-and-cascade.md on branch rel/v0.1.0.
Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The ADR log and the context snapshot capture what has been decided; do not re-ask answered questions.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.
Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
First step: WS1-T1 in docs/plans/_pi-integration-and-debt.md. Add the query words to the handoff, handon, check, and gateway descriptions. Do not start WS2 until WS1 is done.
```
