# Pending: Count the cycles and the dead symbols the graph can prove, and break the cycles that are real

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: guardrails, tokensave, imports, file-tree
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The project guardrails reported five circular imports and forty-nine dead symbols on a tree where both numbers were mostly artefacts. A JSDoc type reference (`{import("./x.js").T}`) is a module name in a comment, and the graph counts it as an import: a file that only documented its argument was reported as depending on it, and two of those closed a cycle nobody had. Dead symbols had the same shape from the other side: the graph has no edge for a function reached through a table (the feature readers), a run-time import (every command handler), or a test that is its only reader, so it called live code dead. A guardrail that reports work nobody can do teaches everyone to ignore its output.

## Decision

Both checks now decide from the source before they fail. `_circular.js` strips comments (keeping string literals, so an import specifier survives) and a cycle counts only when every edge is a real import; `_dead-code.js` counts a reported symbol only when no file exports it, its own file never mentions it again, it is not in a test, and the disk has the file the graph named. Both filters take the project root, so `_run.js` now passes it to `evaluate`. The modules behind the reported cycles were split where the cycle was real: `_manifest-store.js` holds the manifest's own read/write primitives so `_manifest.js` and `_manifest-hosts.js` both depend on it instead of each other, `_launchd-label.js` holds the label both launchd modules need, `_announced.js` holds the on-disk record `_context` and `_announce` share, `_targets-resolve.js` holds the target resolution `_targets` and `_targets-sync` both call, and the barrel re-exports that closed three more (env, tui, agents) moved to the barrel that owns them.

## Consequences

Positive: the two checks answer zero on this tree and mean something when they answer more; the four module cycles a reader could actually hit are gone, and each new module has one name for one fact. Negative: the checks now read files during evaluation, so a project whose sources are not on disk reports nothing instead of failing; a genuinely dead symbol that is exported stays invisible, because an export is public by construction; and the graph's own count is now only an input, which means the tool and the guardrail can disagree and the guardrail is right.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep the raw counts and document them as noise: a permanently red gate is the failure ADR 186 already answered.
1. Delete every symbol the graph names: it would delete command handlers, table entries and test helpers, which is the opposite of dead-code removal.
1. Drop the JSDoc type references so the graph stops seeing them: it removes a working type hint from every signature to satisfy a tool that reads comments as code.
