# 71. src/shared for every shareable helper

## Status

accepted

## Decision

All cross-cutting helpers with more than one caller live in `src/shared/`
with barrel (`index.js`) as single home: guardrail verdict shapes
(`countedVerdict`, `tsSkipResult`, `passResult`, TS predicates), tool
response envelopes (`textResult`, `errorResult`) and shell-out helper
(`tryExec`). no-duplicate-blocks gate (`tests/docs/no-duplicate-blocks.test.mjs`)
fails when 4-line code window repeats across three or more source files,
keeping future helpers out of tree.

## Consequences

Guardrail rules now end in one shared verdict builder instead of 16 copies of
same object literal, tool errors build through one envelope, and the
exec/try helpers have single definition. Files that vend output - generated
scaffold templates - are exempt from gate because they must stay
standalone.
