# 189: Hook install starts the guard daemon and writers use --send

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: cli, installer, hooks, performance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 188 added guard --daemon and thin --send but left host writers on per-spawn guard and required a manual daemon start. Measured --send with a warm daemon is much cheaper than a full CLI guard spawn.

## Decision

guardCommand (and the OpenCode/Pi plugin snippets) emit guard --send <kind>. installAgent starts the detached guard daemon whenever hooks are written. uninstallAgent stops the daemon when the install manifest has no agents left. Pid/log live at state/guard.pid and state/guard.log, separate from the MCP daemon.

## Consequences

Positive: L3+ hook installs get the warm path automatically; uninstall of the last agent cleans up. Negative: uninstall of one agent among several leaves the daemon running (correct); a crashed daemon leaves a stale socket until the next start unlinks it; hosts installed before this change keep old commands until reinstall.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Lazy-start daemon inside --send on first miss (hides install failures; doubles cold path)
1. Keep writers on full guard forever (leaves the measured win unused)
1. One shared pid with the MCP daemon (different binary args and lifecycle)
