# plan-of-plans-reference

- **Plan**: `docs/plans/_plan-of-plans-reference.md` (retired)
- **ADR**: 213 (`204-close-out-plan-plan-of-plans-reference.md`)

## Delivered

- F2 - Stage 3 split into 3a (umbrella) and 3b (other leaves), so rule-platform-auth (3b) depends on rule-platform-desktop (3a); the stage test reads 3.1 < 3.2 and exempts CONTRACT edges (2026-10-21, 6cda42ea).
- F3 - decide the toolchain additions: two toolchain plans exist (_rule-mcp-toolchain-electron.md, _rule-mcp-toolchain-tauri.md) and run in Stage 4, after the stage that creates them.
- F4 - one id per node: rule-process-bmad, with Produces: rule-method. Measured 2026-11-05: rule-method appears in no plan file, and the Stage 2 table names rule-process-bmad as producing rule-mcp-method.
- F5 - one format: amend ADR 146 to five lines (Status, Branch, Path, Depends on, Feeds) plus Shared files. Measured 2026-11-05: ADR 146 carries both Branch: and Path:.
- F1 - apply the contract, stage by stage: 92 plans carry a ## Dependency graph section and 93 carry Depends on: / Feeds:, asserted by scripts/__tests__/plans/skills-plan.test.mjs. Status wording stays F8.
- F6 - align the contended-file lists (fixed in plan-of-plans.md; the level-1 file must point at it).
- F7 - correct 98 to 99.
- F8 - normalise the status line as each stage starts. Measured 2026-11-05: 93 of 94 plan files carry one of the five values; the exception is skills/README.md, an index rather than a plan, and the plan tests exclude indexes by path.
- F9 - exempt the three non-skill plans from the checkbox assertion by path. Measured 2026-11-05: the named file no longer exists, and the only files without a checkbox are the two indexes the tests already exempt.
- Add an explicit node list per stage, so the counts can be summed instead of asserted (Stage audit). Measured 2026-11-05: every stage 0a to 10 carries a node table, and skills-plan.test.mjs asserts each node appears exactly once.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
