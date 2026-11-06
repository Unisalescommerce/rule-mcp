# 199: Close out plan _rule-mcp-process-uv-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/skills/process/_rule-mcp-process-uv-release.md, "rule-process-uv-release - best-practice implementation plan", finished with 20 closed items.

## Outcome

- Re-verify every uv claim in evidence base against installed uv --version; record version in skill's references/ header. Measured 2026-10-25: uv 0.13.5 (Homebrew 2026-10-22, aarch64-apple-darwin).
- Verify cooldown spelling (exclude-newer / UV_EXCLUDE_NEWER) before anything is written about it. Verified on 0.13.5: uv sync --help carries --exclude-newer `<EXCLUDE_NEWER>` (env UV_EXCLUDE_NEWER) and --exclude-newer-package `<EXCLUDE_NEWER_PACKAGE>`.
- Verify read-only "is this package already on PyPI" command and its output on real name. Verified 2026-10-25: curl -s https://pypi.org/pypi/name/json answers.info.version (checked on requests) and 404 for name that does not exist. uv pip install --dry-run exists but answers different question, so reference uses JSON API.
- Confirm with owner whether shared workflow helper lives in src/core/guardrails/. Decided 2026-10-25: yes - src/core/guardrails/workflow/, implemented with npm node, exported from engine barrel.
- Add row to docs/plans/skills/README.md (#89) and to stage table of _skills-plan.md; skill directory itself is created in Phase 1.
- Write failure fixtures first: two publish jobs, chained run, matrix publish, workflow-level token, workflow-level id-token. Eleven fixture entries in corpus: token in env, a --token on command line, token in comment, uv build with and without --no-sources, unpinned action, id-token on job that syncs, publish-only job, and CI workflow that publishes nothing.
- Import shared src/core/guardrails/workflow/ reader (already implemented by npm node) and add uv shapes to its suite. uv shapes needed no parser change: step.env, step.with and job.permissions already answer them, so work was fixtures.
- Gate: helper suite green, and no rule file carries its own YAML reader. Evidence: _workflow 10/10; every uv rule calls context.helpers.parseWorkflow.
- release-no-pypi-token, including token inside comment and inside quoted test string. Evidence: skills/rule-process-uv-release/guardrails/_no-pypi-token.js; workflow must publish with uv publish before rule speaks, and credential names cover uv, twine and generic PyPI secret.
- release-id-token-isolated and release-actions-pinned carried by this skill. Decision changed in execution: they are copies with parsing shared through helper bag, not imports of npm modules - rule imports nothing (ADR 081) and engine has no partial inheritance, so npm rule cannot be reused without pulling release-no-npm-token and release-stage-publish in with it. What is duplicated is policy text; expensive half (workflow, jobs, steps, with:) is one module.
- release-build-no-sources, including uv build --package x and chained uv build && uv publish. rule reports per step, so chained run is one finding rather than guess.
- Gate: four rules green on corpus, and rule_tool_check on this repository stays clean. Evidence: precision and recall 1.00 on all four (_accuracy 4/4, _coverage 1/1); four rules report nothing on this repository's workflows, and release rules of npm sibling stay scoped to workflows that publish.
- four advisory rules with one exception fixture each. Evidence: _sync-locked.js, _version-not-in-workflow.js, _attestations.js, _least-privilege.js, eight fixtures. One rule was renamed in execution: plan named release-version-matches-tag, which needs to read pyproject.toml - workflow rule is handed workflow text and nothing else, so checkable form of same bug is version literal written into workflow, and that is what release-version-not-in-workflow rejects.
- body at about 150 lines plus references/manual-settings.md and references/publish-workflow.md. Measured: 148 lines of body, and two references that carry workflow (with --no-sources, attestation trap, non-PyPI index and cooldown) and both website checklists. Written in Phase 2 because skill without body is folder loader reads and nobody can use.
- src/core/release/_detect.js reads pyproject.toml, uv.lock and release workflow, and releaseToolingLabels prints Python labels. Evidence: three new fields (pyproject, pythonBuildSystem, uvLock) and label map, with Python fixture in src/core/release/**tests**/_detect.test.mjs.
- Gate: diff review that finds every removed claim with destination; npm sibling's rule table and this one agree on shared ids. Evidence: both tables list release-actions-pinned and release-id-token-isolated, both skills export them, and two release-least-privilege rules carry identical semantics.
- Run gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1 (all eight rules at precision and recall 1.00), _workflow 10/10, _false-positives 9/9, _detect 3/3, src/core/layers/**tests** 36/36, pnpm census current.
- Run eight rules against this repository's own .github/workflows/; rule author's own repository fails is rule nobody will trust. Result: every workflow clean of eight uv rules, because none of them publishes with uv publish - scope is what keeps Python rule silent in Node repository.
- Regenerate generated documents (pnpm census) and tool list, and update tool count in README.md. Evidence: rule_tool_process_uv_release is in docs/10-tools.md and surface map, README.md moved to 82 skills / 103 tools / 172 resources, and row is in rule-process router.
- Hand cooldown requirement to whichever plan ends up owning rule-toolchain-uv. Recorded, not handed: no rule-toolchain-uv exists, and pnpm plan now names Python and Rust spellings as unowned in its Phase 2 hand-off note.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-uv-release.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
