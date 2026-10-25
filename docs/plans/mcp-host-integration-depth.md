# mcp-host-integration-depth - per-host install/uninstall, integration levels, and the server-side wiring

Status: `planned`
Notes:`planned`. Outside the skills graph: this plan covers the installer, the host registries and
the server↔host wiring, not skills, so it is not a node in `docs/plans/skills/skills-plan.md`.
It is the sibling of `installer-scope-adr-policy-features.md` and depends on it for the host
path table.

## 1 - Why this plan exists

The installer answers one question today - _"where does each host keep its MCP entry?"_ - and
answers it in four places that do not agree:

| Registry                                                         | Answers                                            | Size today                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| `src/cli/installers/_catalog.js`                                 | which agents exist                                 | **23**                                                            |
| `src/core/agents/command-targets/_registry.data.js` + `_gaps.js` | where the slash commands go, or why they cannot go | **15 entries / 11 agents**, **13 documented gaps**                |
| `src/cli/install/_hook-hosts.js`                                 | which hook mechanism a host documents              | **15 hosts, 5 writable**                                          |
| `src/cli/installers/_registry.js` + `_uninstall.js`              | install and remove, per host                       | 23 installers, 23 uninstallers, **14 of them a generic fallback** |

The spike in `docs/spike/Slash-Commands-MCP-Complete-Obsidian/` measures **32 host notes**
(31 distinct products after the `windsurf → devin` merge) across CLI, IDE, hybrid and cloud
surfaces, each with a verification status: 13 `confirmed`, 2 `partial`, 2 `needs-test`,
2 `ambiguous`, 1 `migration`, 2 `plugin-dependent`, 8 `research`, plus the Codex/Copilot deep
dive. **Eight of those products have no installer row at all**: `aider`, `amp`, `continue`,
`cursor-cli`, `goose`, `junie`, `openhands`, `trae`.

And the integration the user actually gets is one-dimensional: the MCP entry, plus whatever
each installer happened to write. There is no vocabulary for "how deep", no way to ask for it,
and no way to remove exactly what was written.

## 2 - What is measured, and what it costs

| Finding                                                          | Evidence (measured 2026-10-25 in this tree)                                                                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The uninstaller does not remove what the installer wrote         | `installDevin` writes `~/.config/devin/skills/**`; `uninstallDevin` removes the config only                                                                                  |
| A generic uninstaller ignores the host's real path               | `installGeneric("droid")` writes `~/.config/factory/mcp.json`; `uninstallGeneric("droid")` reads `~/.config/droid/mcp.json`                                                  |
| Two hosts are removed from a path they were never installed into | `installNeovim` writes `~/.config/nvim/mcp.json`; `uninstallGeneric("neovim")` reads `~/.config/neovim/mcp.json`. Same for `emacs` (`init.el` vs `~/.config/emacs/mcp.json`) |
| Every generic host receives a guessed `instructions.md`          | `createGenericInstaller` writes `~/.config/<name>/instructions.md` with no documented path behind it                                                                         |
| The catalog registers JSON shapes for hosts that read TOML       | `zed` (`context_servers`), `vibe` and `grok` (`[[mcp_servers]]`) all go through the `mcpServers` JSON writer today                                                           |
| Two command writers, one uninstaller                             | installers write a legacy `rule.md`/`rule.toml` **and** `core/agents/command-targets` writes the full set; the uninstallers remove only the legacy file                      |
| A deprecated claim and a live one coexist                        | the spike says Roo Code is `confirmed`; `_hook-hosts.js` says the extension was shut down in May 2026                                                                        |
| The Codex command target contradicts the Codex study             | the installer writes `~/.codex/prompts/*.md` (ADR 179); the study records that upstream removed custom prompts in favour of Skills                                           |
| Hook coverage stops at 5 writable hosts                          | 13 catalog agents have a hook row, 10 have none, and only `claude`, `cursor`, `gemini`, `codex`, `kiro` can be written                                                       |
| The manifest records an agent name, not files                    | `recordInstall` stores `agents[]` and `dimensions{}`, so the uninstall re-derives paths instead of reading them                                                              |
| Lifecycle perf wiring is an inventory, not an implementation     | handoff 28, "Left out / next": _"MCP-performance lifecycle hooks inventory only; not implemented"_                                                                           |

## 3 - The integration ladder

Depth becomes a second install axis beside the profile (ADR 177): **the profile says how much of
the catalog is reachable, the level says how deeply the host is wired to it.**

| Level | Name       | What the installer writes                                        | Registry that answers it        | Buys                                                        |
| ----- | ---------- | ---------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `L0`  | `server`   | the MCP entry only                                               | `_catalog.js` + host file table | tools and prompts are callable, prefixed by the host        |
| `L1`  | `rules`    | `L0` + the instruction block in the host's memory file           | host record `rules`             | the agent follows the workflow without being told each turn |
| `L2`  | `commands` | `L1` + the bare `/rule-*` command files                          | `command-targets`               | a bare slash instead of `/mcp.rule-mcp.rule-backend`        |
| `L3`  | `hooks`    | `L2` + native lifecycle hooks where the host documents a file    | `HOOK_HOSTS`                    | the gates fire without the model choosing to run them       |
| `L4`  | `native`   | `L3` + an extension/plugin handler that calls the CLI dispatcher | host record `extension`         | no model in the loop: the command runs the code it names    |

Rules of the ladder:

1. **A host's ceiling is measured, not wished.** `hook-hosts` already carries `writable` and a
   `reason`; the extension row gets the same shape. A host that cannot reach `L3` says why, and
   the wizard never offers it.
2. **`L4` is not "better" than `L3` in general, it is deterministic** - the trade is a native
   module per host against a handler that runs a fixed command. Copilot's extension SDK is
   experimental and the plan says so at the point of choice.
3. **The level is per host, not per install.** Selecting Claude at `L3` and Zed at `L1` is the
   normal case, because ceilings differ.
4. **Levels are cumulative and idempotent**: installing `L3` over `L2` adds the hooks and touches
   nothing else; uninstalling `L3` removes exactly the hook files the manifest recorded.

Orthogonal wiring knobs, not levels, because they are not "depth" but per-host tuning:

| Knob        | Answers                                                  | Where it lands                                |
| ----------- | -------------------------------------------------------- | --------------------------------------------- |
| `prompts`   | keep the host's namespaced MCP prompts, or suppress them | `RULE_MCP_NO_PROMPTS` (already per host)      |
| `transport` | `stdio`, `daemon`, `docker`                              | `remoteModeAgents` (currently `pi`, `vscode`) |
| `surface`   | how much of the catalog reaches `tools/list`             | `--surface` (ADR 178)                         |
| `lifecycle` | prefetch on session start, invalidate after a write      | new: `RULE_MCP_HOST_LIFECYCLE`                |
| `keepAlive` | one server instance per session instead of per call      | host record `extension.keepAlive`             |

## 4 - One host record, one module per host

The four registries collapse into one record per host plus one module per host:

```js
// src/cli/installers/hosts/<id>.js
export default {
  id: "codex",
  label: "OpenAI Codex CLI",
  kind: "cli",
  evidence: { status: "confirmed", note: "…", sources: ["https://developers.openai.com/codex/skills"] },
  files: {
    server: { global: "~/.codex/config.toml", format: "toml", project: ".codex/config.toml" },
    rules: [{ path: "~/.codex/AGENTS.md", marker: "<!-- rule-mcp-rules -->" }],
    commands: { dirs: ["~/.codex/prompts"], format: "args", scope: "global", note: "upstream deprecates custom prompts in favour of skills" },
    hooks: { mechanism: "native", file: "~/.codex/hooks.json", events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"], writable: true },
    extension: null,
  },
  ceiling: "L3",
  install(level, ctx) { … }, // returns the files written, in order
  uninstall(record, ctx) { … }, // consumes the manifest record, not a re-detection
  detect(ctx) { … },
  doctor(ctx) { … }, // reports the achieved level and what is missing for the next one
};
```

`_catalog.js`, `_registry.js`, `_uninstall*.js`, `_detect.js`, `command-targets/_registry.data.js`
and `_hook-hosts.js` all read this table; a host that is in one and not the others becomes a
test failure instead of a support ticket.

## 5 - Install and uninstall, split per host and per level

- `rule-mcp install --agent <id> --level L0|L1|L2|L3|L4 [--dry-run]`, repeatable `--agent`,
  and `--level` accepted beside the profile so `setup` keeps one vocabulary.
- `rule-mcp uninstall` reads the manifest and removes per host, per level, per file. It never
  re-detects: a host the user edited by hand keeps their edit, and a host that moved its
  config path is removed where it was written.
- **Manifest v2** records what a v1 manifest cannot express:

  ```json
  { "version": 2, "hosts": { "codex": { "level": "L3", "written": ["~/.codex/config.toml", "~/.codex/AGENTS.md", "~/.codex/prompts/rule-mcp.md", "~/.codex/hooks.json"] } } }
  ```

  v1 stays readable: an install that finds a v1 manifest migrates it by re-detecting once and
  saying so.

- The `uninstall` command keeps its per-dimension confirmation (ADR 177) and gains the host list
  with the level achieved, because "remove Codex" and "remove Codex's hooks" are different asks.

## 6 - Making the server faster inside each host

The level says what is installed; this section says what the server does with it. Every item is
per host, because every item is a host capability.

| Wiring                                    | What it does                                                                      | Hosts that can do it                         | Effect                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `SessionStart` warm                       | route the handoff/session directive and pre-load the router's candidate set       | claude, codex, gemini, cursor, kiro          | the first prompt of a session does not pay a cold route |
| `UserPromptSubmit` prefetch               | run the router on the prompt text and cache the skill body before the model asks  | same five                                    | one cache hit instead of a tool round-trip              |
| `PostToolUse` invalidate                  | drop the cache entries for the files a write touched                              | same five                                    | no stale rule text after an edit                        |
| Overlay delivery with `additionalContext` | the guard report and the directive arrive as context, with no permission decision | same five                                    | zero extra turns, zero spurious approvals               |
| `statusMessage` on every hook             | a named, quiet line per hook                                                      | codex (already done), others where supported | observable without spending tokens                      |
| `--quiet` on hook invocations             | no banner, no decoration                                                          | all                                          | hook chatter costs no context                           |
| Prompt/command de-duplication             | one entry per action: files or MCP prompts, never both                            | already per host via `RULE_MCP_NO_PROMPTS`   | no duplicated slash menu                                |
| Per-host `surface`                        | a smaller `tools/list` for hosts with a noisy menu                                | all                                          | fewer tokens on every turn                              |
| `daemon` transport                        | one long-lived server instead of one process per call                             | verified for `pi`, `vscode`; probe the rest  | no process spawn per tool call                          |
| Resource links for large rule sets        | the rule body is fetched, not embedded                                            | hosts that render resources                  | a tool result stays small                               |

Everything in this table is measured before it is claimed: Phase 5 carries a before/after token
and latency measurement per host, on the three hosts that can be driven from a script in this
repository (`claude`, `codex`, `pi`).

## 7 - Phases

### Phase 0 - Refresh the evidence, one row per host

- [x] Give every one of the 31 spike products a `status` from the closed vocabulary already used there (`confirmed`, `partial`, `needs-test`, `ambiguous`, `migration`, `plugin-dependent`, `research`), with its source URL. Evidence: `src/cli/installers/hosts/_evidence.data.js`, 31 rows behind `tests/installers/host-evidence.test.mjs`. **Measured distribution**: 14 `confirmed` (the 13 the study frontmattered plus Codex, whose summary carries no frontmatter), 3 `partial` (Copilot, Kimi, Kilo), 2 `needs-test` (Kiro, Devin), 2 `ambiguous` (Grok, Vibe), 2 `plugin-dependent` (Emacs, Neovim), 1 `migration` (Antigravity), 7 `research`. By surface: 16 CLI, 9 IDE, 4 hybrid, 2 cloud.
- [x] Decide where the rows live, because Phase 1 consumes them and the port plan owns the path table: a data module beside the host modules, not a third table and not a table in this plan. `installer: false` marks the eight products with no `_catalog.js` row today, and `conflict` carries the two claims this tree makes elsewhere so item 2 has one place to resolve them.
- [x] Resolve the two contradictions the measurements found: Roo Code (spike `confirmed` vs the shut-down extension) and the Codex prompt directory (ADR 179 vs the Skill-first upstream). Resolved 2026-10-25 from the sources, not from either claim: **Roo Code** - the documentation is live and documents `.roo/commands/` and `~/.roo/commands/` with `description`, `argument-hint` and `mode`, so the row stays `confirmed` and `_hook-hosts.js` now says what was measured (no tool hook documented) instead of a shutdown that did not happen; **Codex** - the Skills documentation lists `$HOME/.agents/skills` as the user scope, so the primary target becomes `~/.agents/skills/<name>/SKILL.md` with `~/.codex/prompts/*.md` kept as a documented fallback. ADR 179 amended for both; the target change is Phase 2 work.
- [ ] Add the eight missing products (`aider`, `amp`, `continue`, `cursor-cli`, `goose`, `junie`, `openhands`, `trae`) as `research` rows with no installer behind them, so the gap is visible instead of implied.
- [ ] Gate: every catalog agent has exactly one evidence row; no row says `confirmed` without a source.

### Phase 1 - The host record and the per-host split (no behaviour change)

- [ ] Write the failing invariant test first: every catalog agent appears in exactly one of `command-targets` / `_gaps`, has one hook row (writable or with a reason), and one server path.
- [ ] Create `src/cli/installers/hosts/<id>.js` for the 23 catalog agents, mechanically extracted from `_agents-cli.js`, `_agents-ide.js`, `_agents-opencode.js` and `_uninstall*.js`.
- [ ] `_registry.js` and `_uninstall.js` become lookups over that directory; `command-targets` and `hook-hosts` read the same records.
- [ ] Gate: the existing installer suites pass unchanged, which is what "no behaviour change" means here.

### Phase 2 - The level ladder

- [ ] `install --agent <id> --level <Lx>` and the wizard's per-host level step, with the ceiling and its reason printed beside the choice.
- [ ] `ceilings` written into the host records from the evidence table, so the wizard cannot offer a level the host cannot reach.
- [ ] Codex's command files move to the Skill format: `~/.agents/skills/<name>/SKILL.md`, with `~/.codex/prompts/<name>.md` kept as the documented fallback (resolved 2026-10-25, ADR 179 amended). One target, one fallback, both recorded in the host record.
- [ ] Gate: for every host, `install L0..Lceiling` then `uninstall` leaves a pristine temporary `HOME` (a golden test per host).

### Phase 3 - Uninstall parity and manifest v2

- [ ] Manifest v2 (`hosts.<id>.written[]`), with a one-time migration from v1 that re-detects once and reports it.
- [ ] Fix the six asymmetries in section 2, each with a test that fails before the fix.
- [ ] `doctor` reports the achieved level per host and the one item missing for the next level.
- [ ] Gate: no uninstaller contains a path literal; every path comes from the host record.

### Phase 4 - The eight missing products

- [ ] Add a row per product behind `evidence.status`, install only where a documented file exists, and say "no documented config" where it does not.
- [ ] `cursor-cli` is its own row, not an alias of the Cursor IDE, because the two read different files.
- [ ] Gate: an install of a `research` row writes nothing and explains why; the wizard shows it disabled with the reason.

### Phase 5 - The server-side wiring

- [ ] Implement the five wiring items a hook file can carry (`SessionStart` warm, `UserPromptSubmit` prefetch, `PostToolUse` invalidate, `additionalContext` overlay, `statusMessage`), behind `RULE_MCP_HOST_LIFECYCLE`.
- [ ] Measure on `claude`, `codex` and `pi`: tokens per turn and wall time for the same three tasks, cold and warm.
- [ ] Decide the per-host default `surface` from that measurement, and record the numbers in the plan.
- [ ] Gate: the measurement is written down; an item that does not improve a number is removed rather than kept.

### Phase 6 - Documents, census, ADRs, doctor

- [ ] `docs/04-operations.md`: the level table, the per-host ceiling table, the `install --level` flags.
- [ ] `docs/13-cli.md` and the generated docs regenerated with `pnpm census`.
- [ ] Four ADRs (section 8), each recorded with `rule_tool_process_adr` at the moment the boundary changes.
- [ ] Gate: `/rule-init` and `doctor` report the same level for the same host.

## 8 - The ADRs this plan owes

| ADR (proposed)                                 | Decision                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| One host record, one module per host           | install, uninstall, detect, doctor, commands and hooks read one table instead of six    |
| Integration levels are the second install axis | `L0..L4` per host, with a measured ceiling; the profile still owns the catalog surface  |
| Manifest v2 records files, not agents          | an uninstall removes what was written and never re-detects                              |
| Lifecycle wiring is per host and measured      | prefetch/invalidate ship only for a host whose measurement moved, behind one env switch |

## Proposed invariants (tests, not prose)

| Invariant                                                                 | Where                                      |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| every catalog agent has one server path, one command answer, one hook row | `tests/installers/host-record.test.mjs`    |
| install at every level then uninstall leaves a pristine `HOME`            | `tests/installers/host-roundtrip.test.mjs` |
| no uninstaller carries a path literal                                     | `tests/installers/host-paths.test.mjs`     |
| a `research` host writes nothing                                          | `tests/installers/host-research.test.mjs`  |
| a level above the ceiling is refused with the reason                      | `tests/installers/host-level.test.mjs`     |

## Dependency graph

The host path table is the port plan's work, not this plan's, so the split in Phase 1 waits for
it rather than inventing a second table. Nothing in the skills graph depends on this plan.

Depends on: `installer-scope-adr-policy-features` (HARD)

Feeds: nothing in the skills graph; `/rule-init`, `doctor` and `docs/04-operations.md` read its tables

Shared files: src/cli/installers/_catalog.js, src/cli/installers/_registry.js, src/cli/installers/_uninstall.js, src/cli/installers/_uninstall-clis.js, src/cli/install/_hook-hosts.js, src/cli/install/_manifest.js, src/cli/install/_detect.js, src/core/agents/command-targets/_registry.data.js, src/core/agents/command-targets/_gaps.js, docs/04-operations.md, docs/13-cli.md, tests/fixtures/census.json

## Model assignment

Classes and evidence: section 14 of `docs/plans/plan-of-plans.md`.

| Step                                    | Class       | Model                    | Why                                                        |
| --------------------------------------- | ----------- | ------------------------ | ---------------------------------------------------------- |
| Phase 0 - evidence refresh              | `T6-review` | `muse-wonder-full` (max) | 31 products, two contradictions, sources that must resolve |
| Phase 1 - the mechanical split          | `T5-bulk`   | `minimax-m3.1-flash`     | 23 modules moved, no behaviour change, a test as the gate  |
| Phase 2 - the level ladder              | `T3-rules`  | `kimi-k2.7-code`         | small deterministic wiring in the installer                |
| Phase 3 - uninstall parity, manifest v2 | `T3-rules`  | `kimi-k2.7-code`         | path and record bookkeeping, test-first                    |
| Phase 4 - the eight products            | `T7-author` | `qwen3.8-max`            | evidence rows and honest `research` statuses               |
| Phase 5 - the wiring and the numbers    | `T4-tests`  | `deepseek-v4.1-flash`    | harness, measurement, then code                            |
| Phase 6 - documents and ADRs            | `T1-plan`   | `gemini-4-argon` (high)  | four boundaries argued in prose                            |

Plan default: `T3-rules` - `kimi-k2.7-code`. Fallback: `step-5-preview` for authoring, `glm-5.3-flash` for bulk edits.

## Verification gates

```bash
node --import ./scripts/alias-hook.mjs --test tests/installers/
node --import ./scripts/alias-hook.mjs --test src/cli/install/__tests__/
node --import ./scripts/alias-hook.mjs --test src/core/agents/command-targets/__tests__/
pnpm census && pnpm census:check
pnpm lint
```

## Open notes and risks

- **The mechanical split is the risk.** 23 modules in one commit is a big diff for a promise of
  "no behaviour change"; the invariant tests are the only reason it is safe, so they come first
  and the split lands per host family (CLI, IDE, generic) rather than in one commit.
- **The spike is documentation, not a test rig.** Its `status` values are honest labels, and
  this plan keeps the same honesty: a `confirmed` row still needs a source URL, and an
  end-to-end check per host is a Phase 4 deliverable, not an assumption.
- **`L4` is where the experimental APIs live.** Copilot's extension SDK is experimental and the
  Codex story is Skill-first; the ladder offers `L4` only where a host documents a handler, and
  says "experimental" at the point of choice.
- **The perf wiring must be measured or dropped.** Implementations behind a switch are cheap;
  forgetting to measure them is how an "inventory only" gap becomes folklore. Phase 5 has a
  number or an item leaves the table.
- **The port plan owns the paths.** If `installer-scope-adr-policy-features.md` step 3 has not
  landed, Phase 1 uses its table as written and does not create a competing one.
