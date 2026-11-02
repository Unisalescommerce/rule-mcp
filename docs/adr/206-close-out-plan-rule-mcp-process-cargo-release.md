# 206: Close out plan _rule-mcp-process-cargo-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The plan record docs/plans/skills/process/_rule-mcp-process-cargo-release.md, "rule-process-cargo-release - best-practice implementation plan", finished with 19 closed items.

## Outcome

- Check the crates.io documentation for a trusted-publishing or OIDC flow, and record the answer with its URL either way. Answer: it exists - [crates.io/docs/trusted-publishing](https://crates.io/docs/trusted-publishing), RFC 3691, tokens valid 30 minutes, GitHub and GitLab (beta), crate must already be published.
- Read the published workflow shape rather than inventing one: permissions: id-token: write, rust-lang/crates-io-auth-action@v1 with id: auth, cargo publish with env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}, optional environment: release.
- Confirm the env-var spelling against the installed cargo: CARGO_REGISTRY_TOKEN is the documented variable, and cargo:token reads CARGO_REGISTRIES_<NAME>_TOKEN; cargo 1.99.0 verified locally.
- Confirm that cargo has no token or OIDC flag of its own, which is what makes the injection step necessary: cargo publish --help is 41 lines with zero matches for "token", "auth" or "oidc".
- Confirm with the owner whether the shared workflow helper lives in src/core/guardrails/ (the same open question as the uv plan; one answer closes both). Decided 2026-10-25: src/core/guardrails/workflow/, already implemented.
- Write the failure fixtures first: a workspace with two publishable crates, a verify job, a matrix publish, a workflow-level token, a job-level token, a secrets.* token, and a GitLab pipeline that must pass untouched. Eleven entries in the corpus, including a cargo publish --dry-run workflow that is verification rather than a release, and the GitLab pipeline that parseWorkflow refuses so the rules step over it.
- Import the shared src/core/guardrails/workflow/ reader and extend its suite with the cargo shapes; the step-level env: reader already exists (step.env), so the work is the fixtures, not the parser. No parser change was needed.
- Gate: the helper suite green and no rule file carries its own YAML reader. Evidence: _workflow 10/10; every cargo rule calls context.helpers.parseWorkflow.
- release-no-long-lived-token, including a token inside a comment and one in a reusable workflow's secrets: block. Evidence: skills/rule-process-cargo-release/guardrails/_no-long-lived-token.js; the rule separates secrets.* (long-lived, rejected) from steps.auth.outputs.token (the exchange, accepted), which is the distinction the whole skill rests on.
- release-token-step-scoped, including the legitimate staging-URL variant of the action. The rule reports the variable at workflow and at job level separately, and a step-level token passes.
- release-id-token-isolated and release-actions-pinned carried by this skill. Same decision as the uv node: copies with the shared parser, because a rule imports nothing (ADR 089) and the engine has no partial inheritance.
- Gate: the four rules green on the corpus, and rule_tool_check on this repository stays clean. Evidence: precision and recall 1.00 on all four; the four rules report nothing on this repository's five workflows.
- The four advisory rules with one exception fixture each (a dry run in a separate verify job is the first of them). Evidence: _dry-run-first.js, _package-list.js, _manifest-metadata.js, _version-not-in-workflow.js, nine fixtures. One rule changed shape in execution: release-version-matches-tag compares the tag with [package].version, and a rule is handed one file - so the checkable form is release-version-not-in-workflow (the pipeline must not rewrite the version beside a tag that already names one), the same substitution the uv node recorded. release-manifest-metadata reads Cargo.toml directly, because a manifest rule can.
- The body at about 150 lines plus references/manual-settings.md, references/publish-workflow.md, the first-publish exception and the yank recovery section. Measured: 159 lines of body, and two references that carry the workflow (verify job with dry run, --list, the 10 MB check; the workspace loop and the 30-minute window) and the crates.io and github.com checklists.
- src/core/release/_detect.js reads Cargo.toml, Cargo.lock and the release workflow, and the labels cover the Cargo case. Evidence: two fields (cargoManifest, cargoLock) with labels Cargo.toml / Cargo.lock, and a Rust fixture in _detect.test.mjs.
- Gate: a diff review that finds every removed claim with a destination. Evidence: the cartesian doc traits, the 10 MB limit and the yank recovery each live in a named section of the two references; the rule table lists eight rules and names the three items only a human can see (the Trusted Publisher, the token removal, the token-based first release).
- Run the gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1 (all eight cargo rules at precision and recall 1.00), _workflow 10/10, _false-positives 9/9, _detect 4/4, src/core/layers 36/36, pnpm census current.
- Run the eight rules against this repository's own .github/workflows/. Result: all five workflows clean of the eight cargo rules, because none publishes with cargo publish.
- Regenerate the generated documents (pnpm census) and update the tool count in README.md. Evidence: rule_tool_process_cargo_release is in the tool list and the surface map; README.md moved to 83 skills / 104 tools / 174 resources when the skill landed; the rule-process router lists it.

## Decision

Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-cargo-release.md is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
