# 70. Co-locate every test with its module

## Status

accepted

## Context

191 suites lived under `tests/` while module code they exercised grew under
`src/`. Every split, rename or cross-module edit forced rewrite of two import
graphs, and leaves without home drifted. structural-hygiene plan asked
for total test co-location: test belongs next to code it pins, in
`src/<module>/__tests__/`.

## Decision

Move every unit and integration suite from `tests/<area>/...` into
`src/<area|<module>>/__tests__/`, preserving git rename history via `git mv`
and re-anchoring each relative import to new depth (subtree-relative refs
are mirrored; repository-root refs are re-computed against real file
system). `tests/docs/**` and `tests/e2e/**` stay: docs doctor and the
Playwright end-to-end suite are repository-level infrastructure, not module
tests, and e2e runner needs its own test harness. suite runner
(`scripts/ci/run-tests/_suites.data.mjs`) now globs `src/**/__tests__` once;
adding test edits no manifest.

## Consequences

One import graph per module, renames re-pointed by file system instead of
by hand, and runner no longer grows its glob list. Test code moved under
`src/` is excluded from coverage instrument (its own branches would
otherwise move ratchet), and self-guardrails walk is scoped to
`src` with `node_modules`/`.git` skipped.
