# 202: Close out plan _rule-mcp-process-adr

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/skills/process/_rule-mcp-process-adr.md, "rule-process-adr - plan", finished with 22 closed items.

## Outcome

- ADR for ADR conventions: ends-when mandatory, real author, three
- ADR for guardrail design: tier B, dual detection, legacy lists that
- tests/fixtures/adr/ trees: clean/, bad-slug/, bad-status/,
- Six CORPUS pairs in tests/fixtures/guardrail-corpus.mjs, labeled
- scripts/data/adr-legacy.data.mjs seeded from measured numbers above.
- Suites written and watched to fail with "rule not found".
- skills/rule-process-adr/guardrails/: one _rule-name.js per rule plus
- Frontmatter guardrails: [...] on SKILL.md, ids equal to exports.
- Green Phase 1 suites; suite asserts legacy lists only shrink.
- ADRSchema and adr new gain endsWhen (--ends-when).
- adr new gains --alternatives, repeatable.
- superseded ADR must name its successor, in tool and in CLI;
- Tool tests in packages/mcp/tools/adr/**tests**/.
- Rewrite template to sections generateAdr writes, author
- Replace Italian example with English one tool would accept.
- Restructure around workflow: when to record, how to write it, how it
- State five conventions as rules of house, not as preferences.
- node --import ./scripts/alias-hook.mjs --test skills/rule-process-adr/guardrails/
- node --import ./scripts/alias-hook.mjs --test packages/mcp/tools/adr/**tests**/
- _corpus and _routing-corpus suites.
  -...and 2 more step(s) in closed record.

## Measurement

- legacy list is far larger than plan measured: 42 records use `Deciders` instead of `Author`, 153 keep generated ends-when placeholder (plan counted 56 records with no section at all, not placeholder), 10 carry free-form status or supersede with no successor, and 2 trip English scanner. list is seeded from that measurement.
- Two rules were written once and rewritten once. status and author regexes backtracked catastrophically on run of spaces (88 seconds on adversarial corpus); single-line form answers in 25 milliseconds. `adr-english` scanned whole body with path scanner and flagged ordinary English tokens that collide with loanword (license acronym, German article, domain suffix); it now scans title with path scanner and body with document scanner.
- Two records (030, 206) still trip `adr-english` on that scanner's own false positives, and they sit in legacy list rather than being "fixed": word is English and scanner is wrong.
- tool now carries `endsWhen`, repeatable alternatives list and supersede pair; `_register.js` moved its validation into `_validate.js` to stay under 150-line cap.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-adr.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
