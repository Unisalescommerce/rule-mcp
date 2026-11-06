# Handoff: clean /rule-mcp-* commands and the reinstall command

**Branch:** main
**Commits covered:** `8e3d5547..02a0d11d` (5 commits)
**Date:** 2026-09-17

## Session Summary

Closed two defects in install surface and added one dev convenience command.
First, MCP prompt suppression was configured but never honored on wire, so
Claude Code kept showing `/rule:rule-handoff` instead of clean
`/rule-handoff`. Second, multi-agent install resolved zero command targets and
wrote no `/rule-mcp-*` files at all. Third, `reinstall` became one shell script
behind three entry points.

## Work Completed

### 1. Prompt suppression now reaches the client

- `src/cli/installers/_env.js` adds `RULE_MCP_NO_PROMPTS: "1"` to
  `DEFAULT_OPTOUT_ENV`, so installer-written environment hides MCP prompts by
  default (`6cec5b09`).
- `src/server/_prompt-handlers.js` was calling `listPrompts()` (always-full
  registry) in `ListPromptsRequestSchema` handler instead of
  `listActivePrompts()`. env var so had no effect on what client
  received. Switched to `listActivePrompts()` (`cab5ae9d`).
- Test: `src/server/__tests__/_prompt-handlers.test.mjs` (3 pass, 0 fail).

### 2. Multi-agent installs write the full command set

- Root cause: wizard joins selected agents with commas into one
  `agent-commands --sync` argv, but `resolveCommandTargets` compared that raw
  string against each target's `agent` field. Two or more selected agents
  so matched no targets; only per-agent router file (`rule.md`) landed.
  156-file sync worked only with exactly one agent named.
- `src/core/agents/command-targets/_resolve.js` now parses `options.agent` as a
  comma-separated list (arrays accepted too) and filters through Set (`3b9b9da5`).
- `--agent` CLI description updated; regenerated `docs/12-cli.md` and
  `docs/02-product-architecture.md` to match.
- Tests: `src/cli/commands/__tests__/_targets-sync.test.mjs`,
  `src/cli/commands/__tests__/_coverage.test.mjs`.
- ADR 093.

### 3. Reinstall: one implementation, three entry points

- `scripts/reinstall.sh` owns sequence: purge `node_modules` and
  `pnpm-lock.yaml`, `pnpm install`, then `pnpm install -g .` to refresh the
  global bin. It runs from checkout it lives in and refuses directory
  without `package.json`.
- Entry points: `pnpm reinstall` (`package.json`), `rule-mcp reinstall`
  (registrar plus handler with injectable spawn, inheriting stdio), and the
  script directly (`eb86ca08`).
- CLI handler imports only Node built-ins and delegates to child process,
  so it survives purge of its own `node_modules`. Bash only; on Windows it
  needs Git Bash, like `mcp:install`.
- Tests: `src/cli/__tests__/_reinstall-command.test.mjs`,
  `src/cli/__tests__/_reinstall-script.test.mjs` (script runs in scratch copy
  with fake `pnpm` on PATH).
- ADR 094.

### 4. Lockfile refresh

- `chore(deps)`: bumped three transitive pins through browserslist,
  `baseline-browser-mapping` 2.11.23 to 2.11.24, `electron-to-chromium` 1.5.428
  to 1.5.430, `ip-address` 10.7.1 to 10.7.2 (`02a0d11d`).

## Open Issues

### ADR "What would end this" ships a placeholder

`generateAdr()` in `src/tools/adr/_body.js:34` falls back to template
sentence "assumption this leans on, and observation that would make it
wrong." when `endsWhen` is absent. MCP tool schema in
`src/tools/adr/_register.js` (call site around line 50) never accepts or forwards
`endsWhen` argument, so field is unreachable from `rule_tool_process_adr`.
29 files under `docs/adr/` now carry placeholder instead of real
falsification condition, including ADR 093 and ADR 094 written this session.

Next steps: add an `endsWhen` string to the ADR tool input schema, forward it
through `_register.js` and `src/tools/handoff/_closeout.js`, then backfill the
29 affected ADRs and regenerate `docs/adr/ADR.md`.

### Skill display name in Claude Code App for macOS

Carried over from handoff 09 and still unresolved. CLI shows clean
`/rule-handoff`, app may still show `/rule:rule-handoff`. The
prompt-suppression fix in this session addresses MCP-prompt path; app
path was not verified. Investigate `src/cli/setup/_task-extras.js`,
`src/cli/setup/_commands-items.js` and `~/.claude/mcp.json`.

### Reinstall validation environment

`scripts/reinstall.sh` is POSIX-only and has not been exercised on Windows. Its
tests use scratch copy, so same shell dependency as `mcp:install` applies.

## Testing Status

- `src/server/__tests__/_prompt-handlers.test.mjs`: 3 pass, 0 fail (run
  `cab5ae9d`).
- Reinstall and agent-targets suites committed with their changes.
- No full-suite run is recorded in this session; trust per-area results above
  and rerun `pnpm test` before relying on tree as green.

## ADR Reference

- ADR 093: accept comma-separated agent list in agent-commands
- ADR 094: reinstall is one shell script behind three entry points
- ADR 025: registry-driven clean slash commands for every agent and IDE
- ADR 020: clean `/rule-mcp-*` commands via user commands and prompt suppression
- ADR 038: installer self-heals its global shim (background on pnpm global bin)

## References

- `scripts/reinstall.sh`
- `src/cli/commands/_reinstall.js`, `src/cli/_register-reinstall.js`
- `src/core/agents/command-targets/_resolve.js`
- `src/cli/installers/_env.js`, `src/server/_prompt-handlers.js`
- `docs/adr/093-accept-a-comma-separated-agent-list-in-agent-commands.md`
- `docs/adr/094-reinstall-is-one-shell-script-behind-three-entry-points.md`
