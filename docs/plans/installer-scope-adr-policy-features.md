# Port plan: ADR policy, project installs, features, host paths

Status: `in-progress`
Notes: outside the skills graph: this plan covers repository policy and the installer, not skills, so
it is not a node in `docs/plans/skills/skills-plan.md` and is tracked on its own.

A sibling project shipped this set of installer and documentation changes on 2026-10-18. This plan
replays it here, adapted to this repository's names (`rule-mcp`, `RULE_MCP_*`,
`rule_tool_process_adr`, `/rule-handoff`, `~/.rule-mcp/`). A port is a merge, not a copy: diff each
subsystem first and keep what this repository already does better.

Rules for every step: tests first, Conventional Commits with a scope, never push, run the full
gates (`pnpm run ci`), and run the guardrail check on every changed file.

## What exists here today

Checked on `main` at `46f84e5a`:

| Capability                                      | Here today                                                |
| ----------------------------------------------- | --------------------------------------------------------- |
| ADR policy (`full` / `handoff` / `on-demand`)   | landed (ADR 195); default `handoff`                       |
| Pending ADRs numbered on landing                | landed (ADR pending step 5); `_pending/` + `handoff land` |
| Index merge driver, `post-merge`/`post-rewrite` | landed (`.gitattributes` + `.githooks/post-*`)            |
| Install scope `project` for MCP configs         | flags landed (ADR 193); wizard Scope UI still open        |
| Feature toggles (`feature list/enable/disable`) | absent; switches are raw env vars                         |
| Agent attribution switch (per agent, table-driven) | absent                                                 |
| Path completion in the setup wizard             | absent                                                    |
| Vendor-documented generic host paths            | partial: most hosts still use `~/.config/<name>/mcp.json` |
| JetBrains config                                | `~/.junie/mcp/mcp.json` (Junie user file; done step 2)    |
| Project rules block refresh                     | absent                                                    |
| Numbering doctor rename threshold               | `-M70%` before `--follow` (ADR 194)                       |

## Order

Quick wins first: they are independent and small. Then the ADR stack, then the installer stack,
which depends on it.

### Step 1 - Numbering doctor follows only real renames (quick win) - DONE (ADR 194)

Problem: `git log --follow` treats any file at least 50% similar to a deleted one as a rename, so a
new document built on the same template inherits the deleted one's date and author.

1. Test `tests/docs/numbering-created-at.test.mjs` (or under `src/core/docs-numbering/__tests__/`):
   a temp repo, a 10-line file committed in January, deleted in February together with a new file.
   - 60% similar: the new file keeps February and its own author.
   - 90% similar (a real rename): it keeps January and the first author.
   - Commit with `-c core.hooksPath=/dev/null --no-verify` so global hooks cannot block.
2. `src/core/docs-numbering/_git.js`: add `const RENAME_SIMILARITY = "-M70%";` with a JSDoc on why
   (distinct ADRs measured at most 32% similar, real renames at least 85%), and pass it to both
   `git log` calls (`createdAt` and the author lookup) before `--follow`.
3. Measure on this repository's own ADRs before trusting 70%.
4. Commit: `fix(docs): follow only real renames when dating a numbered document`.

### Step 2 - JetBrains goes to Junie's file (quick win) - DONE

JetBrains AI Assistant documents no config file (servers live in the IDE settings). Junie, in the
IDE and the CLI, documents `~/.junie/mcp/mcp.json` (user) and `.junie/mcp/mcp.json` (project), both
`mcpServers`.

1. [x] Tests: install/uninstall `jetbrains` in a throwaway `HOME` (`_jetbrains-junie.test.mjs`).
2. [x] `junieConfigPath` + jetbrains installer write `~/.junie/mcp/mcp.json`.
3. [x] `hostRecord("jetbrains")` drives uninstall/detect (no cwd `.idea`).
4. [x] Docs note in `docs/01-getting-started.md` (ADR 191).
5. [x] Old `.idea/mcp.json` is never swept.
6. Commit: `fix(setup): install JetBrains into the file Junie reads`.

Project-scope `.junie/mcp/mcp.json` waits on step 8.

### Step 3 - Generic hosts at their documented paths

One table, read by install, uninstall and detection, so the three cannot disagree. Create
`src/cli/installers/_hosts.data.js`:

| Host        | User-level file                                                       | Format            |
| ----------- | --------------------------------------------------------------------- | ----------------- |
| cline       | `~/.cline/data/settings/cline_mcp_settings.json`                      | `mcpServers`      |
| roo         | `~/.config/roo/mcp.json` (no documented file)                         | `mcpServers`      |
| zed         | `~/.config/zed/settings.json` (Windows `%APPDATA%\Zed\settings.json`) | `context_servers` |
| opencode    | `~/.config/opencode/opencode.json`                                    | `opencode`        |
| antigravity | `~/.gemini/config/mcp_config.json`                                    | `mcpServers`      |
| kilo        | `~/.config/kilo/kilo.json`                                            | `opencode`        |
| kimi        | `~/.kimi-code/mcp.json`                                               | `mcpServers`      |
| vibe        | `~/.vibe/config.toml`                                                 | `[[mcp_servers]]` |
| grok        | `~/.grok/config.toml`                                                 | `[mcp_servers.x]` |
| droid       | `~/.factory/mcp.json` (here today: `~/.config/factory/mcp.json`)      | `mcpServers`      |
| kiro        | `~/.kiro/settings/mcp.json`                                           | `mcpServers`      |
| qwen        | `~/.qwen/settings.json`                                               | `mcpServers`      |

1. Test file: for each host, install into a temp `HOME`, assert the file and its shape, detection
   at that path, idempotent reinstall, and uninstall removing the entry. Assert the legacy
   `~/.config/<name>/mcp.json` is not written.
2. A `_host-formats.js` with `upsertHostServer(format, text, config)` / `removeHostServer`, plus
   TOML writers for vibe and grok.
3. Uninstall and detection also check the legacy `~/.config/<name>/mcp.json`, so an old install can
   still be found and removed.
4. Commit: `fix(setup): write generic hosts to their documented config paths`.

**Done 2026-10-25** (from the host plan, which needed this table before Phase 1):

- `src/cli/installers/_hosts.data.js` - one row per generic host: the documented file, the dialect, the paths earlier releases wrote, and the evidence status the 2026-10-25 study gave the product. Paths resolve at call time, so a test with a temporary `HOME` sees them.
- `src/cli/installers/_host-formats.js` - `upsertHostServer` / `removeHostServer` per dialect: `mcpServers`, Zed's `context_servers`, opencode's own schema, `[[mcp_servers]]` with a `name` key (Vibe), `[mcp_servers.<name>]` (Grok). A file the writer cannot parse answers `null` and the caller refuses it instead of overwriting.
- install, uninstall and detection all read the table. The paths this replaced were wrong for six hosts: `antigravity` (`~/.gemini/config/mcp_config.json`), `droid` (`~/.factory/mcp.json`, and the old uninstaller read a different path again), `kimi` (`~/.kimi-code/mcp.json`), `cline` (`~/.cline/data/settings/cline_mcp_settings.json`), `kilo` (opencode's schema) and `zed` (`context_servers`). Neovim and Emacs got their own uninstallers, because they had been reading a `mcp.json` nothing ever wrote.
- No instructions file for a generic host any more: `~/.config/<name>/instructions.md` was a path no host documents.
- Evidence: `src/cli/install/__tests__/_hosts-paths.test.mjs` (7 assertions, table-driven over the 12 hosts), `src/cli/` 648/650 green, and an end-to-end run that installs six hosts, detects all six, and removes each entry including the two legacy droid files.

### Step 4 - ADR policy - DONE (ADR 195)

1. `src/core/docs/adr-policy/` (or `src/core/adr-policy/` to match this tree):
   - `_words.data.js`: categories `schema`, `dependency`, `api`, `infra`; levels `full`, `handoff`,
     `on-demand`; aliases `decision` -> `full`, `off` -> `on-demand`; `POLICY_FILE = ".context/adr.json"`,
     `POLICY_ENV = "RULE_MCP_ADR_POLICY"`.
   - `_resolve.js`: the first source that parses answers whole, never merged:
     `.context/adr.json` (nearest, up to the repo root) -> env var (a level or JSON
     `{"default":"handoff","categories":{"dependency":"full"}}`) -> the same key in
     `~/.rule-mcp/config/env.json` -> default `handoff`.
   - `_rule.js`: `ADR_RULE` (static text for rules blocks and generated commands) and
     `adrRule(policy, { terse })` (for surfaces that run inside a project).
2. `rule_tool_process_adr` gains `category` and `moment` (`handoff` or `task`, default `task`) and
   answers "Not written" with the rule when the policy does not allow the call.
3. Replace every "record decisions without being asked" line (rules block, reminder, router
   follow-up, `ADR.md` footer, handoff body) with the policy rule.
4. Add the policy to the router cache key.
5. `RULE_MCP_AUTO_ADR` writes nothing when the ADR feature is off.
6. Tests: resolution order, aliases, per-category override, the tool refusing a mid-task call
   under `handoff`.
7. One ADR (pending, see step 5).
8. Commit: `feat(adr): write ADRs when a policy says so, at handoff by default`.

### Step 5 - ADR numbers given on landing - DONE

1. Off the trunk, `rule_tool_process_adr` writes `docs/adr/_pending/<slug>.md` and refers to it as
   `ADR <slug>`.
2. `src/core/docs/adr-pending/`:
   - `_list.js`: the pending ADRs, ordered by first add commit, ties by slug.
   - `_land.js`: on the trunk, give each the next number and rewrite every reference. It must be
     deterministic, so two people landing the same pull write the same tree.
   - `_settle.js`: off the trunk, separate documents a merge left on one number.
   - `_merge-index.js`: a git merge driver for `ADR.md` and `HANDOFF.md` that regenerates instead of
     merging.
3. CLI: `rule-mcp handoff land [--commit] [--quiet]` and
   `handoff merge-index <O> <A> <B> <P>`.
4. Git: `.githooks/post-merge` and `post-rewrite` run `handoff land --quiet --commit`.
   `.gitattributes` gets `docs/adr/ADR.md merge=<driver>` and `docs/handoff/HANDOFF.md merge=<driver>`.
5. `src/core/git-hooks/`: plan -> apply -> remove for those hooks and the driver, idempotent (a
   second run is all "preserve"), private variant (`.git/info/attributes`) for local installs.
6. `/rule-handoff`: run `handoff land --commit` before writing ADRs, then pass `moment: "handoff"`.
7. Watch out: a squash gives every pending ADR the same add commit, so the landing order becomes
   alphabetical. Regenerate the index after a squash (`handoff doctor --fix`).
8. Commit: `feat(adr): number pending ADRs when they land on the trunk`.

### Step 6 - Features - DONE (ADR 197)

1. `src/core/runtime/features/_catalog.data.js`: each feature a list of levels (default first),
   each level the env keys it writes (`null` removes the key):
   - `adr`: on, off (`NO_ADR`). Off removes `rule_tool_process_adr`, `rule_tool_handoff`,
     `rule_tool_handon`, `/rule-handoff`, `/rule-handon`, the rule line and the numbering hooks.
   - `telemetry`: full, anonymous (no prompt text, machine id or client name), off.
   - `update`: auto, notify, off.
   - `tokensave`: on, autotrack (also `tokensave branch add`), off.
   - `minimal-tools`: off, on.
2. `READERS`: each feature's level read back from env, legacy keys included.
3. Saved to `~/.rule-mcp/config/env.json`, which every server reads at start.
4. CLI `rule-mcp feature list | enable <id> [--level x] | disable <id> [--dry-run]`: writes the
   level, then re-applies the remembered global install and every recorded project (step 8), so
   rules, commands and hooks follow it.
5. `setup --feature id=level` (repeatable), `setup --adr-policy <level>`, and a Features step in the
   wizard with one level screen per multi-level feature.
6. Commit: `feat(setup): own every user-facing switch as a feature`.

### Step 7 - Agent attribution

Attribution is not a Claude Code setting with a vendor name on it. Every agent that writes commits,
pull requests or trailers does it in its own place and its own way, or documents nothing at all. The
subsystem is therefore a table with one row per agent and a mechanism per row, not a switch wired to
one vendor's key.

Mechanisms, agent-independent, so a row names one of these and nothing else:

| Mechanism        | What the agent does                                              |
| ---------------- | ---------------------------------------------------------------- |
| `commit-trailer` | appends a co-author or tool trailer to the commit message        |
| `pr-body`        | appends a line to the pull or merge request body                 |
| `tool-signature` | stamps the tool name into message footers it generates           |
| `none`           | documents no attribution control - the row states it, no writer  |

1. `src/cli/installers/_attribution.data.js`: one row per agent in `allAgents()` (23 today), read by
the writer, the wizard and `--dry-run`, the way `_hosts.data.js` is read by install, uninstall and
detection. A row carries `{ agent, mechanism, file, key, keep, hide, evidence }`. `keep` and `hide`
are the values that agent reads; `evidence` is the vendor page the row came from, or `unverified`.
   - **A row is written only with `evidence` filled.** An `unverified` row has no values and produces
     no writer: the install prints `<agent>: attribution not documented here` and touches nothing. The
     table states what is not known instead of implying a control that was never read.
   - The 2026-10-28 pass found no vendor page in this checkout, so the research step comes first and
     lands row by row; Claude Code's `attribution` key stays the first row, as the one a sibling
     project already exercised, and still needs its page cited.
2. `src/cli/installers/_attribution.js`: `applyAttribution(agent, text, { mode })` over the row's own
   dialect - JSON through `_writers-json.js`, TOML through the `_host-formats.js` writers. Invariants,
the same for every agent: a value the user set stays; `hide` replaces only the exact value an install
wrote; a file the writer cannot parse is refused, never overwritten; nothing is written into a
project unless the install is project-scoped.
3. `setup --attribution <keep|hide>` applied to every agent whose row is `documented`, plus
   `--attribution-agent <id>` (repeatable) to narrow it; the wizard asks once and lists which agents
   it will not touch, with the reason.
4. Tests first, table-driven: an agent with a documented row flips to `hide` and back; a value the
   user set, or wrote themselves before the install, survives both directions; an `unverified` row
   leaves its file byte-identical; a shared project install writes no attribution; a TOML row and a
   JSON row both round-trip.
5. ADR when it lands: attribution is per agent and table-driven, and an undocumented agent is left
   alone rather than guessed.
6. Commit: `feat(setup): own attribution per agent instead of for Claude Code alone`.

### Step 8 - Project-scope install (slice A DONE: table + writer + written[])

1. `src/cli/installers/_project-hosts.data.js`: where each host reads a project config.

   | Host              | File                                     | Local (private) file              |
   | ----------------- | ---------------------------------------- | --------------------------------- |
   | claude            | `.mcp.json` (shared)                     | project entry in `~/.claude.json` |
   | copilot, pi       | `.mcp.json`                              | -                                 |
   | codex             | `.codex/config.toml`                     | -                                 |
   | cursor            | `.cursor/mcp.json`                       | -                                 |
   | vscode            | `.vscode/mcp.json` (`servers`)           | -                                 |
   | gemini            | `.gemini/settings.json`                  | -                                 |
   | qwen              | `.qwen/settings.json`                    | -                                 |
   | roo               | `.roo/mcp.json`                          | -                                 |
   | kiro              | `.kiro/settings/mcp.json`                | -                                 |
   | droid             | `.factory/mcp.json`                      | -                                 |
   | devin             | `.devin/mcp_config.json`                 | `.devin/mcp_config.local.json`    |
   | kimi              | `.kimi-code/mcp.json`                    | -                                 |
   | vibe              | `.vibe/config.toml`                      | -                                 |
   | grok              | `.grok/config.toml`                      | -                                 |
   | opencode          | `opencode.json`                          | -                                 |
   | zed               | `.zed/settings.json` (`context_servers`) | -                                 |
   | jetbrains (Junie) | `.junie/mcp/mcp.json`                    | -                                 |

   No project file is documented for cline, antigravity, neovim, emacs, windsurf. kilo's docs name
   two files, so wait. Use `.mcp.json` for pi rather than `.pi/mcp.json`: `.pi/` may be a symlink
   to `.agents/`.

2. [x] `src/cli/installers/_install-project.js` + `_project-hosts.data.js` (ADR 192). A shared entry is
       `{ command: "rule-mcp", args: ["serve"] }` with no machine paths. A local entry carries the
       full launcher and `RULE_MCP_ADR_POLICY` when set. A host with no local file throws
       "`<agent>` has no local project config: use --project-config shared". Manifest `hosts[].written`
       merges paths.
3. Claude shared: the short instruction block in `CLAUDE.md`, the commands in `.claude/commands/`,
   hooks and attribution in `.claude/settings.json` (`settings.local.json` for local).
4. Prompt suppression per client: `RULE_MCP_NO_MCP_PROMPTS` accepts `1` or a comma list of MCP
   client names. A shared `.mcp.json` sets `claude-code`, because copilot and pi read the same file
   and get no command files.
5. [x] Setup: `--scope global|project`, `--project <path>` (repeatable), `--project-config local|shared`
       (ADR 193). A shared install is stdio only and writes nothing global (no skills, service or remember).
       Flag path only in this slice; wizard Scope UI stays item 9.
6. [x] `~/.rule-mcp/state/projects.json` records each project install. `setup --refresh-projects`
       and `setup --uninstall` walk it (ADR 193). `update` walk still open with the global update path.
7. `rule-mcp project add [path] [--project-config] [--agent]` copies the last recorded
   project's configuration; `project remove [path]` takes back every config and forgets it.
   `/rule-init` adds its own project when the install is per project.
8. Each project also gets the numbering hooks and merge driver from step 5.
9. Wizard: a Scope step (global / project), a project list with the cwd offered, `p` to type a
   path, then a Project config step (shared / local).
10. One test file per concern: hosts table, Claude project, membership, record, git, scope; each
    under the 150-line cap.
11. ADR: a project-scope install writes only into the chosen projects.
12. Commit: `feat(setup): install into chosen projects`.

### Step 9 - Path completion in the wizard

1. `src/cli/setup/_path-complete.js`:
   - `expandPath(text, cwd)`: `~` and relative paths.
   - `isSensitiveDir(path)`: `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.gnupg`, `~/.password-store`,
     `~/.kube`, `/etc/ssh` are never listed.
   - `suggestPaths(text, cwd)`: null without a `/`. A token ending in `/` lists every folder,
     dot folders included. A partial name filters by case-insensitive prefix and shows dot
     folders only once a dot is typed. It skips names with control characters (macOS `Icon\r`),
     offers folders only, sorts with `localeCompare`, and returns
     `{ prefix, items: [{ name, value }] }` with `value` ending in `/`.
2. `src/cli/setup/_widget-path.js` (`PathInput`):
   - Tab opens a menu (8 visible, `n/total` footer); Tab or Enter applies the selection.
   - Up and down wrap around.
   - Esc closes the menu, or goes back when none is open.
   - Typing closes the menu.
   - Enter accepts the text only when it names a folder; otherwise "Not a folder: <path>".
   - Count backspaces per character: a burst arrives as one chunk.
3. Tests: `suggestPaths` over a temp tree; the widget driven by keystrokes in the fake terminal.
4. Commit: `feat(setup): complete project paths from a scrollable menu`.

### Step 10 - Refresh an existing project rules block

A global install never writes into a project, so a rules block a project carries keeps its old
text forever.

1. Test: a project whose `CLAUDE.md` holds a stale `<!-- rule-mcp-rules -->` block plus its
   own text, and an `AGENTS.md` without one.
   - The refresh replaces the block and keeps the text.
   - It leaves `AGENTS.md` alone and creates no file.
   - A second run reports `current`; a dry run writes nothing.
   - The project refresh plan has a `rules:<project>` step; `init` returns `rules`.
2. `src/cli/installers/_rules-project.js`: `refreshProjectRules(project, { dryRun })` over
   `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`. It touches only files that already carry
   the marker, using the same strip-and-append the global writer uses.
3. A `projectRulesTask({ project })` step in every project install, before the git step.
4. `init`: call it and print a "Rules block:" line.
5. Commit: `feat(setup): refresh an existing project rules block on init and project installs`.

### Step 11 - Documentation

1. `docs/03-agent-instructions.md`:
   - An "ADR policy" section with the level table and the source order.
   - A "Where the rules live" section: global targets, plus the project refresh by init and project
     installs.
   - Replace any "record decisions without being asked" wording.
   - Explain `NO_MCP_PROMPTS=claude-code` for shared projects.
2. `docs/04-operations.md`:
   - "Install into chosen projects" (shared vs local, recorded list, `project add/remove`, hosts
     without a project file).
   - "Features" (table and commands).
   - "Agent attribution": the mechanism table, the agents with a documented row, and the ones the
     install deliberately leaves alone.
3. `docs/05-env-variables.md`: `RULE_MCP_ADR_POLICY`, `NO_ADR`, `TELEMETRY` (full/anonymous/off),
   `NO_MCP_PROMPTS` (client list), and the feature -> env key table.
4. `docs/08-engineering-guides.md`:
   - The init table: numbering hooks, merge driver, rules refresh, project install.
   - The handoff section: `handoff land` and `_pending/`.
5. `docs/13-cli.md` and the census files: regenerate with the repo's generator (`feature`,
   `project`, `handoff land|merge-index`, the new `setup` flags).
6. Commit: `docs(project): document ADR policy, project installs, features and rules refresh`.

## Verification at the end

```sh
pnpm run ci
rule-mcp commits --range main..HEAD
rule-mcp feature list
rule-mcp setup --scope project --project /tmp/try --project-config shared --dry-run
rule-mcp handoff doctor
```

Then `/rule-handoff close-feature` and hand the person the close command. Never push.

## Dependency graph

Absorbed or outside the graph: listed for completeness, not executed as a node.

Depends on: -

Feeds: `mcp-host-integration-depth` (HARD, on the host path table this plan writes)

Shared files: none: outside the skills graph

## Steps

- [x] Diff each ported subsystem against this repository and keep what is already better.
- [ ] Step 7 - Agent attribution: the table, the writer, `setup --attribution`, its tests.
- [ ] Step 8 - leftovers: `rule-mcp project add|remove`, the `update` walk, the Claude extras in
      project scope, the wizard Scope UI, one test file per concern.
- [ ] Step 9 - Path completion in the wizard.
- [ ] Step 10 - Refresh an existing project rules block.
- [ ] Step 11 - Documentation.

## Diff audit (2026-10-28)

The sibling checkout is not on this machine, so the diff ran against the steps above and the tree as
it stands on `rel/v0.1.0`. Per subsystem, what landed and where this repository kept its own answer:

| Subsystem | Here | Kept over the port |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Numbering doctor | `src/core/docs-numbering/_git.js` | `-M70%` before `--follow` (ADR 194), measured on these ADRs; the port followed at the default threshold |
| Generic host paths | `src/cli/installers/_hosts.data.js`, `_host-formats.js` | One table read by install, uninstall and detection, with per-host evidence status and the legacy paths still swept |
| JetBrains | `_jetbrains-junie` install path | Junie's `~/.junie/mcp/mcp.json`; the old `.idea/mcp.json` stays untouched (ADR 191) |
| ADR policy | `src/core/adr-policy/` | Resolution order file -> env -> `~/.rule-mcp/config/env.json`, default `handoff` (ADR 195) |
| Pending ADRs | `src/core/docs/adr-pending/` | `_pending/` plus a merge driver that regenerates `ADR.md`/`HANDOFF.md` instead of merging (ADR 196) |
| Features | `src/core/runtime/features/_catalog.data.js`, `rule-mcp feature` | `tokensave autotrack` and `minimal-tools` levels, plus re-apply of the global install and recorded projects (ADR 197) |
| Project scope | `_install-project.js`, `_project-hosts.data.js`, `setup --scope/--project/--project-config` | stdio-only shared install that writes nothing global, `~/.rule-mcp/state/projects.json` walked by `--refresh-projects` and `--uninstall` (ADR 192, 193) |

Absent, so still open here and carried as written: `_attribution.data.js` and `_attribution.js`
(step 7), `_path-complete.js` and `_widget-path.js` (step 9), `_rules-project.js` (step 10),
`rule-mcp project add|remove` (step 8.7), the wizard Scope UI (8.9), the `update` walk (8.6) and the
documentation set (step 11).

## Model assignment

Classes and evidence: section 14 of `docs/plans/plan-of-plans.md`.

| Step           | Class      | Model            | Why                                                      |
| -------------- | ---------- | ---------------- | -------------------------------------------------------- |
| the whole plan | `T3-rules` | `kimi-k2.7-code` | installer and ADR-policy code paths: small precise edits |

Plan default: `T3-rules` - `kimi-k2.7-code`. Fallback: `step-5-preview` for authoring, `glm-5.3-flash` for bulk edits.
