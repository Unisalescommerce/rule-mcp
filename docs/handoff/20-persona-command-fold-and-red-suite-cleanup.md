## HANDOFF: rule-mcp

- Branch: `main`
- Commit range: `17090320..80266874`
- Date: 2026-09-23
- File: `docs/handoff/20-persona-command-fold-and-red-suite-cleanup.md`

### Project Identity

- Description: MCP server for rule-mcp-* skill ecosystem. Serves styleguides, component templates, framework best practices, and design system patterns.
- Version: 0.2.0-rc

### Shipped this session

**One persona command per role (ADR 112).** persona surface generated one prompt, one slash command and one skill per role and per operation: 57 names on each surface. It is now one `/rule-persona-<role>`, and depth is read from request by `core/review/roles/_operation-intent` (whole tokens, English and Italian, plan outranks review, default audit). operations stay cumulative, so `review` runs audit and `plan` runs all three, without growing `rule_tool_plan` contract. Every surface reads same intent: prompt resolver decides server-side from topic, command body states rule over `$ARGUMENTS`, and generated persona skill embeds same keyword lists. old names are deleted, not aliased: `agent-commands --sync` purges stale persona files in every target directory, and `skills install` purges old skill directories.

Counts: prompts 75 -> 37, slash commands 77 -> 39, persona prompts and skills 57 -> 19, surface map 163 -> 125 rows.

**red suite cleaned up.** `pnpm test:all` was red on thirteen pre-existing failures, all from incomplete migration and all confirmed at HEAD with this session's changes stashed out. Fixed: tool-surface fixture repinned to 106 tools server serves; invocation-cycle cache edge followed to `router/call/_stages.js`; `repository-contract` expects `rule_tool_handoff` and `rule_tool_handon`; efficacy corpus calls `rule_tool_compress`; cache tests read action tool instead of removed template tool; guardrails-coverage validates shipped templates through `getTemplate`; `@axe-core/playwright` pinned exact; committed `CLAUDE.md` blocks refreshed to what install writes; `docs/03` drops stale `rule_tool_process_handon`. Four modules had crossed 150-line cap and split one concern per file: `_bodies.js` into bodies and bodies-session, doctor `_format.js` into compose and sections, roles `_command.js` into dispatcher plus new and deprecate, prompts `_areas.js` into base and prompts.

Gate: `pnpm test:all` exits 0 (`all: ok`), and `rule_tool_check` passes on all 27 changed JS files.

### ADR Log

| #   | Status   | Title                                                                 | Tags                                  | Decision                                                                                                                   |
| --- | -------- | --------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 120 | accepted | Fold the per-operation persona commands into one per role...          | commands, personas, prompts, breaking | One prompt, command and skill per role; the depth is read from the request; operations stay cumulative; old names deleted. |
| 117 | accepted | Area slash commands are collectors only; leaves route from the prompt | commands, prompts, areas              | Slash and MCP area prompts emit only hub collectors; leaves route from free text.                                          |
| 116 | accepted | Fold check slash siblings into the parent via keyword intent          | commands, guardrails, breaking        | Delete every `/rule-area-*-check` sibling; keep `/rule-check`; fold check intent into the parent.                          |
| 115 | accepted | Map tools, slash commands, and skills into one surface                | tools, commands, skills               | One generated Command/Tool/Skill map; removed `rule_tool_component`, `rule_tool_scaffold`, `rule_tool_a11y_report`.        |

Full log: `docs/adr/ADR.md` (120 entries).

### Recent Commits

```
80266874 docs(personas): regenerate the census, README counts and ADR 112
fcd87382 fix(repo): align the stale tests, pins and oversized modules with the live surface
93ff5cb2 feat(commands): fold the per-operation persona commands into one per role
17090320 perf(self-update): yield the BM25 build, persist the throttle window
```

### Flagged, not fixed

- purge of old persona command files and skill directories runs on next `agent-commands --sync` / `skills install`. This session changed code but ran no install on this machine.
- `main` is 16 commits ahead of `origin/main` and has not been pushed.
- Backlog Step 4 (ARCH-10) is open: there is no `Transport` interface and no `ToolPolicy` type (`docs/plans/backlog.md`).
- owner actions in `docs/plans/backlog.md` (GitHub vulnerability reporting, branch protection, Pages URL, labels, sponsors, Vigilant Mode, stale `v1.0.0` tag) are unchanged.

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp from `docs/handoff/20-persona-command-fold-and-red-suite-cleanup.md`.
Run `rule_tool_handon` first: it checks which claims in this handoff still hold before any of them are trusted.
The ADR log and the context snapshot capture what has been decided; do not re-ask answered questions.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message.

Branch: `main` (16 commits ahead of origin/main; never pushed).
Commit range covered: `17090320..80266874`.
Shipped this session: the persona fold (ADR 112, 57 commands to 19 with the depth read from the request) and the cleanup of 13 pre-existing red tests, pins and oversized modules. `pnpm test:all` is green.

First step: run the installer sync so the purge of the old persona commands and skills actually happens on this machine (`rule-mcp agent-commands --sync` and `rule-mcp skills install --all`), then start backlog Step 4 (ARCH-10): a `Transport` interface and a `ToolPolicy` type.
```
