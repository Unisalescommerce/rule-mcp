# 29: Three release skills, one workflow reader, and the host-integration plan

- **Branch**: `rel/v0.1.0`
- **Commit range**: `98560749..f8f729cc` (10 commits this session)
- **Base**: `main` (merge base `325936e6`); 251 feature commits ahead, 0 behind, 0 Conventional Commit violations, 2 merge commits in the whole range
- **Date**: 2026-10-25

## Done

1. **Shared workflow reader** — `src/core/guardrails/workflow/` (`_lines.js` 134 lines, `index.js` 100, ADR 061): entries, nested maps, `- ` items and block scalars by indentation, no YAML dependency. It returns `null` for tabs, an anchor or a merge key on `jobs:`, so a rule passes on a file it cannot follow instead of blocking a release on a parser limitation. `parseWorkflow` joined `GUARDRAIL_HELPERS` (ADR 089 contract change). 10 tests.
2. **Fixture corpus** — 39 labeled snippets for the release rules, each a rule plus the code it must judge, including the ones that protect the boundary: a CI job that publishes nothing, a token inside a comment, a GitLab pipeline, a `cargo publish --dry-run`. Every rule id sits at precision 1.00 and recall 1.00.
3. **npm release rules** — 8 rules and the body cut from 321 to 164 lines, with `references/publish-workflow.md` and `references/manual-settings.md`. The advisory four were firing on four CI workflows that publish nothing; every advisory rule is now scoped to a workflow that runs an npm publish.
4. **uv release skill** — 8 rules (PyPI Trusted Publishing, `uv build --no-sources`, `--locked` syncs, the attestation trap: uv uploads `*.publish.attestation` and creates none).
5. **cargo release skill** — 8 rules. Phase 0 corrected the plan: crates.io **has** Trusted Publishing (RFC 3691, 30-minute tokens, `rust-lang/crates-io-auth-action`). cargo cannot perform the exchange - `cargo publish --help` on 1.99.0 has no token or OIDC flag - so the token is injected through `CARGO_REGISTRY_TOKEN`, and where it is written is the rule set.
6. **`/rule-init` sees Python and Rust** — `pyproject`, `pythonBuildSystem`, `uvLock`, `cargoManifest`, `cargoLock`, with labels a reader recognizes.
7. **Plans** — npm 20/20 done, uv 20/20 done, cargo 19/19 done; `mcp-host-integration-depth.md` planned at 0/26; `plan-of-plans.md` section 16 registers the plans written after the 2026-10-21 graph.

## Commits this session

1. `5688be5e` feat(guardrails): read GitHub workflows as jobs and steps
2. `2634277a` test(guardrails): add fixtures for the three release skills
3. `676a813e` feat(skills): add the npm release rules and cut the skill body
4. `cd1b5cb2` feat(skills): add the uv release skill
5. `c2b0585c` feat(skills): add the cargo release skill
6. `154c2dd6` feat(init): report Python and Rust release tooling
7. `7906ddaf` feat(skills): list the release skills in the process router
8. `378ca215` docs(census): regenerate the handbook for the release skills
9. `1e7a4311` docs(handoff): refresh the handoff index
10. `f8f729cc` docs(plans): register the release and host-integration plans

## ADRs

None written this session. The three release plans carry their own decisions in their `## Decisions` tables and in the substitutions they record; no boundary in the engine or the catalog changed shape.

## Left out / next

- `docs/spike/` stays untracked (owner choice, unchanged from handoff 28).
- `mcp-host-integration-depth.md` Phase 0: 31 evidence rows, the Roo Code contradiction (the spike says `confirmed`, `_hook-hosts.js` says the extension shut down in May 2026), the Codex prompt directory (ADR 179 vs a Skill-first upstream), and the eight products with no installer row.
- Two findings recorded, not fixed: `pnpm census` reports 9 distinct guardrails while the tree carries ~100 (it counts the engine's own families only), and the JavaScript rules run on `.yml` files (`js-if-braces` on `release.yml`).
- Two substitutions recorded, not reversed: `release-actions-pinned` and `release-id-token-isolated` are copies with the shared parser (a rule imports nothing, the engine has no partial inheritance), and `release-version-matches-tag` became `release-version-not-in-workflow` in both new skills because a rule is handed one file.
- Dependency cooldown still has no Python or Rust owner: the npm plan hands `pkg-minimum-release-age` to `rule-toolchain-pnpm`, and the uv spelling (`exclude-newer`) and the cargo one are named as unowned in its Phase 2.
- 2 merge commits remain in the feature range (`e9d29e8e`, `df6ba117`); `rule_tool_git action=linearize force=true` is the normalization proposal, not run this session.
- Pre-existing red tests, unchanged by this work: `_enforcement`, `_policy` and the JavaScript self-check in `src/core/guardrails`, two assertions in `tests/plans/skills-plan.test.mjs` (plan files are named `rule-mcp-<skill>.md` while stage tables list `<skill>`), `tests/docs/repository-contract.test.mjs`, the handbook numbering and link-integrity suites, the 150-line ratchet offenders, and the `README advertises the catalog skill count` assertion (it matches `rule-mcp-*` directories, which do not exist).

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/29-release-skills-and-workflow-reader.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Three release skills are done (npm 20/20, uv 20/20, cargo 19/19) and share one reader:
src/core/guardrails/workflow/. Do not reimplement YAML parsing in a rule; call
context.helpers.parseWorkflow, and scope every release rule to a workflow that publishes.
First step: start docs/plans/mcp-host-integration-depth.md Phase 0 - one evidence row per
spike product (31), resolve the Roo Code and Codex-prompt contradictions, and register the
eight products that have no installer row.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
