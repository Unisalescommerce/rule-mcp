# 120: Consolidate the feature ADRs and handoffs into one commit at the close squash

- **Date**: 2026-09-29
- **Status**: accepted
- **Tags**: git, workflow, docs, history
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Closing feature with `/rule-handoff --close-feature --squash` left feature's ADRs and handoff documents as their own commits - `docs(adr): ...` and `chore(handoff): ...` - so the "single commit for feature" existed only for code. developer wants close to fold those documents too, verify which commits are involved, and rewrite result coherently without losing any detail. server must not decide boundary semantically, and must not lose decision in synthesized summary.

## Decision

`rule_tool_git action=squash` consolidates feature's documents before squash, behind same single confirmation. Relevance is deterministic union of three signals: commit in `merge-base..HEAD` that touched `docs/adr` or `docs/handoff`; document cited by commit message in range or by handoff in range; document whose filename carries branch slug. merged ADR and merged handoff are deterministic concatenations - header, then every original reproduced verbatim in order - and originals are deleted; document matched by citation or name but committed outside range is cited inside merged document and never touched. merged files keep lowest retired number and branch slug (`feat/git-workflow` -> `git-workflow`), and `docs/adr/ADR.md` and `docs/handoff/HANDOFF.md` are rebuilt from files on disk. order is: consolidate documents and stage them, `git reset --soft <merge-base>`, one commit, verify that only paths differing from pre-squash tree are planned document paths. final feature handoff is written after squash and committed on its own as `chore(handoff): ...`. Consolidation runs only with `--squash`.

## Consequences

closed feature is one commit holding code and consolidated ADR and handoff, and two indexes. tree invariant becomes narrower and stronger at once: only planned document paths may differ from pre-squash tree, and single non-document change fails verification and rolls branch back with `git reset --hard`. Detail is never summarized away, because merged file reproduces each original verbatim; cost is longer file and retired set of paths whose numbers external links may still name. document relevant to feature but committed outside range is one case operator has to resolve by hand.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep every ADR and handoff as its own commit and only squash code - feature closes with N+1 commits and docs and code can describe different feature boundaries
1. Let model rewrite merged documents - synthesized summary is exactly where decision detail gets lost, and it cannot be tested
1. Archive originals under docs/*/archive/`<feature>`/ - keeps two copies of same decision, and next reader has to know which one is live
1. Merge only handoffs and leave ADRs separate - accepted ADR is record; one feature would still leave its decisions scattered across commits that no longer exist
1. Match documents by name only - document renamed or created under another branch would be missed, and shared document could be pulled in by accident
