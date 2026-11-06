# 174: Integration depth is the second install axis, capped by a measured ceiling

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, hosts, tui
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The installer had one dimension of choice: the profile, which says how much of the catalog is reachable. How deeply a host is wired to it was whatever each installer happened to write, with no vocabulary, no way to ask for less, and no way to refuse more. A user selecting Zed and Claude together got two entirely different integrations and no sentence explaining either.

## Decision

Every host carries levels L0..L4 - server, rules, commands, hooks, native handler - each rung supported or not with the reason, and a ceiling computed as the highest supported rung rather than stated twice. install --agent <id> --level <Lx> enforces it: a named host above its ceiling exits 1 and prints each unreachable rung with its reason, and --agent all is not refused because there the level is a cap and every host installs what it supports. The wizard asks the same question on a Depth screen, with each selected host's ceiling named in the row. The ladder is cumulative in intent, not in shape: a rung a host cannot reach is skipped, because Kiro writes a hook file and has no command files, and a strict ladder would report L0 and hide a surface the study measured.

## Consequences

Measured ceilings: 2 hosts at L4 (pi, copilot), 5 at L3 (claude, codex, cursor, gemini, kiro), 4 at L2 (cline, roo, opencode, vscode), 12 at L0. Cost: two axes to explain, and a level that is one cap applied per host rather than a per-row widget - a choice recorded because the screen API offers radio and check only.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. A per-host widget in the agents screen: rejected, because it needs a third list mode for 23 rows and the cap plus the printed ceiling answers the same question
1. Derive the level from which files happen to exist: rejected, because a host with a config file and no rules file would report L1 as unsupported and the reader would have no sentence to explain it
1. Make the ladder strict, so a host capped at L2 cannot take L3: rejected, because Kiro's hook file is real and a strict ladder would hide it
