# 202: Close out plan _rule-mcp-process-adr

- **Date**: 2026-11-03
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/skills/process/_rule-mcp-process-adr.md, "rule-process-adr - plan", finished with 22 closed items.

## Outcome

- ADR for the ADR conventions: ends-when mandatory, real author, three
- ADR for the guardrail design: tier B, dual detection, legacy lists that
- tests/fixtures/adr/ trees: clean/, bad-slug/, bad-status/,
- Six CORPUS pairs in tests/fixtures/guardrail-corpus.mjs, labeled
- scripts/data/adr-legacy.data.mjs seeded from the measured numbers above.
- Suites written and watched to fail with "rule not found".
- skills/rule-process-adr/guardrails/: one _rule-name.js per rule plus
- Frontmatter guardrails: [...] on SKILL.md, ids equal to the exports.
- Green the Phase 1 suites; the suite asserts the legacy lists only shrink.
- ADRSchema and adr new gain endsWhen (--ends-when).
- adr new gains --alternatives, repeatable.
- A superseded ADR must name its successor, in the tool and in the CLI;
- Tool tests in packages/mcp/tools/adr/**tests**/.
- Rewrite the template to the sections generateAdr really writes, author
- Replace the Italian example with an English one the tool would accept.
- Restructure around the workflow: when to record, how to write it, how it
- State the five conventions as rules of the house, not as preferences.
- node --import ./scripts/alias-hook.mjs --test skills/rule-process-adr/guardrails/
- node --import ./scripts/alias-hook.mjs --test packages/mcp/tools/adr/**tests**/
- _corpus and _routing-corpus suites.
- ...and 2 more step(s) in the closed record.

## Measurement

- The legacy list is far larger than the plan measured: 42 records use `Deciders` instead of `Author`, 153 keep the generated ends-when placeholder (the plan counted the 56 records with no section at all, not the placeholder), 10 carry a free-form status or a supersede with no successor, and 2 trip the English scanner. The list is seeded from that measurement.
- Two rules were written once and rewritten once. The status and author regexes backtracked catastrophically on a run of spaces (88 seconds on the adversarial corpus); the single-line form answers in 25 milliseconds. `adr-english` scanned the whole body with the path scanner and flagged ordinary English tokens that collide with a loanword (a license acronym, a German article, a domain suffix); it now scans the title with the path scanner and the body with the document scanner.
- Two records (030, 206) still trip `adr-english` on that scanner's own false positives, and they sit in the legacy list rather than being "fixed": the word is English and the scanner is wrong.
- The tool now carries `endsWhen`, a repeatable alternatives list and the supersede pair; `_register.js` moved its validation into `_validate.js` to stay under the 150-line cap.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-adr.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
