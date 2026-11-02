# 207: Close out plan _rule-mcp-process-npm-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/skills/process/_rule-mcp-process-npm-release.md, "rule-process-npm-release - best-practice implementation plan", finished with 20 closed items.

## Outcome

- Audit the skill and inventory the checkable statements.
- Confirm the prior art in the repository's own workflow tests.
- Interview the owner and record the decisions.
- Create this plan and the index entry.
- Write the fixture set first: two-space and four-space indentation, a multi-line run, permissions at both levels, a bare - item, and the three shapes the reader refuses.
- Implement the helper and keep it free of rule-specific logic. Evidence: src/core/guardrails/workflow/_lines.js (134 lines) and index.js (100), exported from src/core/guardrails/index.js; no rule id, no regex for a command, no policy.
- Gate: the helper suite green (src/core/guardrails/__tests__/_workflow.test.mjs, 9/9), and no rule file imports anything else new.
- Note: the plan asked for "four indentation shapes"; the fourth resolved as _refused_ rather than read - a tab-indented file, an anchor on jobs: and a merge key all answer null, so a rule passes on a file the reader cannot follow instead of misreading it.
- release-no-npm-token with its good and bad fixtures, including the token name in a comment. Evidence: skills/rule-process-npm-release/guardrails/_no-token.js; the rule reads env lines and run: blocks from the parsed workflow, so a commented token never reaches it.
- release-stage-publish, including the chained run: and the string case. Evidence: _stage-publish.js; the staged form is removed before the plain form is looked for, and a non-workflow file (a test asserting the command) is skipped by the file gate.
- release-actions-pinned, including the local action that legitimately has no SHA. Evidence: _actions-pinned.js; ./ and docker:// refs are exempt, a 40-hex SHA without a version comment is reported separately from an unpinned tag.
- release-id-token-isolated, including the workflow-level id-token. Evidence: _id-token-isolated.js; workflow-level id-token, two holders, and a holder that installs, runs a setup action or asks for a cache are all reported.
- Gate: the four rules green on the corpus, and rule_tool_check on this repository stays clean. Evidence: _accuracy.test.mjs 4/4 and _coverage.test.mjs 1/1; all five workflows under .github/workflows/ report none of the four rules (the two js-* findings on release.yml are pre-existing and belong to another family - see Open notes).
- The four advisory rules, each with its exception fixture. Evidence: _tag-trigger.js, _ignore-scripts.js, _no-persist-credentials.js, _least-privilege.js; nine fixtures in the corpus, precision and recall 1.00 on all eight rules.
- Cut the body to about 150 lines and move the template and the settings into references/. Measured: 321 lines before, 164 after, with references/publish-workflow.md (the two workflow files, zizmor, the cooldown, the postinstall policy, the monorepo section) and references/manual-settings.md (both website checklists). The target was 150; what remains above it is the strict sequence, the two exception sections (first publish, monorepo pointer) and the rule table, each of which is a decision the model has to read before acting.
- Gate: a diff review that finds every removed claim with a destination, and the rule table replacing the final checklist. Evidence: the eight-item checklist became the eight-row rule table plus the two items no rule can see (the Trusted Publisher set in a browser, the token deleted and revoked); the template, the settings, the cooldown and the postinstall policy each moved to a named section of the two reference files.
- Regenerate docs/15-guardrails.md with pnpm census and update the frontmatter guardrails: list. Evidence: pnpm census reports the census current (its guardrail section counts the engine's own families only - see Open notes), and the frontmatter now lists eight rules, matching what guardrails/index.js exports.
- Run the gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1, _workflow 10/10, _false-positives 9/9, tests/docs/action-pins 1/1, src/core/skills/__tests__/_corpus 1/1, pnpm census current. _enforcement fails identically at HEAD (checked with a stash), so it is not this plan's regression.
- Run the eight rules against this repository's own .github/workflows/ and fix what they report, since a rule the author's own repository fails is a rule nobody will trust. Result: all five workflows clean. The first run was not: the advisory rules fired on ci.yml, pages.yml, scorecard.yml and check-workflows.yml, which publish nothing - a real false-positive class, fixed by scoping every advisory rule to a workflow that runs an npm publish, with a CI-workflow fixture per rule so the scope cannot silently regress.
- Hand the cooldown requirement to the rule-toolchain-pnpm plan. Done 2026-10-25: recorded under its Phase 2 as pkg-minimum-release-age, naming the four managers and the two spellings still unowned (uv exclude-newer, cargo).

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-npm-release.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
