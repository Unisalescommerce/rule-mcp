# Session handoff 07 - Landing develop on main, and closing the finished plans

- Branch: `main`
- Covers: `964a32b0..c33c9e46` (84 commits landed by fast-forward)
- Date: 2026-09-15
- Decisions: ADR 089, ADR 090, ADR 091, ADR 092

## What happened

Phase 7 of `docs/plans/develop-consolidation.md`, then closeout of plans
that had finished.

**landing.** `merge/develop-into-main` was verified against `main` before
being merged: the 19 OSS-layer files (LICENSES, REUSE.toml, GOVERNANCE,
CODEOWNERS, four hardened workflows, generator scripts) and the
`develop` work (personas/, guardrails now living inside skills, the
TokenSave adapter, `scripts/alias-hook.mjs`, pinned tool surface) were all
present in tree. `git merge --ff-only` took `main` to `c33c9e46` and the
push was fast-forward: `964a32b0..c33c9e46`. No force, no rebase, no history
rewrite.

**One gate fork had broken.** `pnpm lint` was red on 1493 sites across 760
files, all of them `unicorn/single-line-block-comment-style`. cause is the
dependency the merge carries: `eslint-plugin-unicorn` 74 adds that rule to its
recommended set with `multiline` default, while 72 had no such rule. Of the
1493 sites, 1414 are one-line JSDoc comments - house style - and none is an
`eslint-disable*` directive or coverage-ignore comment, so fix pins the
rule to `single-line` in `eslint.config.mjs` instead of reformatting tree.
That is commit `c33c9e46`, only commit this session adds on top of the
merge.

**realignment.** `develop` was reset onto `main` (`git branch -f develop
main`) and pushed as a fast-forward, because the `develop` tip fork carried
was an ancestor of the merge: `3dae3a31..c33c9e46`. `develop` therefore stays
alive as integration branch ADR 090 describes. `merge/develop-into-main`
is deleted and `.merge-notes/` is gone.

## Gates

Run fresh on landed tree before push, not read from `.merge-notes/`:

| Gate                           | Result                                                   |
| ------------------------------ | -------------------------------------------------------- |
| `pnpm lint`                    | 0 errors, 36 warnings (budget 50)                        |
| `pnpm test:all`                | 1734 pass, 0 fail, 3 skipped                             |
| `pnpm test:coverage`           | branches 91.03% against a floor of 91                    |
| `pnpm format`                  | clean                                                    |
| `pnpm census:check`            | census is current                                        |
| `tests/docs/*`                 | 58 pass (docs-accuracy, repository-contract, workflow-*) |
| `src/core/guardrails/__test__` | 35 pass                                                  |
| `pnpm audit:gate`              | no known vulnerabilities in production dependencies      |

`rule_tool_check` on `eslint.config.mjs` change: 59 of 59 guardrails pass.

## Closing the finished plans

ADR 079 says completed working paper folds into one ADR and leaves tree
on session close. Two plans were finished:

- `docs/plans/develop-consolidation.md` - 53 resolved checks, all phases 0 to 7
  executed. Archived by `rule_tool_process_handoff` in close-session mode, which
  deleted source and regenerated ADR index.
- `docs/plans/tokensave-integration.md` - milestones M0 to M8 each stamped
  `Status: **done**` with its commit, from `d4521b5` to `f38b003`. Its tracking
  is prose (`Status: **done**`), not checkboxes, so `planDone()` in
  `src/tools/handoff/_closeout.js` cannot see it; it was archived as ADR 092
  through `rule_tool_process_adr` instead, and its five open design questions
  were carried into that ADR's alternatives rather than left only in git
  history.

Four plans stay, deliberately, because they are not finished:

- `docs/plans/oss.md` - steps 7, 8, 9, 10, 16, 22, 23, 27, 29 and 30 carry the
  code but are still unmarked, and step 2 waits on owner enabling Private
  Vulnerability Reporting. Marking step done before owner action and the
  CI observation that closes it would be lie in record.
- `docs/plans/architect.md` - fresh audit, nothing executed.
- `docs/plans/github.md` - owner's GitHub admin checklist, all open. It is
  written in Italian, so ADR English gate would skip it and keep file
  anyway.
- `docs/plans/backlog.md` - queue is empty; it is standing queue with its
  Done record, not finished plan.

ADR index was regenerated with `updateAdrIndex` after ADR 092 was renamed
to slug that is not truncated, and every link in `docs/adr/ADR.md` was checked
to resolve to file that exists.

## Closeout

- Archived `docs/plans/develop-consolidation.md` -> ADR 091
  (`091-close-out-plan-develop-consolidation.md`); source file deleted.
- Archived `docs/plans/tokensave-integration.md` -> ADR 092
  (`092-the-tokensave-integration-closes-out-and-the-adapter-is-the-code-graph-layer.md`);
  source file deleted.

## Open items

- `nul` artifact: fixed in `38e5e904` and audited in handoff 08; full test run now leaves no
  such file. audit of that surface opened eight findings, worst first in
  `docs/plans/security.md`.
- `docs/plans/oss.md` marks are stale against landed code (see above).
- ADRs 099 and 100 land as `accepted` with no owner review of their text.

## Commits

| Commit     | Subject                                                 |
| ---------- | ------------------------------------------------------- |
| `c33c9e46` | fix(lint): keep the house one-liner block comment style |

landing itself is fast-forward, not commit. closeout ADR writes and
plan deletions are committed with this handoff.

## Convention reminder

Every commit is `type(scope): subject` plus DCO `Signed-off-by` trailer. The
`commit-msg` hook rejects scope-less message.
