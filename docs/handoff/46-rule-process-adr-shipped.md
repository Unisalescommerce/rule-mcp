# 46: rule-process-adr shipped and retired

- **Branch**: `rel/v0.1.0`
- **Commit range**: `a1b05103`..HEAD (WS-C node rule-process-adr, all five phases)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-03

## Done

1. **Handoff 45 verified** — 2976 tests with 2973 passing, `pnpm census:check` current, two merge commits. One tool bug found: the handon prints a pending ADR path as `_pending/<slug>` without `docs/adr/`, so `git ls-files` reports it untracked; the file exists and is committed.
2. **WS-C node rule-process-adr, 22 of 22, retired into ADR 202.** Five commits, one per concern:
   - `3bad2aec` the two Phase 0 decision records (ADR conventions, guardrail design), both pending until trunk;
   - `5cd088b8` the six rules, six fixture trees, twelve corpus pairs and the legacy list;
   - `1acae910` the tool gaps: `endsWhen`, repeatable `--alternatives`, the two-way supersede with its refusal;
   - `7752aa33` the skill body, rewritten around what the tool writes and the five conventions;
   - `7b0fb912` the closeout into ADR 202.
3. **The six rules** — `adr-file-naming`, `adr-status-vocabulary`, `adr-author-line`, `adr-ends-when`, `adr-index-derived`, `adr-english`, all advisory, declared in the skill frontmatter, with the `rule-process-ai` file shape.
4. **The legacy list is the measurement**, not the plan's estimate: 42 records use `Deciders` instead of `Author`, 153 keep the generated ends-when placeholder, 10 carry a free-form status or a supersede with no successor, 2 trip the English scanner. The suite asserts every entry still fails and that no record outside the list does.

## Findings worth carrying forward

- **The plan undercounted its own corpus**: it measured 56 records with no ends-when section and missed that every record from 056 on keeps the placeholder, so the real violation count is 153.
- **Two regexes backtracked catastrophically** on a run of spaces (88 s on the adversarial corpus); the single-line form answers in 25 ms. The ReDoS suite is now the guard for the next such rule.
- **`adr-english` over-fired**: the path scanner over the whole body flags ordinary English (`MIT`, `die`, `com`). It now path-scans the title and document-scans the body; records 030 and 206 stay in the legacy list because the scanner, not the prose, is wrong.
- **The closeout renderer still truncates**: it keeps the first line of each step, so ADR 202's Outcome lists half-sentences, and it caps at 20 items. A `## Measurement` section was added by hand, as in ADR 200 and 210.

## State

- Feature range `325936e6..HEAD`: 468 commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- ADR count 211, index current. Fifteen pending ADRs wait for trunk, including four written this session (25-word cap, ADR conventions, guardrail design, and their closeouts are numbered already because the project is off-trunk).
- `pnpm test:all`: 2983 tests, 2980 pass, 0 fail, 3 skip on the last full run before the closeout; the closeout suites were re-run green.
- `pnpm lint` is still red repo-wide on `unicorn/no-asterisk-prefix-in-documentation-comments`, on files this session never touched.

## Left out / next

- The next WS-C node: Stage 0 is complete, so the eligible work is the Stage 1 leaves whose edges are closed (`rule-toolchain-*`, `rule-ui-design-system`, `bundler-family`).
- `docs/plans/_plan-of-plans-reference.md` has 5 open boxes (F4, F5, F8, F9, the stage node list).
- Six guardrail plans wait on Phase 0 decisions (`inherits`, Tier A / Tier B).
- Feature close is pending: `--close-feature --squash` with 468 commits and 2 merge commits.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/46-rule-process-adr-shipped.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
rule-process-adr is retired into ADR 202 with six advisory rules; rule-process-ai and _decision-models are retired into ADR 201 and 209. Stage 0 of the skills catalog is complete, so the next WS-C node is a Stage 1 leaf with closed edges.
First step: take the next Stage 1 node from _skills-plan, or close the feature (468 commits, 2 merge commits) with --close-feature --squash.
Every commit is type(scope): subject. Do not push.
```
