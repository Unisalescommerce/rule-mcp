# 34: Green guardrails, per-agent attribution, project membership

- **Branch**: `rel/v0.1.0`
- **Commit range**: `f7bb432b..35db190c` (31 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in whole feature range: 2
- **Date**: 2026-10-29

## Done

1. **Handon, three defects, each test-first** — `parseHandoff` accepted only `**Branch:**` while every handoff here writes `**Branch**:`, so declared branch was never read and trunk under `**Base**:` became "branch this work was on"; both forms are read, base is excluded, and `firstMove` proposes only declared branch. Named files were compared from range _start_, so every file handoff had committed came back "modified since"; comparison base is now one commit count uses. Suite: 48/48.
2. **Tokensave is three-level switch with derived default** — `on` writes `RULE_MCP_NO_TOKENSAVE=0` (decision, not erasure), `on+autotrack` resolves to canonical `autotrack`, and with no choice recorded `readLevel` follows `.tokensave/` in project. project-scope install pins off for graphless project; constant earlier install wrote is pruned once by setup path.
3. **Uninstall reclaims what it wrote** — `config` step lists and removes `env.json` (canonical and legacy), manifest and `projects.json`, asks before deleting, keeps switches under `--keep-config`, and entry that was whole file now takes file with it.
4. **Attribution is table, one row per agent** — 23 rows, 2 documented (Claude Code from its settings reference, Gemini as `none`), 21 `unverified` with no values and no writer. `applyAttribution` keeps user's value, `hide` writes only documented marker, `keep` removes only that, unparseable file is refused. `setup --attribution <keep|hide>`, `--attribution-agent`, one wizard question.
5. **Project membership is command** — `rule-mcp project add|remove` reuse last recorded project's agents and config kind; successful self-update re-applies recorded installs and projects. Two paths that could not run are fixed: `runPlan` was handed object, and count included empty-store placeholder.
6. **style fixer settles** — three defects: multi-line block whose body was one line was split and given second `;`; `function`/`class` counted as `const`, inserting blank line inside functions; and chain ran once, so pass fed next round text it would change again. It now iterates to stability and skips string and comment ranges.
7. **Guardrails green** — five cycles and forty-nine dead symbols were mostly artefacts: JSDoc type reference is read as import, and symbol reached through table, run-time import or test has no edge. Both checks now decide from source; cycles that were real were split into leaf modules.

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

Do not cite number for any of them before `rule-mcp handoff land`.

## State

- `pnpm test:installer` 743 tests, 0 fail. `pnpm test:foundations` 2789 tests, 0 fail.
- `rule_tool_check` (project): 4 pass, 0 fail, 1 skipped (diagnostics), 2 advisory.
- `node bin/rule-mcp.js fix --dir .`: nothing to fix.
- `buildAll`/`census` current; `handoff doctor`: no duplicate numbers, indexes current.

## Left out / next

- **Plan step 8 is half done.** Open: Claude extras in project scope (`CLAUDE.md`, `.claude/commands/`, hooks and attribution in `.claude/settings.json`), per-client prompt suppression (`RULE_MCP_NO_MCP_PROMPTS` as client list), numbering hooks per project, and wizard Scope UI. Steps 9–11 (path completion, project rules block, docs) are untouched.
- **Attribution rows for 21 agents**: each needs cited vendor page. table states that nobody read one; filling row from memory is failure ADR forbids.
- **No TOML attribution row exists**, so `_attribution.js` has no TOML writer: document naming one is what would justify it.
- **Two merge commits** (`e9d29e8e`, `df6ba117`) remain in 363-commit feature range; linearize only with owner confirmation.
- **`main` is 870 commits behind this line**; merge is review question, not cherry-pick.
- `unicorn/no-asterisk-prefix-in-documentation-comments` still fires on files this session did not rewrite; every new comment here is written without asterisk prefixes.
- MCP server in session that produced this handoff served older build than checkout, so `rule_tool_check`, `rule_tool_structural` and `rule_tool_handon` answered stale or refused. CLI path (`node bin/rule-mcp.js …`) was used instead; restart server before trusting those tools on this tree.

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
