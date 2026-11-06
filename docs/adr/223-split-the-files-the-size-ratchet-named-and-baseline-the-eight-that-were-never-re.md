# 223: Split the files the size ratchet named, and baseline the eight that were never recorded

- **Date**: 2026-10-29
- **Status**: proposed
- **Tags**: file-tree, tests, ratchet, architecture
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 053 splits one concern per file into underscore-barrel folders, and tests/docs/file-size-budget.test.mjs enforces it with two rules: file outside ratchet stays at 150 lines or less, and grandfathered file may only shrink. Two sets of files broke that: nine that had grown past their recorded ceiling, and eight that were above 150 and had never been recorded at all, so gate was red for both reasons and had been for several commits. Some of growth in this window was mine - tokensave switch, uninstall reclaim, and tests that pin them.

## Decision

Split every file that had grown past its ceiling rather than raising one: _register-setup.js (the wizard-only flag table), _agent-ops.js (the removal path), _hook-writers.js (the guard command line), _manifest.js (the bulk write), setup/_options.js (the node floor), setup/index.js (the two directions), _wizard.js (the rail and the plan builder), _wizard.test.mjs (the stub harness) and skills-plan.test.mjs (the graph parsers), plus the files this window had grown (_env.js, _lifecycle.js, _runtime-home.js, _daemon.test.mjs, _register.test.mjs) - each extraction a named module or a `.fixture.mjs`. The eight offenders that predate this window and were never recorded are added to the ratchet at their current size, which is what the data file documents as the adoption baseline; every one may now only shrink.

## Consequences

Positive: the two size tests pass, so the gate is meaningful again; the entries for five files that now fit the cap are deleted, and four ceilings came down to the size the split reached; each new module has one concern and a name that says it, and the tests that pinned a parent module now import the extracted one. Negative: the module count grows by thirteen, and a reader following a symbol has one more hop; the eight baselined files are still debt, and the ratchet comment now says how many entries it holds so the list cannot quietly grow.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Raise ceilings of eight files: gate would then permit growth and stop being ratchet.
1. Split all seventeen in one pass: eight baselined files are large multi-concern modules whose split needs its own review, and doing it here would have buried work this window did.
1. Leave two tests red and document debt: gate that is always red teaches everyone to ignore it, which is failure ADR 177 exists to answer.
