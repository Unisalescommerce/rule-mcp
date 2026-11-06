# 34: Green guardrails, per-agent attribution, project membership

- **Branch**: `rel/v0.1.0`
- **Commit range**: `f7bb432b..35db190c` (31 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in the whole feature range: 2
- **Date**: 2026-10-29

## Done

1. **Handon, three defects, each test-first** — `parseHandoff` accepted only `**Branch:**` while every handoff here writes `**Branch**:`, so the declared branch was never read and the trunk under `**Base**:` became "the branch this work was on"; both forms are read, the base is excluded, and `firstMove` proposes only the declared branch. Named files were compared from the range _start_, so every file the handoff had just committed came back "modified since"; the comparison base is now the one the commit count uses. Suite: 48/48.
2. **Tokensave is a three-level switch with a derived default** — `on` writes `RULE_MCP_NO_TOKENSAVE=0` (a decision, not an erasure), `on+autotrack` resolves to the canonical `autotrack`, and with no choice recorded `readLevel` follows `.tokensave/` in the project. A project-scope install pins off for a graphless project; the constant an earlier install wrote is pruned once by the setup path.
3. **Uninstall reclaims what it wrote** — a `config` step lists and removes `env.json` (canonical and legacy), the manifest and `projects.json`, asks before deleting, keeps the switches under `--keep-config`, and an entry that was the whole file now takes the file with it.
4. **Attribution is a table, one row per agent** — 23 rows, 2 documented (Claude Code from its settings reference, Gemini as `none`), 21 `unverified` with no values and no writer. `applyAttribution` keeps the user's value, `hide` writes only the documented marker, `keep` removes only that, an unparseable file is refused. `setup --attribution <keep|hide>`, `--attribution-agent`, one wizard question.
5. **Project membership is a command** — `rule-mcp project add|remove` reuse the last recorded project's agents and config kind; a successful self-update re-applies the recorded installs and projects. Two paths that could not run are fixed: `runPlan` was handed an object, and the count included the empty-store placeholder.
6. **The style fixer settles** — three defects: a multi-line block whose body was one line was split and given a second `;`; `function`/`class` counted as `const`, inserting a blank line inside functions; and the chain ran once, so a pass fed the next round text it would change again. It now iterates to stability and skips string and comment ranges.
7. **Guardrails green** — the five cycles and forty-nine dead symbols were mostly artefacts: a JSDoc type reference is read as an import, and a symbol reached through a table, a run-time import or a test has no edge. Both checks now decide from the source; the cycles that were real were split into leaf modules.

## Commits this handoff window

`f9e88ce8`, `ba53f399`, `51daeaf8`, `f5d04cb3`, `79272e9d`, `1bcbf914`, `fa70fb90`, `d4580c82`, `92a2e656`, `541e3ba9`, `3f71968c`, `ea132e85`, `367a6907`, `e75b11b5`, `529c044c`, `34cbe6e3`, `87b90e04`, `cf4cd2ab`, `54fb776b`, `728b04e2`, `4ff714ff`, `f078fd42`, `86afff4f`, `cf074d59`, `35a02766`, `5205290b`, `0df6fc7f`, `6015b86e`, `96657684`, `7de49e0b`, `35db190c`.

## ADRs

Six pending, all in `docs/adr/_pending/`, all numbered on trunk landing (`rule-mcp handoff land`):

- `attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md`
- `derive-the-tokensave-switch-from-the-project-and-accept-on-autotrack-as-its-name.md`
- `uninstall-reclaims-the-configuration-it-wrote-after-asking.md`
- `split-the-files-the-size-ratchet-named-and-baseline-the-eight-that-were-never-re.md`
- `project-membership-is-a-command-and-an-update-re-applies-what-it-moved.md`
- `count-the-cycles-and-the-dead-symbols-the-graph-can-prove-and-break-the-cycles-t.md`

Do not cite a number for any of them before `rule-mcp handoff land`.

## State

- `pnpm test:installer` 743 tests, 0 fail. `pnpm test:foundations` 2789 tests, 0 fail.
- `rule_tool_check` (project): 4 pass, 0 fail, 1 skipped (diagnostics), 2 advisory.
- `node bin/rule-mcp.js fix --dir .`: nothing to fix.
- `buildAll`/`census` current; `handoff doctor`: no duplicate numbers, indexes current.

## Left out / next

- **Plan step 8 is half done.** Open: the Claude extras in project scope (`CLAUDE.md`, `.claude/commands/`, hooks and attribution in `.claude/settings.json`), per-client prompt suppression (`RULE_MCP_NO_MCP_PROMPTS` as a client list), the numbering hooks per project, and the wizard Scope UI. Steps 9–11 (path completion, project rules block, docs) are untouched.
- **Attribution rows for 21 agents**: each needs a cited vendor page. The table states that nobody read one; filling a row from memory is the failure the ADR forbids.
- **No TOML attribution row exists**, so `_attribution.js` has no TOML writer: a document naming one is what would justify it.
- **Two merge commits** (`e9d29e8e`, `df6ba117`) remain in the 363-commit feature range; linearize only with owner confirmation.
- **`main` is 870 commits behind this line**; the merge is a review question, not a cherry-pick.
- `unicorn/no-asterisk-prefix-in-documentation-comments` still fires on files this session did not rewrite; every new comment here is written without asterisk prefixes.
- The MCP server in the session that produced this handoff served an older build than the checkout, so `rule_tool_check`, `rule_tool_structural` and `rule_tool_handon` answered stale or refused. The CLI path (`node bin/rule-mcp.js …`) was used instead; restart the server before trusting those tools on this tree.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/34-installer-scope-attribution-and-green-guardrails.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold. Restart the MCP server before trusting
rule_tool_check / rule_tool_structural / rule_tool_handon: the previous session served an older build.
Both suites are green (743 installer, 2789 foundations) and the project guardrails report 0 failures;
do not re-derive the guardrail filters, verify them.
Six ADRs are pending in docs/adr/_pending/ and get numbers only on trunk landing (`rule-mcp handoff land`).
docs/plans/installer-scope-adr-policy-features.md is the open plan (Status: in-progress). Step 8 is half
done: next are the Claude extras in project scope (CLAUDE.md block, .claude/commands/, hooks and
attribution in .claude/settings.json), per-client prompt suppression, the per-project numbering hooks,
and the wizard Scope UI. Then steps 9-11.
Attribution has 21 unverified rows: a row is written only with a cited vendor page, never from memory.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
