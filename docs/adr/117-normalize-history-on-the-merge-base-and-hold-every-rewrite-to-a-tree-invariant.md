# 117: Normalize history on the merge base and hold every rewrite to a tree invariant

- **Date**: 2026-09-28
- **Status**: accepted
- **Tags**: git, workflow, history
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

WS4 removes merge commits from feature branch while preserving exactly what branch contains. obvious commands are wrong in two different ways: `git rebase <base>` also pulls base's new commits in and changes tree, and squashing each merge into its neighbor loses any content merge resolved in way neither parent had (an "evil merge"). history rewrite that quietly changes what repository holds is worse than leaving merges in.

## Decision

Linearization runs `git rebase <merge-base>`: replaying feature commits onto fork point drops merges and leaves final tree exactly as it was. Every rewrite - reword (via `git filter-branch --msg-filter`) and linearize - captures `HEAD^{tree}` before and re-reads it after, and if two differ branch is rolled back with `git reset --hard <original>` and rewrite is refused. conflict aborts and rolls back same way, and conflicted files are reported, never resolved. Destructive proposals need `force: true` (`/rule-git --force` flag); execution always needs `confirm: true`, and `force` never substitutes for it.

## Consequences

merge commit that carried no unique content disappears and content is provably unchanged, because tree hash matches. merge that did carry unique content cannot be flattened without changing tree, so tool refuses instead of silently dropping it. cost is that legitimate but non-trivial merge history has to be resolved by hand. Both rewrites are local-only and never push, and confirmation gate means agent cannot rewrite history on its own.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Squash each merge into its neighbor - plan names this as wrong assumption; merge whose tree differs from both parents loses that content
1. Rebase onto base tip - that also pulls base's commits in and changes branch content, which is WS2's job, not normalization
1. git filter-branch for merges too - rewrites messages, not topology, so it cannot drop merge
1. Force-push cleaned branch and let CI sort it out - loses local safety and invariant check
