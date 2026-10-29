# 35: Project scope finished, interactive questions, steps 9-11

- **Branch**: `rel/v0.1.0`
- **Commit range**: `dc2abc88..1f9795e1` (11 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in the whole feature range: 2
- **Date**: 2026-10-29

## Done

1. **Interactive questions are now a rule both surfaces carry** — the RULES block an install writes into every agent's instruction file, and the workflow reminder the server prepends to tool results (full contract and the terse re-anchor), both say that a decision, preference or confirmation goes to the host's question UI with options instead of prose the user has to answer in chat. The prompt-budget test pins the sentence.
2. **The Claude project extras** — a project-scope Claude install now writes what a global one writes, cut down to the project root: the rules block in `CLAUDE.md`, the `/rule-*` commands in `.claude/commands/`, and the guard hooks in `.claude/settings.json` (`.claude/settings.local.json` for a local config). The removal takes the same three back.
3. **The git side of a project** — `.githooks/post-merge` and `post-rewrite` run `rule-mcp handoff land --quiet --commit`, the `rule-mcp-index` driver is configured, and the attributes are tracked for a shared install or private for a local one. One task per checkout, in the install, uninstall and `project add|remove` plans; a root that is not a repository is reported, not failed.
4. **The wizard asks where the install writes** — a Scope step after Agents: global costs one radio, project asks for the roots (the current directory offered, `p` for a typed path) and the kind, and the plan switches to the project plan.
5. **Path suggestions** — `_path-complete.js` expands `~`, keeps credentials directories out of every list, and returns folders only (dot folders once a dot is typed, control-character names skipped, values ending in `/`). The Scope prompt refuses a path that is not an existing directory and quotes the suggestions.
6. **A project's rules block is refreshed** — `refreshProjectRules` replaces the marked block in `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and `.cursorrules`, keeps the rest of the file, and touches only files that already carry the marker. A `project-rules` step runs before the git step in every project install, and `init` calls it and prints a `Rules block:` line.
7. **Documentation** — `03` gains where the rules live, the ADR policy table and the shared-entry prompt limit; `04` gains project installs, features and agent attribution; `08` gains the table of what `init` and a project install write into a checkout, and how a pending ADR lands.

## Commits this handoff window

`c56cb2ba`, `1738d95b`, `70e513e8`, `0b8cb1af`, `fa654783`, `ed950590`, `3bfc6ff4`, `4657a32c`, `704921fb`, `5bb4e7e5`, `1f9795e1`.

## ADRs

Six pending in `docs/adr/_pending/`, all numbered on trunk landing (`rule-mcp handoff land`):

- `attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md`
- `derive-the-tokensave-switch-from-the-project-and-accept-on-autotrack-as-its-name.md`
- `uninstall-reclaims-the-configuration-it-wrote-after-asking.md`
- `split-the-files-the-size-ratchet-named-and-baseline-the-eight-that-were-never-re.md`
- `project-membership-is-a-command-and-an-update-re-applies-what-it-moved.md`
- `count-the-cycles-and-the-dead-symbols-the-graph-can-prove-and-break-the-cycles-t.md`

Do not cite a number for any of them before `rule-mcp handoff land`.

## State

- `pnpm test:installer` 768 tests, 0 fail. `pnpm test:foundations` 2814 tests, 0 fail.
- `rule_tool_check` (project): 4 pass, 0 fail, 1 skipped (diagnostics), 2 advisory.
- `node bin/rule-mcp.js fix --dir .`: nothing to fix. Census current; `handoff doctor` clean.

## Left out / next

- **Plan `installer-scope-adr-policy-features` is complete except item 4**: per-client prompt suppression. `RULE_MCP_NO_MCP_PROMPTS` has **no consumer** in the server, so writing it into a shared `.mcp.json` would ship an inert env; it was written, caught by the census, and removed. The consumer comes first: the server has to be able to answer "which client is this".
- **The scrollable path menu (step 9 item 2) is not built.** `suggestPaths` and `expandPath` exist and the Scope prompt uses them, but the keystroke widget (`Tab` opens a menu, arrows wrap, `Esc` closes) needs the renderer's key loop. The plan's step 9 item 1 is done; item 3's widget half is not.
- **Attribution rows for 21 agents** need a cited vendor page each. Filling one from memory is what the ADR forbids.
- **Two merge commits** (`e9d29e8e`, `df6ba117`) remain in the 374-commit feature range; linearize only with owner confirmation.
- **`main` is 870 commits behind this line**; the merge is a review question.
- `unicorn/no-asterisk-prefix-in-documentation-comments` still fires on files this session did not rewrite.
- The MCP server in the session that produced this handoff served an older build than the checkout; `rule_tool_check`, `rule_tool_structural` and `rule_tool_handon` answered stale or refused, and the CLI path was used instead. Restart the server before trusting those tools.

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
