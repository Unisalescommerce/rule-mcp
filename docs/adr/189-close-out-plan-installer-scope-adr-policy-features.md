# 189: Close out the port plan for ADR policy, project installs, features and host paths

- **Date**: 2026-10-29
- **Status**: accepted
- **Tags**: docs, closeout, plan, installer
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`docs/plans/installer-scope-adr-policy-features.md` replayed eleven steps of installer and documentation work that a sibling project shipped on 2026-10-18, adapted to this tree's names (`rule-mcp`, `RULE_MCP_*`, `rule_tool_process_adr`, `~/.rule-mcp/`). Every step is closed and verified against the code, not against the plan's own claims. The record is 418 lines of narration; what matters after it closes is what landed, what changed while landing, and what is still open.

## Decision

Fold the record into this ADR and delete the source file. What each step landed:

| Step | What landed                                                                                                                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Numbering doctor follows only real renames: `-M70%` before `--follow` in both `git log` calls (ADR 185)                                                                                                                                                    |
| 2    | JetBrains installs into `~/.junie/mcp/mcp.json`, the file Junie documents; `.idea/mcp.json` is never swept (ADR 182)                                                                                                                                       |
| 3    | `_hosts.data.js` plus `_host-formats.js` (mcpServers, `context_servers`, opencode's schema, `[[mcp_servers]]`, `[mcp_servers.<name>]`); six hosts moved off a path they do not document                                                                    |
| 4    | `src/core/adr-policy/` with words, resolve and rule; `category` and `moment` on `rule_tool_process_adr` (ADR 186)                                                                                                                                          |
| 5    | `docs/adr/_pending/` off the trunk, `handoff land` and `handoff merge-index`, the git hooks and attributes (ADR 187)                                                                                                                                       |
| 6    | `src/core/runtime/features/` with five features and their env patches, `feature list\|enable\|disable`, the wizard step (ADR 188)                                                                                                                          |
| 7    | `_attribution.data.js`: 23 rows, 2 documented, 21 left alone; `applyAttribution`, `setup --attribution`, `--attribution-agent`, one wizard question                                                                                                        |
| 8    | `_project-hosts.data.js` (17 hosts), the project writers, the Claude extras, `RULE_MCP_NO_MCP_PROMPTS` with client identity, `--scope/--project/--project-config`, `projects.json`, `project add\|remove`, the per-project git task, the wizard Scope step |
| 9    | `_path-complete.js` and the path field: reducer, menu, acceptance rule, mounted by the screen, refused when the path is not a folder                                                                                                                       |
| 10   | `_rules-project.js` refreshes a rules block a project already carries; a step in every project install and a line in `init`                                                                                                                                |
| 11   | `03`, `04`, `05`, `08` sections; `13-cli.md` and the census regenerated; 66 variables read, 66 documented                                                                                                                                                  |

Four items changed while landing, and the plan now says so: per-client prompt suppression was not blocked on a consumer (the consumer was `promptsSuppressed`; the missing piece was the client's identity), the rules task id is `project-rules:<root>`, no documented attribution row lives in TOML so no TOML writer exists to test, and the Scope prompt's typed path called a screen mode the renderer never implemented.

## Consequences

- The installer writes into a project only when asked, and the project keeps the git side of ADR numbering whether or not anyone remembers to wire it.
- Three defects surfaced through the port and were fixed with it: the telemetry level wrote the slash-menu key (`RULE_MCP_NO_PROMPTS`), the style fixer inserted a blank the guardrail forbids and so reported a file done forever, and a handon unit test swept this repository's own completed plans.
- Six ADRs stay pending in `docs/adr/_pending/` and take numbers when they land on the trunk.
- The plan file is gone from the tree; this ADR is what a later reader gets without `git log`.

## What would end this

The list form of `RULE_MCP_NO_MCP_PROMPTS` is worth its complexity only if clients send a usable `clientInfo.name` or a deployment sets `RULE_MCP_CLIENT`. If a survey of real entries finds neither, the key collapses back to the global `1` and this ADR is superseded rather than amended.
