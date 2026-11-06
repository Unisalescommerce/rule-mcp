# 32: Port audit and attribution as a per-agent table

- **Branch**: `rel/v0.1.0`
- **Commit range**: `5149982e..4d7bfbc7` (2 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in the whole feature range: 2
- **Date**: 2026-10-28

## Done

1. **Handoff 31 verified, not trusted** — ADRs 187, 190–192, 194–197 read as `accepted` in `docs/adr/`, and 195/196 confirmed. One claim was stale: handoff 31 said the work was on `main` "exists, not checked out", while `rel/v0.1.0` was checked out and is the branch its own resume prompt named. No closeout writes were pending, so no `docs(adr)` sweep commit was needed.
2. **Port audit, the plan's open step** — The sibling checkout is not on this machine, so the diff ran against the plan's steps and the tree: seven subsystems landed and each kept something this repository already did better (numbering doctor `-M70%`, one host table with legacy paths, Junie path, ADR policy order, pending-ADR merge driver, features catalog, project scope). Recorded in `docs/plans/installer-scope-adr-policy-features.md`.
3. **Attribution is per agent (plan step 7 rewritten)** — The step was a Claude Code switch; it is now `_attribution.data.js`: one row per agent in `allAgents()` (23 today) with `{ agent, mechanism, file, key, keep, hide, evidence }`, mechanism one of `commit-trailer`, `pr-body`, `tool-signature`, `none`. A row is written only with a cited vendor page; an unverified row has no values and produces no writer. `applyAttribution(agent, text, { mode })` keeps the invariants: a user value stays, `hide` undoes only what an install wrote, an unparseable file is refused, a non-project install writes nothing into a project.
4. **A false closeout, undone** — `rule_tool_handoff` archived the plan into ADR 198 and deleted the source file, because the only checkbox in `## Steps` had just been checked. Restored the plan from `HEAD`, re-applied this session's edits, deleted ADR 198, restored `ADR.md`, and set `Status: in-progress` with the five remaining open boxes so the sweep can read the plan's real state. The duplicated `Notes:` line in the header went with it.

## Commits this handoff window

- `738f9ab6` `docs(plans): audit the port and make attribution per agent`
- `4d7bfbc7` `docs(adr): make attribution a per-agent table, not a Claude switch`

## ADRs

- pending: `docs/adr/229-attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md` (numbers on trunk landing)

## Left out / next

- **No vendor page was reachable on 2026-10-28.** `docs.claude.com/en/docs/claude-code/settings` returns script noise through the fetch tool, `raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/configuration.md` came back empty. The attribution table therefore cannot be populated this session: the research pass comes first, row by row, each with its page cited.
- Plan step 7 also needs `setup --attribution <keep|hide>`, `--attribution-agent <id>`, the wizard line naming the agents it will not touch, and the table-driven tests.
- Steps 8 leftovers (`rule-mcp project add|remove`, `update` walk, Claude extras in project scope, wizard Scope UI), 9 (path completion), 10 (project rules block), 11 (docs) stay as written in the plan.
- `rule_tool_handoff` over MCP timed out at 60 s on the second run; the CLI `rule-mcp handoff --no-archive` produced the same renderer in about the same time and wrote nothing.
- 2 merge commits (`e9d29e8e`, `df6ba117`) remain in the 330-commit feature range; linearize only with owner confirmation.
- Guardrails on this tree: 2 of 7 project checks fail, both pre-existing — 5 import cycles under `src/transport/session-registry/`, 48 symbols with no incoming edge — plus 2 advisory checks. Nothing in this session touched `src/`.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/32-port-audit-and-agent-attribution.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
docs/plans/installer-scope-adr-policy-features.md is the open plan (Status: in-progress, 5 open boxes);
step 7 is now "Agent attribution": a row per agent in src/cli/installers/_attribution.data.js,
written only with a cited vendor page, plus _attribution.js, setup --attribution <keep|hide>,
--attribution-agent <id> and table-driven tests.
First step: read the vendor attribution settings row by row (start with Claude Code's `attribution` key)
and write the first documented rows; do not fill a row from memory - no page, no row.
ADR policy is handoff: this session's ADR is still pending in docs/adr/_pending/ and numbers on trunk landing.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
