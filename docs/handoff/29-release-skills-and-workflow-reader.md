# 29: Three release skills, one workflow reader, and the host-integration plan

- **Branch**: `rel/v0.1.0`
- **Commit range**: `e38af1e4..436f6b01` (10 commits this session)
- **Base**: `main` (merge base `325936e6`); 251 feature commits ahead, 0 behind, 0 Conventional Commit violations, 2 merge commits in whole range
- **Date**: 2026-10-25

## Done

1. **Shared workflow reader** — `src/core/guardrails/workflow/` (`_lines.js` 134 lines, `index.js` 100, ADR 053): entries, nested maps, `- ` items and block scalars by indentation, no YAML dependency. It returns `null` for tabs, anchor or merge key on `jobs:`, so rule passes on file it cannot follow instead of blocking release on parser limitation. `parseWorkflow` joined `GUARDRAIL_HELPERS` (ADR 081 contract change). 10 tests.
2. **Fixture corpus** — 39 labeled snippets for release rules, each rule plus code it must judge, including ones that protect boundary: CI job that publishes nothing, token inside comment, GitLab pipeline, `cargo publish --dry-run`. Every rule id sits at precision 1.00 and recall 1.00.
3. **npm release rules** — 8 rules and body cut from 321 to 164 lines, with `references/publish-workflow.md` and `references/manual-settings.md`. advisory four were firing on four CI workflows that publish nothing; every advisory rule is now scoped to workflow that runs npm publish.
4. **uv release skill** — 8 rules (PyPI Trusted Publishing, `uv build --no-sources`, `--locked` syncs, attestation trap: uv uploads `*.publish.attestation` and creates none).
5. **cargo release skill** — 8 rules. Phase 0 corrected plan: crates.io **has** Trusted Publishing (RFC 3691, 30-minute tokens, `rust-lang/crates-io-auth-action`). cargo cannot perform exchange - `cargo publish --help` on 1.99.0 has no token or OIDC flag - so token is injected through `CARGO_REGISTRY_TOKEN`, and where it is written is rule set.
6. **`/rule-init` sees Python and Rust** — `pyproject`, `pythonBuildSystem`, `uvLock`, `cargoManifest`, `cargoLock`, with labels reader recognizes.
7. **Plans** — npm 20/20 done, uv 20/20 done, cargo 19/19 done; `_mcp-host-integration-depth.md` planned at 0/26; `plan-of-plans.md` section 16 registers plans written after 2026-10-21 graph.

## Commits this session

1. `0b687686` feat(guardrails): read GitHub workflows as jobs and steps
2. `7f71ed10` test(guardrails): add fixtures for three release skills
3. `b4798ff3` feat(skills): add npm release rules and cut skill body
4. `4f556953` feat(skills): add uv release skill
5. `81a30a7e` feat(skills): add cargo release skill
6. `91d1038b` feat(init): report Python and Rust release tooling
7. `350de4b9` feat(skills): list release skills in process router
8. `1717f03a` docs(census): regenerate handbook for release skills
9. `9b5edec0` docs(handoff): refresh handoff index
10. `436f6b01` docs(plans): register release and host-integration plans

## ADRs

None written this session. three release plans carry their own decisions in their `## Decisions` tables and in substitutions they record; no boundary in engine or catalog changed shape.

## Left out / next

- `docs/spike/` stays untracked (owner choice, unchanged from handoff 28).
- `_mcp-host-integration-depth.md` Phase 0: 31 evidence rows, Roo Code contradiction (spike says `confirmed`, `_hook-hosts.js` says extension shut down in May 2026), Codex prompt directory (ADR 170 vs Skill-first upstream), and eight products with no installer row.
- Two findings recorded, not fixed: `pnpm census` reports 9 distinct guardrails while tree carries ~100 (it counts engine's own families only), and JavaScript rules run on `.yml` files (`js-if-braces` on `release.yml`).
- Two substitutions recorded, not reversed: `release-actions-pinned` and `release-id-token-isolated` are copies with shared parser (rule imports nothing, engine has no partial inheritance), and `release-version-matches-tag` became `release-version-not-in-workflow` in both new skills because rule is handed one file.
- Dependency cooldown still has no Python or Rust owner: npm plan hands `pkg-minimum-release-age` to `rule-toolchain-pnpm`, and uv spelling (`exclude-newer`) and cargo one are named as unowned in its Phase 2.
- 2 merge commits remain in feature range (`e9d29e8e`, `df6ba117`); `rule_tool_git action=linearize force=true` is normalization proposal, not run this session.
- Pre-existing red tests, unchanged by this work: `_enforcement`, `_policy` and JavaScript self-check in `src/core/guardrails`, two assertions in `tests/plans/skills-plan.test.mjs` (plan files are named `rule-mcp-<skill>.md` while stage tables list `<skill>`), `tests/docs/repository-contract.test.mjs`, handbook numbering and link-integrity suites, 150-line ratchet offenders, and `README advertises the catalog skill count` assertion (it matches `rule-mcp-*` directories, which do not exist).

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/29-release-skills-and-workflow-reader.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
Three release skills are done (npm 20/20, uv 20/20, cargo 19/19) and share one reader:
src/core/guardrails/workflow/. Do not reimplement YAML parsing in a rule; call
context.helpers.parseWorkflow, and scope every release rule to a workflow that publishes.
First step: start docs/plans/_mcp-host-integration-depth.md Phase 0 - one evidence row per
spike product (31), resolve the Roo Code and Codex-prompt contradictions, and register the
eight products that have no installer row.
Every commit is type(scope): subject; the commit-msg hook rejects a scope-less message.
Do not push.
```
