# 45: Decision models retired, rule-process-ai closed

- **Branch**: `rel/v0.1.0`
- **Commit range**: `8154b85c`..HEAD (handoff 44 verification → DM-04 → 25-word cap → two closeouts)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-03

## Done

1. **Handoff 44 verified** — every claim held: 2976 tests with 2973 passing, `pnpm census:check` current, `rule-process-ai` at 21/23, two merge commits, clean tree. The two "modified since" files were commits inside the range, not pending edits.
2. **DM-04 closed by its kill criterion** — the Italian slice was re-measured and is unchanged (2/8 exact, 3/8 top-or-alternative, 5/8 `unknown`), and English is unchanged (77/95 exact, 91/95 top-or-alternative). The harness and the registry ship; the Italian routing claim is dropped. The swap cost stays in the record: cold Italian 1415 ms, English after Italian 216 ms, third Italian call answered from the decision cache.
3. **`_decision-models.md` retired into ADR 209** — the sweep deleted the source and updated `plan-of-plans.md`; ADR 209 gained the `## Measurement` and `## Durable choices` sections by hand, because the sweep copies only the checkboxes.
4. **Test follows the document** — `export-step8-docs.test.mjs` read the deleted plan; it now asserts the same three properties on ADR 209.
5. **Three blocked prose rules settled** — `ai-plain-sentence-length` ships with a 25-word cap (ASD-STE100's descriptive limit) on documents only; `ai-identifier-english` stays covered by `ai-english-only-prose` and its dictionary grows on a real miss; `ai-terminology-consistency` is dropped until a glossary exists. The decision sits in ADR `241-cap-prose-sentences-at-25-words-and-keep-identifiers-dictionary-driven.md`, numbered when it lands on the trunk.
6. **`rule-process-ai` closed at 23/23** — the sweep archived it as ADR 210 and the `_skills-plan.md` row now reads `retired`. The renderer truncates at 20 items, so the three Phase 4 steps are spelled out under the Outcome line.

## State

- Feature range `325936e6..HEAD`: 461 commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- `rule-process-ai` is retired; the 25-word cap is the last rule the plan owed.
- One pending ADR waits for trunk landing; `rule_tool_handoff land` numbers it.
- `pnpm test:all`: 2976 tests, 2972 pass on the last full run with one known flake (`the hard timeout aborts the call and the client does not retry`, green alone); the focused runs after the closeout were green.
- `pnpm lint` is still red repo-wide on `unicorn/no-asterisk-prefix-in-documentation-comments`, on files this session never touched.

## Left out / next

- `docs/plans/_plan-of-plans-reference.md` has 5 open boxes (F4, F5, F8, F9, the stage node list) while ADR 171 declared it deleted.
- `plan-of-plans.md` WS-C still lists 4 open steps: the catalog has other nodes to take, one commit per stage.
- Six guardrail plans wait on Phase 0 decisions (`inherits` and Tier A / Tier B).
- The closeout renderer drops the plan's non-checkbox prose (measurements, contracts) and caps the Outcome at 20 items; both needed a hand edit this session and want a fix.
- Feature close is pending: `--close-feature --squash` with 461 commits and 2 merge commits.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/45-decision-models-and-process-ai-closed.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
rule-process-ai is retired into ADR 210 and _decision-models is retired into ADR 209. The 25-word sentence cap is the last rule that plan owed; its decision ADR is pending trunk landing.
First step: take the next node from plan-of-plans WS-C, or close the feature (461 commits, 2 merge commits) with --close-feature --squash.
Every commit is type(scope): subject. Do not push.
```
