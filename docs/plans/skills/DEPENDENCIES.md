# Per-skill plan dependencies

Live ordering authority: [_skills-plan.md](_skills-plan.md).

One plan per skill, and an order to run them in that does not leave two people editing the same contract at the same time. The index is `docs/plans/skills/README.md`; this file says what must be true before a plan starts.

## The rule

A plan starts when the plans it points at are done. Nothing else gates it: the per-skill plans are independent by construction, which is why the order below is mostly alphabetical. The exceptions are the four edges in the graph, and they are the reason this file exists.

## Graph

```
rule-process-ai                    <- first: every other plan writes prose, scope and gates by its rules
  |
  +--> the 81 skill plans         <- reverse alphabetical, area by area
  |                                  (78 built skills plus 3 not built yet)
          |
          +--> the area router of that area   (rule-styleguide, rule-process, ...)
          |       |
          |       +--> nothing: a router is the last thing planned in its area
          |
          +--> every plan that ships a guardrail  (needs the corpus and the naming from the leaf)
```

## Edges

| From                  | To                             | Why                                                                                                                                                                                           |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rule-process-ai`     | every other plan               | It owns English, American spelling, ASCII punctuation, the prose rules and the scope contract. Every plan is a document, and its nine guardrails run on the artifacts the other plans produce |
| a leaf plan           | the router plan of its area    | A router table can only list children that exist and have a plan                                                                                                                              |
| a leaf plan           | any plan that adds a guardrail | A new rule needs the corpus naming and the family the leaf established                                                                                                                        |
| every leaf of an area | the next area                  | Not a dependency, an ordering: an area is finished before the next begins so its router can be written against a stable set                                                                   |

## Execution order

1. **`rule-process-ai`** - merged, renamed and applied. Everything after it inherits its rules.
2. **The 81 skill plans** (78 built, 3 planned), area by area in this order:
   ui, toolchain, styleguide, process, platform, meta, frontend, devops, data,
   backend, ai. Inside an area, reverse alphabetical, which is the order the
   index already carries.
3. **The area routers**, each after its own children: `rule-styleguide`, `rule-process`, `rule-toolchain`, `rule-ui`, `rule-platform`, `rule-meta`, `rule-frontend`, `rule-devops`, `rule-data`, `rule-backend`, `rule-ai`.

## What is not a dependency

- The repository-policy and execution plans at `docs/plans/` are not skill plans. They can run alongside a skill step when they do not share files.
- The `decision-models` track (audit, review, plan, probe harness) lives here since the fold retired `feat/decision-models`. It re-measures the routing corpus after skill text settles, so it is not a skill-plan edge on this branch.
- A plan with no graph edge to another is genuinely independent: the graph shows every edge that exists, so an absent edge is an absent dependency and not an omission.
