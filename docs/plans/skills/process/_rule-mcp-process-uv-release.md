# rule-process-uv-release - best-practice implementation plan

Status: `done`
Notes:`done` 2026-10-25. Eight rules (four blocking, four advisory) at precision and recall 1.00; the body and two references written; `/rule-init` reports a Python project's tooling. Two substitutions recorded: the shared rules are copies with shared parsing, and `release-version-matches-tag` became `release-version-not-in-workflow` because a workflow rule cannot read `pyproject.toml`. Output convention: one plan per skill at `docs/plans/skills/<area>/<skill>.md`. Index: `docs/plans/skills/README.md` (#89).

Area: process. Order: appended after `rule-process-npm-release`; it is the Python half of the same subject.

## Why this skill exists

`rule-process-npm-release` answers "how do I release an npm package without a stealable
token". A Python project managed with `uv` asks the same question and gets no answer:
the router sends the user to an npm skill whose every command (`npm config set`,
`npm stage publish`, `.npmrc`) is wrong for them. The measured case is a release prepared
with `make` and `uv`.

The same gap is visible inside this repository: `src/core/release/_detect.js` reads
`package.json` only, so `/rule-init` reports "no changelog/version tooling detected" for a
Python project that has a perfectly good release pipeline.

## Evidence base

Read and measured in this session:

- `skills/rule-process-npm-release/SKILL.md`: 320 lines, the sibling this skill mirrors. Its
  structure - loose the facts, one batch of questions, the manual settings the user must
  change, then the repo changes - is the shape reused here.
- `docs/plans/skills/process/_rule-mcp-process-npm-release.md`: the rule set (four blocking,
  four advisory), the `_workflow.js` helper and the `references/` split. This plan does not
  invent a second format; it reuses both.
- [Building and publishing a package](https://docs.astral.sh/uv/guides/package/) (uv docs,
  read 2026-10-25): `uv build` emits `dist/`; `uv build --no-sources` is the documented
  recommendation **when publishing**, because `tool.uv.sources` is not honoured by other
  build tools; `uv version <x>` and `uv version --bump <part>` write the version and lock and
  sync by default (`--frozen`, `--no-sync`); `uv publish` takes a token via `--token` /
  `UV_PUBLISH_TOKEN` **or** needs no credential at all when the project has a PyPI Trusted
  Publisher; with trusted publishing uv attempts to invalidate the short-lived token after
  the upload **even when publishing fails**, and tokens passed explicitly are not revoked;
  `--check-url <index>` skips files already in the registry and handles raced parallel
  uploads; `[[tool.uv.index]]` with `publish-url` plus `uv publish --index <name>` requires
  the checkout, because `pyproject.toml` must be present.
- Same page, attestations: `uv publish` **uploads** attestations it finds beside the
  artifacts (`dist/<file>.publish.attestation`) and matches them automatically, but
  **does not generate them**, and `--no-attestations` / `UV_PUBLISH_NO_ATTESTATIONS` turn the
  upload off for indexes that reject them.
- [Adding a Trusted Publisher to an Existing PyPI Project](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)
  (read 2026-10-25): for GitHub Actions PyPI requires the repository owner, the repository
  name and the **filename** of the authorised workflow; a GitHub environment is optional and
  **strongly recommended**, because it is what allows a manual approval by a trusted subset
  of maintainers. The settings screen is
  `https://pypi.org/manage/project/<name>/settings/publishing/` reached from _Your projects_.
- `src/core/release/_detect.js`, `src/core/release/_render.js` (this repository): the release
  report is `package.json`-shaped, and `releaseToolingLabels` prints the Node labels.
- `skills/rule-toolchain-pnpm/guardrails/`: owns `pkg-exact-versions`, `pkg-no-corepack`,
  `pkg-no-engines`. **No `rule-toolchain-uv` skill exists**, so the dependency-cooldown rule
  this family wants has no owner here.
- `tests/docs/action-pins.test.mjs`: the repository test that already enforces SHA-pinned
  actions - the prior art for `release-actions-pinned`.

Problems found:

| Problem                                  | Detail                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| the router answers with the npm skill    | every command in it is wrong for a `uv` project, and the model has to translate first                                   |
| `/rule-init` cannot see a Python release | `_detect.js` parses `package.json` only, so `uv.lock` + `pyproject.toml` + a release workflow report as "nothing there" |
| attestations are a trap                  | uv uploads them and never creates them: a workflow that assumes provenance is generated ships none                      |
| trusted publishing is all-or-nothing     | one `UV_PUBLISH_TOKEN` in the workflow defeats the setup, and uv only warns when its revocation fails                   |
| `--no-sources` is a one-word rule        | the documented publish recommendation is a flag, and a missing flag is invisible until a consumer builds from the sdist |
| cooldown has no owner                    | four package managers have a cooldown and no skill checks a Python project set one                                      |
| no version-from-tag story                | `uv version --bump` writes the file; a tag pushed beside it can disagree, and nothing reconciles the two                |

## Decisions

| Question        | Decision                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Shape           | Mirror `rule-process-npm-release` exactly: facts, one batch of questions, manual settings, wait, repo changes     |
| YAML reading    | Reuse the shared workflow helper (see Workstream B) instead of a second parser                                    |
| Rule set        | Eight rules: four blocking, four advisory                                                                         |
| Attestations    | The skill says plainly that uv uploads and does not create; a rule only checks the upload flag, never claims more |
| Cooldown        | Not implemented here. Recorded for `rule-toolchain` and left unowned with the reason                              |
| Manual settings | `references/manual-settings.md`: Trusted Publisher, environment with required reviewers, no API token             |
| Delivery        | Plan only                                                                                                         |

## Workstream A - The body

`skills/rule-process-uv-release/SKILL.md`, target about 150 lines, same order as the npm
sibling:

1. the outcome in three sentences: no long-lived PyPI token, one workflow, a manual approval;
2. the strict sequence: facts, one batch of questions, manual settings, wait, repo changes;
3. the read-only facts: `pyproject.toml` (`[project]`, `[build-system]`, `dynamic`),
   `uv.lock`, `[tool.uv]`, `requires-python`, existing tags (`git tag --sort=-creatordate`),
   `uv version` output, whether the package is already on PyPI
   (`uv pip index`/browser - the exact read-only command is a Phase 0 item);
4. the questions asked once: the GitHub environment name, the cooldown length, the tag format,
   whether the version is static in `pyproject.toml` or bumped by `uv version`, and whether
   attestations are wanted;
5. the manual half, in `references/manual-settings.md`;
6. the repo changes: the workflow in `references/publish-workflow.md`, the version step, the
   `uv build --no-sources` step, the `uv publish` step;
7. a closing table: which rule enforces what, and the two items no rule can see.

## Workstream B - The workflow helper

The npm plan creates `_workflow.js` with a job/step splitter by indentation. Three release
skills will read the same YAML, so this plan consumes it rather than copying it:

- the helper's home is decided once: `src/core/guardrails/workflow/`, beside the engine's
  `_helpers.js`, exported and tested on its own (`_lines.js` + `index.js`, ADR 061);
- the dependency is `rule-process-npm-release#1` (CONTRACT): whichever node is executed
  first creates the module **at that path**, and the other imports it;
- if the owner prefers no shared engine file, the fallback is a copy per skill and this
  decision is revisited - the plan does not silently choose duplication.

The tests that matter for uv are the ones the npm fixture set does not carry: a workflow with
two publish jobs, a `run:` block that chains `uv build` and `uv publish`, a matrix job, and a
job that sets `UV_PUBLISH_TOKEN` at workflow level.

## Workstream C - The four blocking rules

| Rule id                     | Rejects                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `release-no-pypi-token`     | `UV_PUBLISH_TOKEN`, `--token`, `--password` or a `secrets.*PYPI*` reference in any workflow |
| `release-id-token-isolated` | `id-token: write` on a job that installs, caches, or is not the only job carrying it        |
| `release-build-no-sources`  | a `uv build` inside the publish job without `--no-sources`                                  |
| `release-actions-pinned`    | a `uses:` without a 40-hex SHA and a version comment (shares the npm rule id and fixtures)  |

`release-id-token-isolated` and `release-actions-pinned` are the same rules the npm skill
declares: one implementation, two skills listing it. The plan does not duplicate the regex -
the rule ids resolve to one module and the corpus records which skills cite them.

## Workstream D - The four advisory rules

| Rule id                       | Rejects                                                                    | Why advisory                                                 |
| ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `release-sync-locked`         | `uv sync` in CI without `--locked`, or no committed `uv.lock`              | a library may deliberately not ship a lockfile               |
| `release-version-matches-tag` | the tag does not equal `[project].version` (or the version is not dynamic) | a project may bump in the same commit the tag points at      |
| `release-attestations`        | the workflow claims provenance and no step creates the `.attestation`      | uv cannot generate them; some indexes reject them            |
| `release-least-privilege`     | a job with broader permissions than `contents: read`                       | a job that pushes a changelog commit legitimately needs more |

## Workstream E - The cooldown has no owner

The npm family put its cooldown in `rule-toolchain-pnpm`. The Python analogue (`exclude-newer`
in `[tool.uv]`, and the env spelling `UV_EXCLUDE_NEWER`, **to be verified against the installed
uv version in Phase 0**) has no owner: there is no `rule-toolchain-uv` skill. This plan
records the requirement and the boundary; it does not invent a skill to hold one rule.

## Workstream F - `/rule-init` learns to see a Python release

`src/core/release/_detect.js` today answers from `package.json` alone. Phase 3 extends it to
`pyproject.toml` + `uv.lock` + `.github/workflows/release*.yml`, with the same honesty: report
what is there, install nothing. `releaseToolingLabels` gains the Python labels so
`/rule-init` prints something true for the project that motivated this plan.

## Proposed guardrails

| Rule id                           | Rejects                                                     | Tier | Source                                |
| --------------------------------- | ----------------------------------------------------------- | ---- | ------------------------------------- |
| `release-no-pypi-token`           | a token in a workflow                                       | A    | Trusted Publishing docs               |
| `release-id-token-isolated`       | `id-token` on a job that installs or caches, or on two jobs | A    | npm plan, same helper                 |
| `release-build-no-sources`        | `uv build` without `--no-sources` in the publish job        | A    | uv packaging guide                    |
| `release-actions-pinned`          | an unpinned `uses:`                                         | A    | `tests/docs/action-pins.test.mjs`     |
| `release-sync-locked`             | `uv sync` without `--locked`, or no `uv.lock`               | B    | uv projects docs                      |
| `release-version-not-in-workflow` | a version literal in the workflow                           | B    | uv `version` docs, tag-vs-literal     |
| `release-attestations`            | provenance claimed, no attestation file produced            | B    | uv packaging guide (uv does not sign) |
| `release-least-privilege`         | broader permissions than `contents: read`                   | B    | same helper as npm                    |

## Dependency graph

The leaf closes before the `rule-process` router, which cannot list a skill that does not
exist. The YAML helper is exported by the npm node, so this plan consumes it instead of
writing a second parser.

Depends on: `rule-process-ai` (HARD), `rule-process-npm-release#1` (CONTRACT)

Feeds: `rule-process` (HARD, the area router gains one row)

Shared files: tests/fixtures/guardrail-corpus.mjs, tests/fixtures/census.json, tests/fixtures/tool-surface.json, docs/10-tools.md, docs/09-skills.md, docs/plans/skills/README.md, docs/plans/skills/_skills-plan.md

### Phase 0 - Evaluation and decisions

- [x] Re-verify every uv claim in the evidence base against the installed `uv --version`; record the version in the skill's `references/` header. Measured 2026-10-25: `uv 0.13.5 (Homebrew 2026-10-22, aarch64-apple-darwin)`.
- [x] Verify the cooldown spelling (`exclude-newer` / `UV_EXCLUDE_NEWER`) before anything is written about it. Verified on 0.13.5: `uv sync --help` carries `--exclude-newer <EXCLUDE_NEWER>` (env `UV_EXCLUDE_NEWER`) and `--exclude-newer-package <EXCLUDE_NEWER_PACKAGE>`.
- [x] Verify the read-only "is this package already on PyPI" command and its output on a real name. Verified 2026-10-25: `curl -s https://pypi.org/pypi/<name>/json` answers `.info.version` (checked on `requests`) and 404 for a name that does not exist. `uv pip install --dry-run` exists but answers a different question, so the reference uses the JSON API.
- [x] Confirm with the owner whether the shared workflow helper lives in `src/core/guardrails/`. Decided 2026-10-25: yes - `src/core/guardrails/workflow/`, implemented with the npm node, exported from the engine barrel.
- [x] Add the row to `docs/plans/skills/README.md` (#89) and to the stage table of `_skills-plan.md`; the skill directory itself is created in Phase 1.

### Phase 1 - The helper and the fixtures

- [x] Write the failure fixtures first: two publish jobs, a chained `run:`, a matrix publish, workflow-level token, workflow-level `id-token`. Eleven fixture entries in the corpus: a token in `env`, a `--token` on the command line, a token in a comment, `uv build` with and without `--no-sources`, an unpinned action, `id-token` on a job that syncs, a publish-only job, and a CI workflow that publishes nothing.
- [x] Import the shared `src/core/guardrails/workflow/` reader (already implemented by the npm node) and add the uv shapes to its suite. The uv shapes needed no parser change: `step.env`, `step.with` and `job.permissions` already answer them, so the work was the fixtures.
- [x] Gate: the helper suite green, and no rule file carries its own YAML reader. Evidence: `_workflow` 10/10; every uv rule calls `context.helpers.parseWorkflow`.

### Phase 2 - The blocking rules

- [x] `release-no-pypi-token`, including the token inside a comment and inside a quoted test string. Evidence: `skills/rule-process-uv-release/guardrails/_no-pypi-token.js`; the workflow must publish with `uv publish` before the rule speaks, and the credential names cover uv, twine and the generic PyPI secret.
- [x] `release-id-token-isolated` and `release-actions-pinned` carried by this skill. **Decision changed in execution:** they are copies with the parsing shared through the helper bag, not imports of the npm modules - a rule imports nothing (ADR 089) and the engine has no partial inheritance, so the npm rule cannot be reused without pulling `release-no-npm-token` and `release-stage-publish` in with it. What is duplicated is the policy text; the expensive half (workflow, jobs, steps, `with:`) is one module.
- [x] `release-build-no-sources`, including `uv build --package x` and a chained `uv build && uv publish`. The rule reports per step, so a chained run is one finding rather than a guess.
- [x] Gate: the four rules green on the corpus, and `rule_tool_check` on this repository stays clean. Evidence: precision and recall 1.00 on all four (`_accuracy` 4/4, `_coverage` 1/1); the four rules report nothing on this repository's workflows, and the release rules of the npm sibling stay scoped to workflows that publish.

### Phase 3 - The advisory rules, the body and `/rule-init`

- [x] The four advisory rules with one exception fixture each. Evidence: `_sync-locked.js`, `_version-not-in-workflow.js`, `_attestations.js`, `_least-privilege.js`, eight fixtures. **One rule was renamed in execution:** the plan named `release-version-matches-tag`, which needs to read `pyproject.toml` - a workflow rule is handed the workflow text and nothing else, so the checkable form of the same bug is a version literal written into the workflow, and that is what `release-version-not-in-workflow` rejects.
- [x] The body at about 150 lines plus `references/manual-settings.md` and `references/publish-workflow.md`. Measured: 148 lines of body, and two references that carry the workflow (with `--no-sources`, the attestation trap, a non-PyPI index and the cooldown) and both website checklists. Written in Phase 2 because a skill without a body is a folder the loader reads and nobody can use.
- [x] `src/core/release/_detect.js` reads `pyproject.toml`, `uv.lock` and the release workflow, and `releaseToolingLabels` prints the Python labels. Evidence: three new fields (`pyproject`, `pythonBuildSystem`, `uvLock`) and a label map, with a Python fixture in `src/core/release/__tests__/_detect.test.mjs`.
- [x] Gate: a diff review that finds every removed claim with a destination; the npm sibling's rule table and this one agree on the shared ids. Evidence: both tables list `release-actions-pinned` and `release-id-token-isolated`, both skills export them, and the two `release-least-privilege` rules carry identical semantics.

### Phase 4 - Verification

- [x] Run the gates below. Evidence 2026-10-25: `_accuracy` 4/4, `_coverage` 1/1 (all eight rules at precision and recall 1.00), `_workflow` 10/10, `_false-positives` 9/9, `_detect` 3/3, `src/core/layers/__tests__` 36/36, `pnpm census` current.
- [x] Run the eight rules against this repository's own `.github/workflows/`; a rule the author's own repository fails is a rule nobody will trust. Result: every workflow clean of the eight uv rules, because none of them publishes with `uv publish` - the scope is what keeps a Python rule silent in a Node repository.
- [x] Regenerate the generated documents (`pnpm census`) and the tool list, and update the tool count in `README.md`. Evidence: `rule_tool_process_uv_release` is in `docs/10-tools.md` and the surface map, `README.md` moved to 82 skills / 103 tools / 172 resources, and the row is in the `rule-process` router.
- [x] Hand the cooldown requirement to whichever plan ends up owning `rule-toolchain-uv`. Recorded, not handed: no `rule-toolchain-uv` exists, and the pnpm plan now names the Python and Rust spellings as unowned in its Phase 2 hand-off note.

## Model assignment

Classes and evidence: section 14 of `docs/plans/plan-of-plans.md`.

| Step                            | Class       | Model                     | Why                                  |
| ------------------------------- | ----------- | ------------------------- | ------------------------------------ |
| Phase 0 - Evaluation            | `T1-plan`   | `gemini-4-argon` (high)   | verifying claims against live docs   |
| Phase 1 - helper and fixtures   | `T4-tests`  | `deepseek-v4.1-flash`     | fixtures before code, cheap and fast |
| Phase 2 - the blocking rules    | `T3-rules`  | `kimi-k2.7-code`          | small deterministic regex work       |
| Phase 3 - advisory and the body | `T7-author` | `qwen3.8-max`             | skill prose and references           |
| Phase 4 - Verification          | `T8-verify` | `gemini-3.8-flash` (high) | fast loops over gates                |

Plan default: `T3-rules` - `kimi-k2.7-code`. Fallback: `step-5-preview` for authoring, `glm-5.3-flash` for bulk edits.

## Verification gates

```bash
node --import ./scripts/alias-hook.mjs --test skills/rule-process-uv-release/guardrails/
node --import ./scripts/alias-hook.mjs --test src/core/guardrails/__tests__/_workflow.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/guardrails/__tests__/_enforcement.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/release/__tests__/_detect.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/skills/__tests__/_corpus.test.mjs
pnpm census && pnpm census:check
pnpm lint
```

## Open notes

- **Attestations are the honest half of this skill.** uv uploads what it finds and creates
  nothing, so the skill must not promise provenance from `uv publish` alone. The rule checks
  the upload flag; the reference says which command creates the file, and Phase 0 verifies it
  rather than the plan naming a tool it has not run.
- **The shared helper is a real decision, not a formality.** Two skills reading the same YAML
  should share one reader; if the owner wants skills to stay self-contained, this plan takes
  the copy and says so in its own record.
- **`release-version-matches-tag` can be wrong on purpose.** A project that bumps the version
  in the tag commit is doing the right thing and still fails a naive comparison; the rule is
  advisory and its fixture carries that exception.
- **The cooldown stays unowned.** Recording it here without a skill is better than hiding it
  in a Python-release rule that cannot express the manager's configuration file.
