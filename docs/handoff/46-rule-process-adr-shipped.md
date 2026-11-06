# 46: rule-process-adr shipped and retired

- **Branch**: `rel/v0.1.0`
- **Commit range**: `a1b05103`..HEAD (WS-C node rule-process-adr, all five phases)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-03

## Done

1. **Handoff 45 verified** — 2976 tests with 2973 passing, `pnpm census:check` current, two merge commits. One tool bug found: handon prints pending ADR path as `_pending/<slug>` without `docs/adr/`, so `git ls-files` reports it untracked; file exists and is committed.
2. **WS-C node rule-process-adr, 22 of 22, retired into ADR 202.** Five commits, one per concern:
   - `3bad2aec` two Phase 0 decision records (ADR conventions, guardrail design), both pending until trunk;
   - `5cd088b8` six rules, six fixture trees, twelve corpus pairs and legacy list;
   - `1acae910` tool gaps: `endsWhen`, repeatable `--alternatives`, two-way supersede with its refusal;
   - `7752aa33` skill body, rewritten around what tool writes and five conventions;
   - `7b0fb912` closeout into ADR 202.
3. **six rules** — `adr-file-naming`, `adr-status-vocabulary`, `adr-author-line`, `adr-ends-when`, `adr-index-derived`, `adr-english`, all advisory, declared in skill frontmatter, with `rule-process-ai` file shape.
4. **legacy list is measurement**, not plan's estimate: 42 records use `Deciders` instead of `Author`, 153 keep generated ends-when placeholder, 10 carry free-form status or supersede with no successor, 2 trip English scanner. suite asserts every entry still fails and that no record outside list does.

## Findings worth carrying forward

- **plan undercounted its own corpus**: it measured 56 records with no ends-when section and missed that every record from 056 on keeps placeholder, so real violation count is 153.
- **Two regexes backtracked catastrophically** on run of spaces (88 s on adversarial corpus); single-line form answers in 25 ms. ReDoS suite is now guard for next such rule.
- **`adr-english` over-fired**: path scanner over whole body flags ordinary English (`MIT`, `die`, `com`). It now path-scans title and document-scans body; records 030 and 206 stay in legacy list because scanner, not prose, is wrong.
- **closeout renderer still truncates**: it keeps first line of each step, so ADR 202's Outcome lists half-sentences, and it caps at 20 items. `## Measurement` section was added by hand, as in ADR 200 and 210.

## State

- Feature range `325936e6..HEAD`: 468 commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- ADR count 211, index current. Fifteen pending ADRs wait for trunk, including four written this session (25-word cap, ADR conventions, guardrail design, and their closeouts are numbered already because project is off-trunk).
- `pnpm test:all`: 2983 tests, 2980 pass, 0 fail, 3 skip on last full run before closeout; closeout suites were re-run green.
- `pnpm lint` is still red repo-wide on `unicorn/no-asterisk-prefix-in-documentation-comments`, on files this session never touched.

## Left out / next

- next WS-C node: Stage 0 is complete, so eligible work is Stage 1 leaves whose edges are closed (`rule-toolchain-*`, `rule-ui-design-system`, `bundler-family`).
- `docs/plans/_plan-of-plans-reference.md` has 5 open boxes (F4, F5, F8, F9, stage node list).
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
