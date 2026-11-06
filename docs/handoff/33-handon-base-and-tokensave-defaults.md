# 33: Handon stops inventing next moves, tokensave follows the project

- **Branch**: `rel/v0.1.0`
- **Commit range**: `f7bb432b..7de49e0b` (30 commits, this handoff excluded)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits in whole feature range: 2
- **Date**: 2026-10-28

## Done

1. **Handoff 32 verified, not trusted** — ADR 178 read `accepted` in `docs/adr/ADR.md`, ADR 189 absent from both directory and index, pending attribution ADR present, plan at `Status: in-progress` with 5 open boxes, no `_attribution*` file under `src/cli/installers/`. Two claims were stale: tree was clean (the "modified since" edits were committed in `738f9ab6`/`4d7bfbc7`), and suggested first move named `main` although `rel/v0.1.0` was checked out.
2. **Three handon defects, each test-first** — (a) `parseHandoff` accepted only `**Branch:**` while every handoff here writes `**Branch**:`, so declared branch was never read and trunk named under `**Base**:` became "branch this work was on"; both forms are read, base is excluded, and `firstMove` only proposes declared branch. (b) same parse now exposes `declaredBranch`. (c) Named files were compared from range _start_, so everything handoff itself had committed came back "modified since"; comparison base is one commit count uses - end when it resolves, start when range ends at `HEAD`.
3. **Tokensave switch owns its default** — `on+autotrack` resolves to canonical `autotrack` level; with no choice recorded `readLevel("tokensave")` follows `hasTokensave(projectDir ?? process.cwd())`; project-scope `local` install writes derived value through `tokensaveProjectEnv`, and `RULE_MCP_NO_TOKENSAVE` left `DEFAULT_OPTOUT_ENV` so no config claims graph it cannot have. Documented in `docs/05-env-variables.md`; `tests/fixtures/census.json` regenerated for changed `env-registry` block.
4. **explicit `on` is decision now** — it removed both keys, which read same as never choosing, so derived default overrode it in graphless checkout. `on` writes `RULE_MCP_NO_TOKENSAVE=0`; any recorded value blocks guess; and `0` every earlier install wrote is pruned once by setup path when file matches that constant table key for key, because it was installer's value and not decision. setup path was verified on real legacy-shaped file: one key dropped, other seven kept.
5. **Uninstall reclaims what it wrote** — switches file, legacy file, manifest and `projects.json` outlived agent configs uninstall removes. new `config` step lists all four, asks before deleting, keeps two switches files under `--keep-config` while still dropping records, and stays silent under `--json`/`--no-interactive`; `--purge` still deletes home wholesale. Verified end to end on temp home: canonical, legacy and `projects.json` removed, `install.json` already gone via `forgetInstall`.
6. **Gemini's attribution page found, not guessed** — `docs/cli/configuration.md` is HTTP 404; file is `docs/reference/configuration.md`, and it names no attribution, co-author or trailer setting, which is `none` row plan step 7 defines. Recorded in plan.

## Commits this handoff window

- `f9e88ce8` `fix(handon): read a handoff's base trunk as the trunk, not as the working branch`
- `ba53f399` `docs(plans): cite where Gemini's configuration page moved and what it omits`
- `51daeaf8` `fix(handon): compare named files from the range end, not its start`
- `f5d04cb3` `feat(installer): own tokensave as on/on+autotrack/off with a project-derived default`
- `fa70fb90` `fix(installer): record tokensave on as a decision instead of erasing it`
- `92a2e656` `feat(uninstall): reclaim the switches and records rule-mcp wrote`

Then, closing pre-existing failures: `e75b11b5`, `529c044c`, `34cbe6e3`, `87b90e04`, `cf4cd2ab`, `54fb776b`, `728b04e2`.
Handoff and ADR commits in the same window: `79272e9d`, `1bcbf914`, `d4580c82`, `541e3ba9`, `3f71968c`.

## ADRs

- pending: `docs/adr/220-attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md`
- pending: `docs/adr/221-derive-the-tokensave-switch-from-the-project-and-accept-on-autotrack-as-its-name.md`
- pending: `docs/adr/222-uninstall-reclaims-the-configuration-it-wrote-after-asking.md`
- pending: `docs/adr/223-split-the-files-the-size-ratchet-named-and-baseline-the-eight-that-were-never-re.md`
- both land with numbers on trunk (`rule-mcp handoff land`); do not cite number for either before that.

## Left out / next

- `0`-means-on rule reaches file setup path touches or uninstall reclaims; machine that never runs either keeps old value as decision. `RULE_MCP_NO_TOKENSAVE=0` in project with no graph is visible symptom.
- guardrail MCP tools (`rule_tool_check`, `rule_tool_structural`) answer `self-update REFUSED - git remote ... is not allowed update source`, and `rule_tool_handon` served pre-fix code for same reason: MCP server in this session runs older build than checkout. Restart server before trusting any of their output on this tree.
- `rule_tool_check` and `rule_tool_structural` answer only with `rule-mcp self-update REFUSED - git remote ... is not allowed update source`. Guardrail checks ran through eslint and local suites instead; MCP-side structural declaration was never registered.
- **pre-existing failures this handoff listed are gone, except one theme.** Fixed and verified: bootstrap flag lists (`scripts/install.sh`, `install.ps1`, SHA256SUMS), bare `feature` command having no action, `feature` missing from zsh/bash/fish completions, committed CLAUDE.md rules block, ADR numbering tests that ran against non-repository, seven self-guardrail findings plus camelCase-barrel false positive, and daemon test that used real home and fixed port 37999. Suites now: `pnpm test:installer` 722 tests, **0 fail**; `pnpm test:foundations` 2756 tests, **2 fail**.
- **Both size tests are green.** Nine files that had grown past their ceiling (and five this window had grown) were split into named modules and `.fixture.mjs` files; five ratchet entries were deleted because those files now fit cap, four ceilings came down, and eight offenders that predate this window were baselined at their current size. Both suites are now green: `pnpm test:installer` 722 tests, 0 fail; `pnpm test:foundations` 2756 tests, 0 fail.
- **style fixer no longer rewrites its own output** (`6015b86e`). Three defects: one-liner splitter matched multi-line block whose body was one line and appended `;` to body that already had one; declaration opener counted `function`/`class` as `const`, so `const-top` inserted blank line inside every function whose first statement was return; and chain ran once, so pass fed next round text it would change again. `applyJsStyle` now runs until text stops moving, and splitter skips string and comment ranges through `_literals.js`. `rule-mcp fix --dir .` reports nothing, three runs in row.
- `unicorn/no-asterisk-prefix-in-documentation-comments` fires across many files that predate this session (`src/tools/handon/`, `src/cli/installers/_env.js`, `src/cli/commands/_lifecycle.js`). Every new comment in this window is written without asterisk prefixes, so no debt was added; clearing rest is mechanical `eslint --fix` over files this session did not touch.
- Plan `installer-scope-adr-policy-features.md` step 7 still needs `_attribution.data.js`, `_attribution.js`, `setup --attribution <keep|hide>`, `--attribution-agent <id>` and its table-driven tests; steps 8-11 are unchanged.
- 2 merge commits (`e9d29e8e`, `df6ba117`) remain in 336-commit feature range; linearize only with owner confirmation.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/33-handon-base-and-tokensave-defaults.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
The handon fixes are landed and tested (48/48); do not re-derive them, verify them.
Two ADRs are pending in docs/adr/_pending/ and get numbers only on trunk landing
(`rule-mcp handoff land`): attribution per agent, and the tokensave switch default.
`docs/plans/installer-scope-adr-policy-features.md` is the open plan (Status: in-progress, 5 open boxes);
step 7 (agent attribution) landed in `cf074d59`: `_attribution.data.js` (23 rows, 2 documented:
Claude Code from code.claude.com settings-reference, Gemini `none`), `applyAttribution`,
`setup --attribution <keep|hide>`, `--attribution-agent`, and one wizard question. Plans step 8 is partly done in `5205290b`:
`rule-mcp project add|remove`, the `update` walk, an uninstall that removes a project config file it
emptied, and two test files. Still open in step 8: the Claude extras in project scope, per-client
prompt suppression, numbering hooks per project, and the wizard Scope UI.
Known limit to accept or fix: the pruned `0` reaches a file the setup path or an uninstall touches, nothing else.
Restart the MCP server before trusting rule_tool_check/structural/handon: they served a stale build this session.
MCP guardrail tools answer with a self-update refusal in this environment; use eslint and the local suites.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```

## After the last window

- **Guardrails are green** (`7de49e0b`). `project-circular` and `project-dead-code` reported
  artefacts, not defects: JSDoc type reference is module name in comment that graph reads
  as import, and function reached through table, run-time import or test has no edge.
  Both checks now filter from source (`_circular.js`, `_dead-code.js`, `_source-comments.js`)
  and both take project root through `evaluate`. cycles that were real are gone: the
  manifest primitives, launchd label, resume record and target resolution each moved to
  leaf both sides import. `rule_tool_check`: 4 passing, 0 failed. Both suites: 743 and 2789, 0 fail.
