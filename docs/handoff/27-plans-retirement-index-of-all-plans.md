# 27 - Plans retirement - index of all plans

- **Branch**: `feat/evolution`
- **Date**: 2026-10-24

## HANDOFF: plans

### Retired

- `docs/plans/plan-of-plans.md` - level-0 orchestrator, stages 0-8 complete, `Status: done`, zero real open checkboxes. Retired into ADR 161; file deleted.
- `docs/plans/_plan-of-plans-reference.md` - plan-graph audit, `Status: done` with eight follow-ups. Retired into ADR 162; file deleted.

### Open plans (96 files, 1,490 open items)

| Group                | Files | Open boxes |
| -------------------- | ----: | ---------: |
| Non-skill plans      |    10 |        146 |
| Skill plans          |    86 |      1,336 |
| Reference follow-ups |     - |          8 |
| **Total**            |    96 |  **1,490** |

Non-skill plans: `_export.md` (39), six area guardrail plans (94 total), `_2026-10-01-scripts-mcp-layout.md` (10), `_decision-models.md` (2), `installer-scope-adr-policy-features.md` (1).

86 skill plans live under `docs/plans/skills/`; `skills/_skills-plan.md` is their index and carries 1,336 open boxes. `skills/README.md` and `skills/DEPENDENCIES.md` are catalog documents, not plans.

### Reference follow-ups (8)

F1 apply contract stage by stage; F2 decide Stage 3 order; F3 decide toolchain additions; F4 one id per node; F5 five-line format; F8 normalize status line as each stage starts; F9 exempt three non-skill plans from checkbox assertion by path; per-stage node list.

### ADRs

- ADR 161 - retire plan-of-plans into ADR and handoff.
- ADR 162 - retire plan-graph audit reference into ADR and handoff.
- ADR 163 - retire closed plans into ADRs and one handoff.

### Next

open plans are roadmap; they stay in `docs/plans` and are indexed here. next session opens area it needs from this table, not from retired level-0 file. release PR #9 is separate line: coverage gate and Code scanning remain its blockers.
