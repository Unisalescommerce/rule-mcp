# 35: Project scope finished, interactive questions, steps 9-11

- **Branch**: `rel/v0.1.0`
- **Commit range**: `35db190c..7ed48ade` (11 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in whole feature range: 2
- **Date**: 2026-10-29

## Done

1. **Interactive questions are now rule both surfaces carry** — RULES block install writes into every agent's instruction file, and workflow reminder server prepends to tool results (full contract and terse re-anchor), both say that decision, preference or confirmation goes to host's question UI with options instead of prose user has to answer in chat. prompt-budget test pins sentence.
2. **Claude project extras** — project-scope Claude install now writes what global one writes, cut down to project root: rules block in `CLAUDE.md`, `/rule-*` commands in `.claude/commands/`, and guard hooks in `.claude/settings.json` (`.claude/settings.local.json` for local config). removal takes same three back.
3. **git side of project** — `.githooks/post-merge` and `post-rewrite` run `rule-mcp handoff land --quiet --commit`, `rule-mcp-index` driver is configured, and attributes are tracked for shared install or private for local one. One task per checkout, in install, uninstall and `project add|remove` plans; root that is not repository is reported, not failed.
4. **wizard asks where install writes** — Scope step after Agents: global costs one radio, project asks for roots (current directory offered, `p` for typed path) and kind, and plan switches to project plan.
5. **Path suggestions** — `_path-complete.js` expands `~`, keeps credentials directories out of every list, and returns folders only (dot folders once dot is typed, control-character names skipped, values ending in `/`). Scope prompt refuses path that is not existing directory and quotes suggestions.
6. **project's rules block is refreshed** — `refreshProjectRules` replaces marked block in `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and `.cursorrules`, keeps rest of file, and touches only files that already carry marker. `project-rules` step runs before git step in every project install, and `init` calls it and prints `Rules block:` line.
7. **Documentation** — `03` gains where rules live, ADR policy table and shared-entry prompt limit; `04` gains project installs, features and agent attribution; `08` gains table of what `init` and project install write into checkout, and how pending ADR lands.

## Commits this handoff window

`7198c64d`, `df4a37fb`, `f366896e`, `46e6d20a`, `8b018dff`, `63ebe5ae`, `811cae95`, `090b846e`, `5162b07c`, `c7be14a6`, `7ed48ade`.

## ADRs

Six pending in `docs/adr/_pending/`, all numbered on trunk landing (`rule-mcp handoff land`):

- `attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md`
- `derive-the-tokensave-switch-from-the-project-and-accept-on-autotrack-as-its-name.md`
- `uninstall-reclaims-the-configuration-it-wrote-after-asking.md`
- `split-the-files-the-size-ratchet-named-and-baseline-the-eight-that-were-never-re.md`
- `project-membership-is-a-command-and-an-update-re-applies-what-it-moved.md`
- `count-the-cycles-and-the-dead-symbols-the-graph-can-prove-and-break-the-cycles-t.md`

Do not cite number for any of them before `rule-mcp handoff land`.

## State

- `pnpm test:installer` 768 tests, 0 fail. `pnpm test:foundations` 2814 tests, 0 fail.
- `rule_tool_check` (project): 4 pass, 0 fail, 1 skipped (diagnostics), 2 advisory.
- `node bin/rule-mcp.js fix --dir .`: nothing to fix. Census current; `handoff doctor` clean.

## Left out / next

- **Plan `installer-scope-adr-policy-features` is complete except item 4**: per-client prompt suppression. `RULE_MCP_NO_MCP_PROMPTS` has **no consumer** in server, so writing it into shared `.mcp.json` would ship inert env; it was written, caught by census, and removed. consumer comes first: server has to be able to answer "which client is this".
- **scrollable path menu (step 9 item 2) is not built.** `suggestPaths` and `expandPath` exist and Scope prompt uses them, but keystroke widget (`Tab` opens menu, arrows wrap, `Esc` closes) needs renderer's key loop. plan's step 9 item 1 is done; item 3's widget half is not.
- **Attribution rows for 21 agents** need cited vendor page each. Filling one from memory is what ADR forbids.
- **Two merge commits** (`e9d29e8e`, `df6ba117`) remain in 374-commit feature range; linearize only with owner confirmation.
- **`main` is 870 commits behind this line**; merge is review question.
- `unicorn/no-asterisk-prefix-in-documentation-comments` still fires on files this session did not rewrite.
- MCP server in session that produced this handoff served older build than checkout; `rule_tool_check`, `rule_tool_structural` and `rule_tool_handon` answered stale or refused, and CLI path was used instead. Restart server before trusting those tools.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/35-project-scope-finished-and-steps-nine-to-eleven.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold. Restart the MCP server before trusting
rule_tool_check / rule_tool_structural / rule_tool_handon: the previous session served an older build.
Both suites are green (768 installer, 2814 foundations) and the project guardrails report 0 failures.
Six ADRs are pending in docs/adr/_pending/ and get numbers only on trunk landing (`rule-mcp handoff land`).
docs/plans/installer-scope-adr-policy-features.md is complete except item 4: per-client prompt suppression
is blocked because nothing in the server reads RULE_MCP_NO_MCP_PROMPTS, and the variable was removed from
the shared entry rather than shipped inert. Next: give the server a way to answer which client it serves,
then write the switch; and build the scrollable path menu the Scope prompt still lacks (suggestPaths and
expandPath are ready, the keystroke widget is not).
Attribution has 21 unverified rows: a row is written only with a cited vendor page, never from memory.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
