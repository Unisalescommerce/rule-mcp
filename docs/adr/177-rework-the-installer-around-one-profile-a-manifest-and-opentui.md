# 177: Rework the installer around one profile, a manifest and OpenTUI

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: installer, tui, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The installer carries two unrelated preset systems (tool surface and slash
commands), seven independent flags, and an uninstaller that re-detects what was
installed instead of reading it. The wizard is built on Ink, which cannot see
the terminal's mouse selection, so copying text out of it is impossible. The
owner asked for one profile, a manifest, per-dimension confirmation and a TUI
that supports selection and clipboard.

## Decision

- **One profile** (`minimal`, `standard`, `full`, `custom`) chooses server,
  rules, commands, hooks and doctor together. `standard` includes everything;
  `full` adds the full tool surface. `custom` exposes the same dimensions one by
  one, each with a sentence describing what it writes and what it is for.
- **Transport is a separate step**: `stdio`, `daemon`, `docker` or `skills`.
  In `daemon` the native service is installed automatically; in the other modes
  it is not touched.
- **The skill bundle is not an install dimension**: the server already serves
  the catalog embedded.
- **Tool surface** defaults to `full`; areas and skills stay available in
  `custom`. **Commands** default to the whole set (router, area hubs, personas,
  tasks).
- **Doctor** runs the checks that match what was installed and never blocks the
  install.
- **Uninstall** reads `~/.rule-mcp/config/install.json`, selects every
  dimension that was installed, asks for confirmation per dimension and excludes
  the doctor. `--purge` removes the runtime home; `--keep-config` keeps the
  configuration.
- **Hooks** are implemented for the hosts that document a mechanism: Claude
  Code, Cursor and Gemini CLI. Codex CLI and Copilot CLI have no user-facing
  hook, so the row is disabled with that reason.
- **The TUI moves from Ink to OpenTUI**, which provides mouse selection,
  clipboard and notifications. OpenTUI needs Node 26.4+ with
  `--experimental-ffi`, so `.nvmrc` is `stable` and `engines.node` is
  `>=26.4.0`. The non-interactive flag path stays available for CI and for a
  host that cannot load the native renderer.

## Consequences

The installer has one vocabulary instead of two, the uninstall removes exactly
what the install wrote, and every row says what it does. Node 22 and 24 are no
longer supported for the interactive wizard; CI moves to Node 26. OpenTUI ships
a native artifact per platform, so the release must be tested on every target.

## What would end this

A runtime that cannot load OpenTUI's native core would send the wizard back to
a text renderer; a host that publishes a hook mechanism would add a row.

## Alternatives Considered

1. Keep Ink and add clipboard shortcuts only (no mouse selection, the request
   stays unmet)
2. Two preset systems with clearer names (the duplication that caused the
   confusion stays)
3. Detect the uninstall inventory at removal time (what the current code does,
   and what leaves agents configured in `~/.rule-mcp`)
