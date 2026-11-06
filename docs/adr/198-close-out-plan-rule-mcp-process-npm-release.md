# 198: Close out plan _rule-mcp-process-npm-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/skills/process/_rule-mcp-process-npm-release.md, "rule-process-npm-release - best-practice implementation plan", finished with 20 closed items.

## Outcome

- Audit skill and inventory checkable statements.
- Confirm prior art in repository's own workflow tests.
- Interview owner and record decisions.
- Create this plan and index entry.
- Write fixture set first: two-space and four-space indentation, multi-line run, permissions at both levels, bare - item, and three shapes reader refuses.
- Implement helper and keep it free of rule-specific logic. Evidence: src/core/guardrails/workflow/_lines.js (134 lines) and index.js (100), exported from src/core/guardrails/index.js; no rule id, no regex for command, no policy.
- Gate: helper suite green (src/core/guardrails/**tests**/_workflow.test.mjs, 9/9), and no rule file imports anything else new.
- Note: plan asked for "four indentation shapes"; fourth resolved as _refused_ rather than read - tab-indented file, anchor on jobs: and merge key all answer null, so rule passes on file reader cannot follow instead of misreading it.
- release-no-npm-token with its good and bad fixtures, including token name in comment. Evidence: skills/rule-process-npm-release/guardrails/_no-token.js; rule reads env lines and run: blocks from parsed workflow, so commented token never reaches it.
- release-stage-publish, including chained run: and string case. Evidence: _stage-publish.js; staged form is removed before plain form is looked for, and non-workflow file (test asserting command) is skipped by file gate.
- release-actions-pinned, including local action that legitimately has no SHA. Evidence: _actions-pinned.js;./ and docker:// refs are exempt, 40-hex SHA without version comment is reported separately from unpinned tag.
- release-id-token-isolated, including workflow-level id-token. Evidence: _id-token-isolated.js; workflow-level id-token, two holders, and holder that installs, runs setup action or asks for cache are all reported.
- Gate: four rules green on corpus, and rule_tool_check on this repository stays clean. Evidence: _accuracy.test.mjs 4/4 and _coverage.test.mjs 1/1; all five workflows under .github/workflows/ report none of four rules (two js-* findings on release.yml are pre-existing and belong to another family - see Open notes).
- four advisory rules, each with its exception fixture. Evidence: _tag-trigger.js, _ignore-scripts.js, _no-persist-credentials.js, _least-privilege.js; nine fixtures in corpus, precision and recall 1.00 on all eight rules.
- Cut body to about 150 lines and move template and settings into references/. Measured: 321 lines before, 164 after, with references/publish-workflow.md (two workflow files, zizmor, cooldown, postinstall policy, monorepo section) and references/manual-settings.md (both website checklists). target was 150; what remains above it is strict sequence, two exception sections (first publish, monorepo pointer) and rule table, each of which is decision model has to read before acting.
- Gate: diff review that finds every removed claim with destination, and rule table replacing final checklist. Evidence: eight-item checklist became eight-row rule table plus two items no rule can see (Trusted Publisher set in browser, token deleted and revoked); template, settings, cooldown and postinstall policy each moved to named section of two reference files.
- Regenerate docs/15-guardrails.md with pnpm census and update frontmatter guardrails: list. Evidence: pnpm census reports census current (its guardrail section counts engine's own families only - see Open notes), and frontmatter now lists eight rules, matching what guardrails/index.js exports.
- Run gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1, _workflow 10/10, _false-positives 9/9, tests/docs/action-pins 1/1, src/core/skills/**tests**/_corpus 1/1, pnpm census current. _enforcement fails identically at HEAD (checked with stash), so it is not this plan's regression.
- Run eight rules against this repository's own .github/workflows/ and fix what they report, since rule author's own repository fails is rule nobody will trust. Result: all five workflows clean. first run was not: advisory rules fired on ci.yml, pages.yml, scorecard.yml and check-workflows.yml, which publish nothing - real false-positive class, fixed by scoping every advisory rule to workflow that runs npm publish, with CI-workflow fixture per rule so scope cannot silently regress.
- Hand cooldown requirement to rule-toolchain-pnpm plan. Done 2026-10-25: recorded under its Phase 2 as pkg-minimum-release-age, naming four managers and two spellings still unowned (uv exclude-newer, cargo).

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-npm-release.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
