# 225: Count the cycles and the dead symbols the graph can prove, and break the cycles that are real

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: guardrails, tokensave, imports, file-tree
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

project guardrails reported five circular imports and forty-nine dead symbols on tree where both numbers were mostly artefacts. JSDoc type reference (`{import("./x.js").T}`) is module name in comment, and graph counts it as import: file that only documented its argument was reported as depending on it, and two of those closed cycle nobody had. Dead symbols had same shape from other side: graph has no edge for function reached through table (feature readers), run-time import (every command handler), or test that is its only reader, so it called live code dead. guardrail that reports work nobody can do teaches everyone to ignore its output.

## Decision

Both checks now decide from source before they fail. `_circular.js` strips comments (keeping string literals, so import specifier survives) and cycle counts only when every edge is real import; `_dead-code.js` counts reported symbol only when no file exports it, its own file never mentions it again, it is not in test, and disk has file graph named. Both filters take project root, so `_run.js` now passes it to `evaluate`. modules behind reported cycles were split where cycle was real: `_manifest-store.js` holds manifest's own read/write primitives so `_manifest.js` and `_manifest-hosts.js` both depend on it instead of each other, `_launchd-label.js` holds label both launchd modules need, `_announced.js` holds on-disk record `_context` and `_announce` share, `_targets-resolve.js` holds target resolution `_targets` and `_targets-sync` both call, and barrel re-exports that closed three more (env, tui, agents) moved to barrel that owns them.

## Consequences

Positive: the two checks answer zero on this tree and mean something when they answer more; the four module cycles a reader could actually hit are gone, and each new module has one name for one fact. Negative: the checks now read files during evaluation, so a project whose sources are not on disk reports nothing instead of failing; a genuinely dead symbol that is exported stays invisible, because an export is public by construction; and the graph's own count is now only an input, which means the tool and the guardrail can disagree and the guardrail is right.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep raw counts and document them as noise: permanently red gate is failure ADR 177 already answered.
1. Delete every symbol graph names: it would delete command handlers, table entries and test helpers, which is opposite of dead-code removal.
1. Drop JSDoc type references so graph stops seeing them: it removes working type hint from every signature to satisfy tool that reads comments as code.
