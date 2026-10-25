# rule-process-cargo-release - best-practice implementation plan

Status: `done`
Notes:`done` 2026-10-25. Eight rules (four blocking, four advisory) at precision and recall 1.00; the body and two references written, with the first-release exception and the yank section; `/rule-init` reports a crate's manifest and lockfile. Two substitutions recorded: the shared rules are copies with shared parsing, and `release-version-matches-tag` became `release-version-not-in-workflow` because a rule is handed one file. Output convention: one plan per skill at `docs/plans/skills/<area>/<skill>.md`. Index: `docs/plans/skills/README.md` (#88).

Area: process. Order: appended after `rule-process-npm-release`; it is the Rust half of the same subject.

## Why this skill exists

A Rust maintainer asking _"how do I release without a stealable token"_ gets sent to
`rule-process-npm-release`, whose every command (`npm stage publish`, `.npmrc`, Trusted
Publisher on npmjs.com) is wrong for them. The mechanism exists on the Rust side and is
nearly unknown: **crates.io Trusted Publishing** (RFC 3691) exchanges a GitHub or GitLab OIDC
token for a 30-minute publish token.

The difference from npm is one word, and it is the whole skill: **cargo cannot perform the
exchange.** `cargo publish --help` has no token, no OIDC and no auth flag - verified below -
so the token is minted by an action or a script and injected through `CARGO_REGISTRY_TOKEN`
for one step. Everything a rule can enforce follows from that shape.

Correction recorded during Phase 0: an earlier draft of this plan assumed crates.io had no
trusted publishing and built the whole skill around a token that cannot be removed. That was
wrong, and the evidence is in the migration `2025-04-25-090000_trusted-publishing`, the
`crates_io_trustpub` crate and the published documentation page.

## Evidence base

Read and measured in this session (2026-10-25):

- [Trusted Publishing](https://crates.io/docs/trusted-publishing) (crates.io, rendered from
  `svelte/src/routes/docs/trusted-publishing/+page.svelte`): OIDC-based, verified against the
  platform's JWKS, **tokens expire after 30 minutes**; prerequisites are that the crate **is
  already published** (the initial publish needs an API token), that the caller is an owner,
  and that the repository is on GitHub or GitLab; GitHub setup is
  `permissions: id-token: write` + `uses: rust-lang/crates-io-auth-action@v1` (`id: auth`) +
  `cargo publish` with `env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}`; an
  optional `environment: release` adds protection rules; GitLab (public beta) declares
  `id_tokens: CRATES_IO_ID_TOKEN: { aud: crates.io }` and exchanges it with
  `POST https://crates.io/api/v1/trusted_publishing/tokens`; the documented migration is
  _set up, test, then remove the API token from the secrets_; the documented best practices are
  specific workflow filenames, protected environments, narrow triggers, reviewed actions and
  crates.io email notifications.
- [rust-lang/crates-io-auth-action](https://github.com/rust-lang/crates-io-auth-action): the
  action fetches the temporary token into its `token` output, and its `post` step **revokes**
  it when the job ends; `url` overrides the registry (staging).
- Measured locally: `cargo 1.99.0 (5f94df478 2026-08-27)`, `rustc 1.99.0`. `cargo publish --help`
  is 41 lines and contains **zero** occurrences of "token", "auth" or "oidc"; the options are
  `--dry-run`, `--index`, `--registry`, `--no-verify`, `--allow-dirty`, `--package`,
  `--workspace`, `--exclude`, features, jobs, `--target` plus the manifest flags
  (`--locked`, `--frozen`, `--offline`). `cargo login --help` also has no `--token`.
- [Publishing on crates.io](https://doc.rust-lang.org/cargo/reference/publishing.html): a
  publish is permanent - a version cannot be overwritten and the code cannot be deleted; the
  manifest must carry `license`/`license-file`, `description`, `homepage`, `repository` and
  `readme`; `cargo publish --dry-run` (or `cargo package`) runs the first three of the five
  publish steps and leaves the archive in `target/package`; crates.io enforces a **10 MB**
  `.crate` limit; `cargo package --list` shows what is packed; `cargo yank --version <v>`
  (and `--undo`) stops new resolutions without deleting anything; `cargo owner --add|--remove`
  manages named and team owners; the book suggests `cargo-release`, `cargo-smart-release` or
  `release-plz` for automation.
- [Registry Authentication](https://doc.rust-lang.org/cargo/reference/registry-authentication.html):
  the recommended `[registry] global-credential-providers` list starts with `cargo:token` and
  adds `cargo:libsecret`, `cargo:macos-keychain`, `cargo:wincred`, and **later entries have
  higher precedence**; `cargo:token` reads the plain-text credentials file **and** the
  `CARGO_REGISTRIES_<NAME>_TOKEN` environment variables, which do not work when that provider
  is not listed; `cargo:token-from-stdout <command>` takes a token from a subprocess.
- `skills/rule-process-npm-release/SKILL.md` and its plan: the shape reused here - facts, one
  batch of questions, the manual half the user performs, then the repo changes - plus the
  four-blocking/four-advisory rule budget and the shared workflow helper.
- `src/core/release/_detect.js` (this repository): the release report is `package.json`-shaped,
  so a crate with `Cargo.toml` and a `release.yml` reports as having no tooling at all.
- `tests/docs/action-pins.test.mjs`: prior art for the SHA-pinned action rule, which this skill
  cites instead of reimplementing.

Problems found:

| Problem                                 | Detail                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| the mechanism is not discoverable       | a maintainer looking for "cargo trusted publishing" in the Cargo Book finds nothing; the answer lives on crates.io         |
| the first publish cannot use it         | the crate must already exist, so every new crate starts with a token and needs a migration step, not a setup step          |
| cargo cannot exchange the token         | the injection is a step-level env var; a workflow that carries it at workflow level hands it to every step                 |
| the action is a supply-chain dependency | `crates-io-auth-action` sits in the publish path and can mint a token; the pin and the review are the mitigation           |
| the 30-minute window is invisible       | a long matrix release can outlive its token and fail after some crates were published                                      |
| a publish is irreversible               | a `.crate` cannot be overwritten or deleted, so the dry run and `--list` are the only review before the point of no return |
| the 10 MB limit is silent               | a release that packs test data or fixtures fails at upload, after the version exists in the manifest                       |
| credential providers are misordered     | the recommended list is easy to write backwards, and a misplaced `cargo:token` silently prefers the plain-text file        |
| no ecosystem answer                     | `/rule-init` cannot see a Cargo release, and the router sends a Rust user to the npm skill                                 |
| yank is undocumented in the workflow    | the recovery path (`cargo yank`) exists and nobody writes it down until an incident                                        |

## Decisions

| Question           | Decision                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Shape              | Same five steps as the npm sibling                                                                      |
| Rule set           | Eight rules: four blocking, four advisory                                                               |
| Trusted publishing | The skill's default path, with the first-publish exception stated before the setup steps                |
| Token handling     | The temporary token reaches **one step** through `env:`; `id-token: write` sits only on the publish job |
| Helper             | Reuse the shared workflow module (npm `#1`, CONTRACT); no second YAML parser                            |
| Release tooling    | The skill names `release-plz` and `cargo-release` as options and does not require either                |
| Recovery           | A yank section, because it is what a maintainer reaches for during an incident and it deletes nothing   |
| Delivery           | Plan only                                                                                               |

## Workstream A - The body

`skills/rule-process-cargo-release/SKILL.md`, target about 150 lines:

1. the outcome in three sentences: no long-lived crates.io token, one workflow, a manual
   approval, a temporary token that dies in 30 minutes;
2. the strict sequence: facts, one batch of questions, manual settings, wait, repo changes;
3. the read-only facts: `Cargo.toml` (`[package]`, `[workspace.package]`, `version.workspace`),
   `Cargo.lock`, existing tags, whether the crate is on crates.io, `cargo package --list` and
   its size, whether `release-plz`/`cargo-release` is already configured;
4. **the first-publish exception**, before anything else can fail: a crate that does not exist
   yet cannot use Trusted Publishing, so the skill publishes once with a scoped token and then
   migrates;
5. the questions asked once: tag format, static version or a release tool that bumps it, binary
   or library (which decides whether `Cargo.lock` is committed), MSRV policy, workspace with
   several publishable crates, environment name;
6. the manual half, `references/manual-settings.md`: crate settings → Trusted Publishing → add
   GitHub publisher (owner, repository, **workflow filename**, optional environment), the
   protected environment with required reviewers, then the token removal and revocation;
7. the repo changes, `references/publish-workflow.md`: the verify job with
   `cargo publish --dry-run` and `cargo package --list`, then the publish job with
   `id-token: write`, the pinned auth action, and `cargo publish` with the token on that step;
8. a closing table: which rule enforces what, plus the two items no rule can see (the publisher
   added in the UI and the owner list).

## Workstream B - The workflow helper

The same `src/core/guardrails/workflow/` reader the npm and uv nodes use (CONTRACT
`rule-process-npm-release#1`, already implemented: `_lines.js` + `index.js`). The cargo-specific fixtures are its own: a workspace with
several publishable crates, a verify job with the dry run, a `matrix` publish, a job that
exports `CARGO_REGISTRY_TOKEN` at workflow level, and a GitLab pipeline shape the rules pass
over rather than misread.

Step-level parsing is what earns the helper here: "the token is on the `cargo publish` step and
nowhere else" is a question about `steps[].env`, not about the file's text.

## Workstream C - The four blocking rules

| Rule id                       | Rejects                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `release-no-long-lived-token` | `CARGO_REGISTRY_TOKEN` / `CARGO_REGISTRIES_*_TOKEN` fed from `secrets.*` in the publish job |
| `release-id-token-isolated`   | `id-token: write` on a job that installs, caches, or is not the only job carrying it        |
| `release-token-step-scoped`   | the temporary token at workflow or job level instead of on the `cargo publish` step's `env` |
| `release-actions-pinned`      | a `uses:` without a 40-hex SHA and a version comment (shared id, shared implementation)     |

`release-token-step-scoped` is the rule that carries the skill: cargo cannot exchange the token
itself, so the only thing bounding a leaked credential is where it is written.

## Workstream D - The four advisory rules

| Rule id                       | Rejects                                                                                | Why advisory                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `release-dry-run-first`       | a publish job with no `cargo publish --dry-run` (or `cargo package`) before the upload | a verify job may legitimately do it, so the shape is accepted too      |
| `release-package-list`        | no `cargo package --list` before the upload                                            | a single-crate library may not need the review                         |
| `release-manifest-metadata`   | a `[package]` without `license`, `description`, `repository` or `readme`               | a first publish is already blocked by crates.io; private crates differ |
| `release-version-matches-tag` | the tag does not equal `[package].version` (or `version.workspace`)                    | a release tool may bump and tag in one step                            |

`release-least-privilege` folds into `release-id-token-isolated` here, because the only extra
permission cargo needs is the OIDC exchange itself.

## Workstream E - The two facts no rule can see

- **First publish.** The crate must exist, so the first release uses a token and the second
  one uses the publisher. The skill states the order and the cleanup, and no rule can tell
  whether a crate is already published - only the user, or a network call the skill must not
  make.
- **The 30-minute window.** Tokens expire after 30 minutes; a workspace release that publishes
  ten crates in sequence can outlive a token minted once at the top. The skill says to mint per
  job, and `references/publish-workflow.md` shows the shape.

## Workstream F - The recovery path

The Cargo Book's permanence policy is the reason the skill needs a section no npm skill has:
what to do when a published version is wrong. `cargo yank --version <v>` stops new
resolutions and keeps existing lockfiles working, and it does **not** remove code or undo a
leaked secret. The section says that plainly.

## Workstream G - `/rule-init` learns to see a Cargo release

Same seam as the uv plan, and the same honesty: `src/core/release/_detect.js` reads
`Cargo.toml`, `Cargo.lock` and `.github/workflows/release*.yml`, reports what is there, and
installs nothing.

## Proposed guardrails

| Rule id                       | Rejects                                                     | Tier | Source                            |
| ----------------------------- | ----------------------------------------------------------- | ---- | --------------------------------- |
| `release-no-long-lived-token` | a `secrets.*` token in the publish path                     | A    | crates.io Trusted Publishing      |
| `release-id-token-isolated`   | `id-token` on a job that installs or caches, or on two jobs | A    | npm plan, same helper             |
| `release-token-step-scoped`   | the temporary token at job or workflow level                | A    | crates.io Trusted Publishing      |
| `release-actions-pinned`      | an unpinned `uses:`                                         | A    | `tests/docs/action-pins.test.mjs` |
| `release-dry-run-first`       | an upload with no dry run before it                         | B    | Cargo Book, publishing            |
| `release-package-list`        | no `cargo package --list` before the upload                 | B    | Cargo Book, publishing (10 MB)    |
| `release-manifest-metadata`   | missing `license`/`description`/`repository`/`readme`       | B    | Cargo Book, before publishing     |
| `release-version-matches-tag` | tag and `[package].version` disagree                        | B    | Cargo Book, publishing a version  |

## Dependency graph

The leaf closes before the `rule-process` router, which cannot list a skill that does not
exist. Two rule ids (`release-actions-pinned`, `release-id-token-isolated`) are shared with the
npm node, and one module (`_workflow.js`) is imported from it.

Depends on: `rule-process-ai` (HARD), `rule-mcp-process-npm-release#1` (CONTRACT)

Feeds: `rule-process` (HARD, the area router gains one row)

Shared files: tests/fixtures/guardrail-corpus.mjs, tests/fixtures/census.json, tests/fixtures/tool-surface.json, docs/10-tools.md, docs/09-skills.md, docs/plans/skills/README.md, docs/plans/skills/skills-plan.md

### Phase 0 - Evaluation and decisions

- [x] Check the crates.io documentation for a trusted-publishing or OIDC flow, and record the answer with its URL either way. Answer: **it exists** - [crates.io/docs/trusted-publishing](https://crates.io/docs/trusted-publishing), RFC 3691, tokens valid 30 minutes, GitHub and GitLab (beta), crate must already be published.
- [x] Read the published workflow shape rather than inventing one: `permissions: id-token: write`, `rust-lang/crates-io-auth-action@v1` with `id: auth`, `cargo publish` with `env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}`, optional `environment: release`.
- [x] Confirm the env-var spelling against the installed cargo: `CARGO_REGISTRY_TOKEN` is the documented variable, and `cargo:token` reads `CARGO_REGISTRIES_<NAME>_TOKEN`; `cargo 1.99.0` verified locally.
- [x] Confirm that cargo has no token or OIDC flag of its own, which is what makes the injection step necessary: `cargo publish --help` is 41 lines with zero matches for "token", "auth" or "oidc".
- [x] Confirm with the owner whether the shared workflow helper lives in `src/core/guardrails/` (the same open question as the uv plan; one answer closes both). Decided 2026-10-25: `src/core/guardrails/workflow/`, already implemented.

### Phase 1 - Fixtures and the helper

- [x] Write the failure fixtures first: a workspace with two publishable crates, a verify job, a matrix publish, a workflow-level token, a job-level token, a `secrets.*` token, and a GitLab pipeline that must pass untouched. Eleven entries in the corpus, including a `cargo publish --dry-run` workflow that is verification rather than a release, and the GitLab pipeline that `parseWorkflow` refuses so the rules step over it.
- [x] Import the shared `src/core/guardrails/workflow/` reader and extend its suite with the cargo shapes; the step-level `env:` reader already exists (`step.env`), so the work is the fixtures, not the parser. No parser change was needed.
- [x] Gate: the helper suite green and no rule file carries its own YAML reader. Evidence: `_workflow` 10/10; every cargo rule calls `context.helpers.parseWorkflow`.

### Phase 2 - The blocking rules

- [x] `release-no-long-lived-token`, including a token inside a comment and one in a reusable workflow's `secrets:` block. Evidence: `skills/rule-process-cargo-release/guardrails/_no-long-lived-token.js`; the rule separates `secrets.*` (long-lived, rejected) from `steps.auth.outputs.token` (the exchange, accepted), which is the distinction the whole skill rests on.
- [x] `release-token-step-scoped`, including the legitimate staging-URL variant of the action. The rule reports the variable at workflow and at job level separately, and a step-level token passes.
- [x] `release-id-token-isolated` and `release-actions-pinned` carried by this skill. Same decision as the uv node: copies with the shared parser, because a rule imports nothing (ADR 089) and the engine has no partial inheritance.
- [x] Gate: the four rules green on the corpus, and `rule_tool_check` on this repository stays clean. Evidence: precision and recall 1.00 on all four; the four rules report nothing on this repository's five workflows.

### Phase 3 - The advisory rules, the body and `/rule-init`

- [x] The four advisory rules with one exception fixture each (a dry run in a separate verify job is the first of them). Evidence: `_dry-run-first.js`, `_package-list.js`, `_manifest-metadata.js`, `_version-not-in-workflow.js`, nine fixtures. **One rule changed shape in execution:** `release-version-matches-tag` compares the tag with `[package].version`, and a rule is handed one file - so the checkable form is `release-version-not-in-workflow` (the pipeline must not rewrite the version beside a tag that already names one), the same substitution the uv node recorded. `release-manifest-metadata` reads `Cargo.toml` directly, because a manifest rule can.
- [x] The body at about 150 lines plus `references/manual-settings.md`, `references/publish-workflow.md`, the first-publish exception and the yank recovery section. Measured: 159 lines of body, and two references that carry the workflow (verify job with dry run, `--list`, the 10 MB check; the workspace loop and the 30-minute window) and the crates.io and github.com checklists.
- [x] `src/core/release/_detect.js` reads `Cargo.toml`, `Cargo.lock` and the release workflow, and the labels cover the Cargo case. Evidence: two fields (`cargoManifest`, `cargoLock`) with labels `Cargo.toml` / `Cargo.lock`, and a Rust fixture in `_detect.test.mjs`.
- [x] Gate: a diff review that finds every removed claim with a destination. Evidence: the cartesian doc traits, the 10 MB limit and the yank recovery each live in a named section of the two references; the rule table lists eight rules and names the three items only a human can see (the Trusted Publisher, the token removal, the token-based first release).

### Phase 4 - Verification

- [x] Run the gates below. Evidence 2026-10-25: `_accuracy` 4/4, `_coverage` 1/1 (all eight cargo rules at precision and recall 1.00), `_workflow` 10/10, `_false-positives` 9/9, `_detect` 4/4, `src/core/layers` 36/36, `pnpm census` current.
- [x] Run the eight rules against this repository's own `.github/workflows/`. Result: all five workflows clean of the eight cargo rules, because none publishes with `cargo publish`.
- [x] Regenerate the generated documents (`pnpm census`) and update the tool count in `README.md`. Evidence: `rule_tool_process_cargo_release` is in the tool list and the surface map; `README.md` moved to 83 skills / 104 tools / 174 resources when the skill landed; the `rule-process` router lists it.

## Model assignment

Classes and evidence: section 14 of `docs/plans/plan-of-plans.md`.

| Step                            | Class       | Model                     | Why                               |
| ------------------------------- | ----------- | ------------------------- | --------------------------------- |
| Phase 0 - Evaluation            | `T1-plan`   | `gemini-4-argon` (high)   | claims verified against live docs |
| Phase 1 - fixtures and helper   | `T4-tests`  | `deepseek-v4.1-flash`     | fixtures before code              |
| Phase 2 - the blocking rules    | `T3-rules`  | `kimi-k2.7-code`          | small deterministic regex work    |
| Phase 3 - advisory and the body | `T7-author` | `qwen3.8-max`             | skill prose and references        |
| Phase 4 - Verification          | `T8-verify` | `gemini-3.8-flash` (high) | fast loops over gates             |

Plan default: `T3-rules` - `kimi-k2.7-code`. Fallback: `step-5-preview` for authoring, `glm-5.3-flash` for bulk edits.

## Verification gates

```bash
node --import ./scripts/alias-hook.mjs --test skills/rule-process-cargo-release/guardrails/
node --import ./scripts/alias-hook.mjs --test src/core/guardrails/__tests__/_workflow.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/guardrails/__tests__/_enforcement.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/release/__tests__/_detect.test.mjs
node --import ./scripts/alias-hook.mjs --test src/core/skills/__tests__/_corpus.test.mjs
pnpm census && pnpm census:check
pnpm lint
```

## Open notes

- **The Phase 0 correction is the most useful thing in this plan.** A draft built the skill on
  "crates.io has no OIDC", which would have taught a maintainer to keep a long-lived token
  forever. The measured answer is the opposite, and the plan keeps the correction visible
  instead of quietly rewriting the draft.
- **`cargo publish` has no `--token` in 1.99.0**, so a rule rejecting it would fire only on
  legacy invocations and on wrappers. The rule was dropped rather than kept as decoration; the
  script that injects the token is the thing to bound.
- **The auth action is in the trust path.** It can mint a token for any crate the publisher
  covers, so `release-actions-pinned` matters more here than anywhere else, and the skill says
  to review the action rather than trust its tag.
- **First publish is prose, forever.** No rule can read "is this crate on crates.io", and a
  network call inside a guardrail is a bad trade; the exception stays in the body.
- **Yank is not a delete.** The recovery section is prose, because no rule can read a decision.
