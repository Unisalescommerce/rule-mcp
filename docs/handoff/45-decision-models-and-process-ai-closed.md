# 45: Decision models retired, rule-process-ai closed

- **Branch**: `rel/v0.1.0`
- **Commit range**: `8154b85c`..HEAD (handoff 44 verification → DM-04 → 25-word cap → two closeouts)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-03

## Done

1. **Handoff 44 verified** — every claim held: 2976 tests with 2973 passing, `pnpm census:check` current, `rule-process-ai` at 21/23, two merge commits, clean tree. two "modified since" files were commits inside range, not pending edits.
2. **DM-04 closed by its kill criterion** — Italian slice was re-measured and is unchanged (2/8 exact, 3/8 top-or-alternative, 5/8 `unknown`), and English is unchanged (77/95 exact, 91/95 top-or-alternative). harness and registry ship; Italian routing claim is dropped. swap cost stays in record: cold Italian 1415 ms, English after Italian 216 ms, third Italian call answered from decision cache.
3. **`_decision-models.md` retired into ADR 200** — sweep deleted source and updated `plan-of-plans.md`; ADR 200 gained `## Measurement` and `## Durable choices` sections by hand, because sweep copies only checkboxes.
4. **Test follows document** — `export-step8-docs.test.mjs` read deleted plan; it now asserts same three properties on ADR 200.
5. **Three blocked prose rules settled** — `ai-plain-sentence-length` ships with 25-word cap (ASD-STE100's descriptive limit) on documents only; `ai-identifier-english` stays covered by `ai-english-only-prose` and its dictionary grows on real miss; `ai-terminology-consistency` is dropped until glossary exists. decision sits in ADR `232-cap-prose-sentences-at-25-words-and-keep-identifiers-dictionary-driven.md`, numbered when it lands on trunk.
6. **`rule-process-ai` closed at 23/23** — sweep archived it as ADR 201 and `_skills-plan.md` row now reads `retired`. renderer truncates at 20 items, so three Phase 4 steps are spelled out under Outcome line.

## State

- Feature range `325936e6..HEAD`: 461 commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- `rule-process-ai` is retired; 25-word cap is last rule plan owed.
- One pending ADR waits for trunk landing; `rule_tool_handoff land` numbers it.
- `pnpm test:all`: 2976 tests, 2972 pass on last full run with one known flake (`the hard timeout aborts the call and the client does not retry`, green alone); focused runs after closeout were green.
- `pnpm lint` is still red repo-wide on `unicorn/no-asterisk-prefix-in-documentation-comments`, on files this session never touched.

## Left out / next

- `docs/plans/_plan-of-plans-reference.md` has 5 open boxes (F4, F5, F8, F9, stage node list) while ADR 162 declared it deleted.
- `plan-of-plans.md` WS-C still lists 4 open steps: catalog has other nodes to take, one commit per stage.
- Six guardrail plans wait on Phase 0 decisions (`inherits` and Tier A / Tier B).
- closeout renderer drops plan's non-checkbox prose (measurements, contracts) and caps Outcome at 20 items; both needed hand edit this session and want fix.
- Feature close is pending: `--close-feature --squash` with 461 commits and 2 merge commits.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/45-decision-models-and-process-ai-closed.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
rule-process-ai is retired into ADR 201 and _decision-models is retired into ADR 200. The 25-word sentence cap is the last rule that plan owed; its decision ADR is pending trunk landing.
First step: take the next node from plan-of-plans WS-C, or close the feature (461 commits, 2 merge commits) with --close-feature --squash.
Every commit is type(scope): subject. Do not push.
```
