# 025: Registry-driven clean slash commands for every agent and IDE

- **Date**: 2026-08-04
- **Status**: accepted
- **Tags**: architecture, cli, agents, slash-commands, vscode
- **Author**: rule-mcp-architect

## Context

Every MCP host namespaces prompts server exposes, and none of them let server drop prefix:

- Claude Code -> `/rule:rule-backend (MCP)`
- VS Code (Copilot Chat) -> `/mcp.rule-mcp.rule-backend`

Only host's own command/prompt **files** are invoked bare (`/rule-backend`). ADR 020 solved this for Claude Code and Pi with user-level command files plus `RULE_MCP_NO_PROMPTS=1`, but knowledge of _which directory, which format, which host_ was spread across three places: per-agent installers (`src/cli/install.js`), hand-maintained installer script (`scripts/install-agent-commands.sh`) and hand-maintained path list in `scripts/uninstall.sh`.

Consequences of that split: VS Code was never covered (its commands stayed prefixed), and nothing structurally prevented the next new agent from being forgotten the same way.

## Decision

Add `src/core/agent-command-targets.js` as the **single registry** of clean-command targets. One entry per (agent, scope): label, render format, scope (`global`/`project`), `detect()` gate, and pure `dirs(ctx)` resolver with `exists`/`listDir` injected - so whole registry is unit-testable for any platform without touching filesystem.

Everything else derives from it:

1. `installAgent`/`uninstallAgent` write and remove command set **centrally** for every agent; ad-hoc per-installer writes (Claude, Pi, Gemini, Cursor) are gone.
2. `commandConfig` sets `RULE_MCP_NO_PROMPTS=1` for any host flagged `namespacedPrompts` (Claude, VS Code) instead of hardcoding `"claude"`.
3. `agent-commands --targets` and `agent-commands --sync [--remove]` expose resolved directories; `scripts/install-agent-commands.sh` and `scripts/uninstall.sh` call them instead of listing paths.
4. `doctor` reports installed/expected command files per directory and prints `--sync` fix when host is short.
5. Agents with no verified command-file location live in `AGENTS_WITHOUT_COMMAND_SURFACE` **with reason**. `test/agent-command-targets.test.mjs` fails when agent appears in neither list - that test is the "always, for every agent/IDE" guarantee.

VS Code support arrives as new `prompt` render format: `<name>.prompt.md` with `description` + `argument-hint` frontmatter, written to user-data `prompts/` directory of every installed variant (Code, Insiders, Code-OSS, VSCodium) and every profile, since prompt files are profile-scoped. Formats whose host does not substitute arguments (`prompt`, `plain`, `workflow`) replace `$ARGUMENTS` with prose, so meaningless literal token never reaches model. Newly covered hosts: **VS Code, Roo Code, opencode**.

## Consequences

**Positive**

- new agent cannot silently ship with prefixed-only commands - coverage test blocks it.
- Installer, uninstaller and doctor cannot drift from registry.
- VS Code finally gets bare `/rule-mcp-*` commands with no duplicate `/mcp.rule-mcp.*` entries.
- remaining gaps are explicit, reasoned and reviewable instead of invisible.

**Negative**

- Existing installs must re-run `rule-mcp install --agent <name>` (or `agent-commands --sync`) and restart host to pick up files and suppression flag.
- Daemon/SSE installs carry no `env`, so those hosts still show prefixed prompts (one daemon serves every client).
- VS Code workspace `.github/prompts` directory is deliberately not written - team-shared prompt files stay manual opt-in - because 24 generated files would land in user's git status.
- Every profile of every installed VS Code variant receives full (~24 file) set.

## Alternatives considered

- **Shorten MCP server name** so host prefix hurts less - rejected: `/mcp.w.rule-backend` is still prefixed and destroys discoverability.
- **Ship Claude plugin** - rejected in ADR 020: plugin commands are namespaced `/plugin:command`.
- **Keep per-installer writes and add VS Code by hand to each script** - rejected: that drift is exactly what left VS Code uncovered.
- **Auto-write `.github/prompts` in every repo** - rejected: pollutes user's working tree.
