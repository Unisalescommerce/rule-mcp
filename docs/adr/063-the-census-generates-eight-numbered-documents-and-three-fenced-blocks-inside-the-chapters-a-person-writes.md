# 063: The census generates eight numbered documents and three fenced blocks inside the chapters a person writes

- **Date**: 2026-09-08
- **Status**: accepted
- **Tags**: docs, census, generator, tooling

- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

census generated six documents (07-skills through 12-personas) and refreshed two fenced blocks, but guardrail rules and resource surface were documented nowhere reader could find them: 95 rules and 184 resources existed only in code. generator also depended on two hand-kept data files. `_env-vars.data.mjs` restated env table in `docs/05-env-variables.md`, which is two copies of one fact, and copy without generator behind it goes stale first - it had already drifted, documenting `RULE_MCP_TOKENSAVE_AUTOTRACK` and `RULE_MCP_AUTO_UPDATE`, which nothing in `src/` or `bin/` reads, while five variables code does read appeared in no table. `_labels.data.mjs` hand-wrote purpose line per core tool beside `description` tool already declares. Formatting lived outside generator: `package.json` and `.githooks/pre-commit` each carried eight-path prettier invocation, and `tests/docs/census-generated.test.mjs` ran third one over temp copy of `docs/`, so three lists had to agree for staleness check to mean anything. `docs/README.md` had header row triplicated and advertised counts (96 skills, 112 tools) that runtime had not matched for some time - drift ADR 040 exists to remove.

## Decision

`docs/08-skills.md` through `docs/15-resources.md` are whole generated files, one inventory topic each, and `docs/01`, `docs/03` and `docs/05` carry `census:begin`/`census:end` fences same run rewrites. Privacy leaves numbered sequence for `docs/06-privacy.md`, so generated documents are tail of handbook and `tests/docs/docs-handbook-numbering.test.mjs` can assert exactly that, plus gapless sequence from `01` and `docs/README.md` row per chapter. generator formats its own output with repository prettier settings and writes only files that changed, so one invocation owns bytes: `pnpm census` writes, `pnpm census:check` exits 1 on stale file, `prebuild` and pre-commit hook call same entry point, and staleness test compares `censusOutputs()` in memory rather than shelling out to prettier second time. Both hand-kept data files are gone. env block is derived by scanning `src/` and `bin/` for `RULE_MCP_*`, excluding co-located `__tests__` (ADR 059) because test sets variable rather than reads it, and it reports disagreement in both directions - read but undocumented, and documented but read nowhere. Core tool purposes come from each tool's own `description`. CLI document is rendered from commander program itself, not from registry declared beside it: commander owns both what parses and what `--help` prints, so second declaration would be copy that goes stale.

## Consequences

Eleven files are owned by the generator and must never be edited by hand: eight whole documents and the fenced blocks in three chapters. A new inventory topic is a new numbered file plus an entry in the census INDEX, which also updates the cross-links in the other seven, and the numbering test fails until the new document is the tail and `docs/README.md` lists it. The env scan depends on the literal `RULE_MCP_` prefix appearing in source, so a name assembled from string fragments would be missed. Renumbering moved six documents and made every prior link to `07`-`12` wrong; the links inside `docs/` were repointed, and anything outside the repository that deep-linked a chapter by number is broken. The hardcoded `01`..`12` list in `tests/docs/docs-accuracy.test.mjs` was deleted rather than extended, because a list of numbers is the copy that forgets the chapter added next. The pre-commit hook runs only where `.githooks` is installed into `.git/hooks`, and it exits early when prettier is absent, because a commit is not the place to fail over a missing dev dependency.

## What would end this

Assumption: the eight inventories are read separately. The split stops paying if they are always opened together, because then the cross-links are the only navigation anyone uses. The env scan stops holding the moment a variable name is built at runtime rather than written literally, which the undocumented count would show as a number that no longer matches the table. The commander-rendered CLI document stops being the right shape if the CLI ever drops the parser for hand-rolled argument reading, because the option descriptions and defaults would then have no declaration to render from.

## Alternatives Considered

1. Keep six documents and leave guardrails and resources undocumented - 95 rules and 184 resources stay visible only in code
1. Keep numbering and append `13-guardrails` and `14-resources` - no renames, but privacy sits between chapters person writes and ones census owns, so generated set is not tail and numbering test cannot say so
1. Keep prettier in `package.json`, hook and test - three path lists that must agree for staleness check to mean anything
1. Port hand-kept env data file beside generator - second list to keep in sync with doc table, which is what drifted
1. Declare CLI options in registry terminal and census both render - document would be right and registry would be second copy of what commander already parses
