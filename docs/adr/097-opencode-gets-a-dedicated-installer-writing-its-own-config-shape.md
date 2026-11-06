# 097: opencode gets a dedicated installer writing its own config shape

- **Date**: 2026-09-17
- **Status**: accepted
- **Tags**: installer, cli, opencode, mcp
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

opencode was handled by generic installer, which wrote `~/.config/opencode/mcp.json` in `mcpServers` shape. opencode never reads that file: its global config is `~/.config/opencode/opencode.json` (and `opencode.jsonc`; two are merged), servers live under `mcp`, local server is `{ type: "local", command: [bin, ...args], enabled, environment }`, and remote one is `{ type: "remote", url, headers }`. hand-edit that moved `mcpServers` shape into `opencode.json` - `command` as string with `args` beside it - is not schema-valid and stopped client from loading its config at all. visible symptom was `/mcps` never listing server.

## Decision

opencode gets dedicated installer, like Pi: `upsertOpencode`/`removeOpencode` in JSON writers translate shared config into opencode's dialect (`command` array, `environment`, `type: remote` when url is present), `installOpencode` is registered in installer registry, `uninstallOpencode` reverses it, and `detectInstalledAgents` reads `opencode.json`. instruction file is registered in config's `instructions` array, because opencode only reads files that array names. legacy sweep removes our entry from `mcp.json` generic installer used to write, deleting file when it empties.

## Consequences

One writer owns opencode's dialect next to VS Code one, and both wizard and `install --agent opencode` write config opencode loads. uninstall drops entry and instruction registration together, so install and uninstall are symmetric. Cost: writers file now knows third local-server dialect, and legacy sweep keeps path old installer owned in code for while longer.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep generic installer and accept `mcp.json`: opencode reads nothing there, which is defect this record replaces.
1. Write `mcp` entry only and leave `instructions.md` unregistered: file would be written and never read, dead copy of rules.
1. Force daemon/remote for opencode: opencode speaks remote servers, but only Pi and VS Code are interop-verified (`remoteModeAgents` in catalog), so stdio stays default.
