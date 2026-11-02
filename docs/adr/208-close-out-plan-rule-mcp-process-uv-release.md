# 208: Close out plan _rule-mcp-process-uv-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/skills/process/_rule-mcp-process-uv-release.md, "rule-process-uv-release - best-practice implementation plan", finished with 20 closed items.

## Outcome

- Re-verify every uv claim in the evidence base against the installed uv --version; record the version in the skill's references/ header. Measured 2026-10-25: uv 0.13.5 (Homebrew 2026-10-22, aarch64-apple-darwin).
- Verify the cooldown spelling (exclude-newer / UV_EXCLUDE_NEWER) before anything is written about it. Verified on 0.13.5: uv sync --help carries --exclude-newer <EXCLUDE_NEWER> (env UV_EXCLUDE_NEWER) and --exclude-newer-package <EXCLUDE_NEWER_PACKAGE>.
- Verify the read-only "is this package already on PyPI" command and its output on a real name. Verified 2026-10-25: curl -s https://pypi.org/pypi/<name>/json answers .info.version (checked on requests) and 404 for a name that does not exist. uv pip install --dry-run exists but answers a different question, so the reference uses the JSON API.
- Confirm with the owner whether the shared workflow helper lives in src/core/guardrails/. Decided 2026-10-25: yes - src/core/guardrails/workflow/, implemented with the npm node, exported from the engine barrel.
- Add the row to docs/plans/skills/README.md (#89) and to the stage table of _skills-plan.md; the skill directory itself is created in Phase 1.
- Write the failure fixtures first: two publish jobs, a chained run:, a matrix publish, workflow-level token, workflow-level id-token. Eleven fixture entries in the corpus: a token in env, a --token on the command line, a token in a comment, uv build with and without --no-sources, an unpinned action, id-token on a job that syncs, a publish-only job, and a CI workflow that publishes nothing.
- Import the shared src/core/guardrails/workflow/ reader (already implemented by the npm node) and add the uv shapes to its suite. The uv shapes needed no parser change: step.env, step.with and job.permissions already answer them, so the work was the fixtures.
- Gate: the helper suite green, and no rule file carries its own YAML reader. Evidence: _workflow 10/10; every uv rule calls context.helpers.parseWorkflow.
- release-no-pypi-token, including the token inside a comment and inside a quoted test string. Evidence: skills/rule-process-uv-release/guardrails/_no-pypi-token.js; the workflow must publish with uv publish before the rule speaks, and the credential names cover uv, twine and the generic PyPI secret.
- release-id-token-isolated and release-actions-pinned carried by this skill. Decision changed in execution: they are copies with the parsing shared through the helper bag, not imports of the npm modules - a rule imports nothing (ADR 089) and the engine has no partial inheritance, so the npm rule cannot be reused without pulling release-no-npm-token and release-stage-publish in with it. What is duplicated is the policy text; the expensive half (workflow, jobs, steps, with:) is one module.
- release-build-no-sources, including uv build --package x and a chained uv build && uv publish. The rule reports per step, so a chained run is one finding rather than a guess.
- Gate: the four rules green on the corpus, and rule_tool_check on this repository stays clean. Evidence: precision and recall 1.00 on all four (_accuracy 4/4, _coverage 1/1); the four rules report nothing on this repository's workflows, and the release rules of the npm sibling stay scoped to workflows that publish.
- The four advisory rules with one exception fixture each. Evidence: _sync-locked.js, _version-not-in-workflow.js, _attestations.js, _least-privilege.js, eight fixtures. One rule was renamed in execution: the plan named release-version-matches-tag, which needs to read pyproject.toml - a workflow rule is handed the workflow text and nothing else, so the checkable form of the same bug is a version literal written into the workflow, and that is what release-version-not-in-workflow rejects.
- The body at about 150 lines plus references/manual-settings.md and references/publish-workflow.md. Measured: 148 lines of body, and two references that carry the workflow (with --no-sources, the attestation trap, a non-PyPI index and the cooldown) and both website checklists. Written in Phase 2 because a skill without a body is a folder the loader reads and nobody can use.
- src/core/release/_detect.js reads pyproject.toml, uv.lock and the release workflow, and releaseToolingLabels prints the Python labels. Evidence: three new fields (pyproject, pythonBuildSystem, uvLock) and a label map, with a Python fixture in src/core/release/__tests__/_detect.test.mjs.
- Gate: a diff review that finds every removed claim with a destination; the npm sibling's rule table and this one agree on the shared ids. Evidence: both tables list release-actions-pinned and release-id-token-isolated, both skills export them, and the two release-least-privilege rules carry identical semantics.
- Run the gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1 (all eight rules at precision and recall 1.00), _workflow 10/10, _false-positives 9/9, _detect 3/3, src/core/layers/__tests__ 36/36, pnpm census current.
- Run the eight rules against this repository's own .github/workflows/; a rule the author's own repository fails is a rule nobody will trust. Result: every workflow clean of the eight uv rules, because none of them publishes with uv publish - the scope is what keeps a Python rule silent in a Node repository.
- Regenerate the generated documents (pnpm census) and the tool list, and update the tool count in README.md. Evidence: rule_tool_process_uv_release is in docs/10-tools.md and the surface map, README.md moved to 82 skills / 103 tools / 172 resources, and the row is in the rule-process router.
- Hand the cooldown requirement to whichever plan ends up owning rule-toolchain-uv. Recorded, not handed: no rule-toolchain-uv exists, and the pnpm plan now names the Python and Rust spellings as unowned in its Phase 2 hand-off note.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-uv-release.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
