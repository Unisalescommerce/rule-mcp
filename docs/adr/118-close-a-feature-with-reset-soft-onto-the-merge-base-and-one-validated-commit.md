# 118: Close a feature with reset --soft onto the merge base and one validated commit

- **Date**: 2026-09-29
- **Status**: accepted
- **Tags**: git, workflow, history
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

WS6 closes feature as one Conventional Commit that becomes PR title, changelog entry and version input. operation must preserve exactly what branch contains and must pick boundary from git, not from model. Choosing message is model's job; deciding range and proving content survived is not.

## Decision

close runs `git reset --soft <merge-base>` (same deterministic boundary every other consumer reads) and then one `git commit`. soft reset leaves index holding tip tree, so new commit's tree is tip tree by construction; rewrite still captures `HEAD^{tree}` before and after and rolls branch back on any mismatch or on commit count other than one. final message is supplied by caller, validated against one Conventional Commit rule, and committed with `--no-verify` so project hook cannot reject commit this contract proved conforming. `force: true` (`--close-feature --squash` intent) is needed to propose; `confirm: true` is needed to run.

## Consequences

feature of any shape - linear or merged - becomes one commit whose tree is provably same as before, and whose message is validated before it is written. verification re-reads commit count, tree, violations and working tree, so squash that produced two commits or dirty tree is rolled back rather than left behind. cost is that intermediate history is only recoverable through reflog, which is why operation is confirmed and never automatic.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Squash with interactive rebase todo - scripted sequence editor is fragile to quote and cannot be tested without pty
1. `git commit --amend` per commit and cherry-pick them into one - rebuilds history by hand for no benefit when `reset --soft` already holds tree
1. `git merge --squash` then commit - only works while merging, not when feature is already merged or linear
1. Leave feature commits and let PR squash on merge - loses local linear history plan asks for, and message would be chosen at merge time from last session
