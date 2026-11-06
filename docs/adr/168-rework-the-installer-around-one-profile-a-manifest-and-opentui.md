# 168: Rework the installer around one profile, a manifest and OpenTUI

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: installer, tui, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

installer carries two unrelated preset systems (tool surface and slash
commands), seven independent flags, and uninstaller that re-detects what was
installed instead of reading it. wizard is built on Ink, which cannot see
terminal's mouse selection, so copying text out of it is impossible. The
owner asked for one profile, manifest, per-dimension confirmation and TUI
that supports selection and clipboard.

## Decision

- **One profile** (`minimal`, `standard`, `full`, `custom`) chooses server,
  rules, commands, hooks and doctor together. `standard` includes everything;
  `full` adds full tool surface. `custom` exposes same dimensions one by
  one, each with sentence describing what it writes and what it is for.
- **Transport is separate step**: `stdio`, `daemon`, `docker` or `skills`.
  In `daemon` native service is installed automatically; in other modes
  it is not touched.
- **skill bundle is not install dimension**: server already serves
  catalog embedded.
- **Tool surface** defaults to `full`; areas and skills stay available in
  `custom`. **Commands** default to whole set (router, area hubs, personas,
  tasks).
- **Doctor** runs checks that match what was installed and never blocks the
  install.
- **Uninstall** reads `~/.rule-mcp/config/install.json`, selects every
  dimension that was installed, asks for confirmation per dimension and excludes
  doctor. `--purge` removes runtime home; `--keep-config` keeps the
  configuration.
- **Hooks** are written for hosts whose documentation names both file
  and the events: Claude Code (`settings.json`), Cursor (`hooks.json`), Codex
  CLI (`hooks.json`, trusted once with `/hooks`), Gemini CLI (`settings.json`)
  and Kiro (`.kiro/hooks/*.json`). OpenCode, Pi, Cline and Kilo document
  in-process plugin or extension hooks instead of hook file; registry
  records that mechanism but leaves row unwritable until installer has
  target. Copilot, Aider, Zed and shut-down Roo extension have no tool
  hook, so row is disabled with reason.
- **TUI moves from Ink to OpenTUI**, which provides mouse selection,
  clipboard and notifications. OpenTUI needs Node 26.4+ with
  `--experimental-ffi`, so `.nvmrc` is `stable` and `engines.node` is
  `>=26.4.0`. non-interactive flag path stays available for CI and for a
  host that cannot load native renderer.

## Consequences

installer has one vocabulary instead of two, uninstall removes exactly
what install wrote, and every row says what it does. Node 22 and 24 are no
longer supported for interactive wizard; CI moves to Node 26. OpenTUI ships
native artifact per platform, so release must be tested on every target.

## What would end this

runtime that cannot load OpenTUI's native core would send wizard back to
text renderer; host that publishes hook mechanism would add row.

## Alternatives Considered

1. Keep Ink and add clipboard shortcuts only (no mouse selection, request
   stays unmet)
2. Two preset systems with clearer names (duplication that caused the
   confusion stays)
3. Detect uninstall inventory at removal time (what current code does,
   and what leaves agents configured in `~/.rule-mcp`)
