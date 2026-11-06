# 197: Close out plan _rule-mcp-process-cargo-release

- **Date**: 2026-11-02
- **Status**: accepted
- **Tags**: docs, closeout, plan
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

plan record docs/plans/skills/process/_rule-mcp-process-cargo-release.md, "rule-process-cargo-release - best-practice implementation plan", finished with 19 closed items.

## Outcome

- Check crates.io documentation for trusted-publishing or OIDC flow, and record answer with its URL either way. Answer: it exists - [crates.io/docs/trusted-publishing](https://crates.io/docs/trusted-publishing), RFC 3691, tokens valid 30 minutes, GitHub and GitLab (beta), crate must already be published.
- Read published workflow shape rather than inventing one: permissions: id-token: write, rust-lang/crates-io-auth-action@v1 with id: auth, cargo publish with env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}, optional environment: release.
- Confirm env-var spelling against installed cargo: CARGO_REGISTRY_TOKEN is documented variable, and cargo:token reads CARGO_REGISTRIES_`<NAME>`_TOKEN; cargo 1.99.0 verified locally.
- Confirm that cargo has no token or OIDC flag of its own, which is what makes injection step necessary: cargo publish --help is 41 lines with zero matches for "token", "auth" or "oidc".
- Confirm with owner whether shared workflow helper lives in src/core/guardrails/ (same open question as uv plan; one answer closes both). Decided 2026-10-25: src/core/guardrails/workflow/, already implemented.
- Write failure fixtures first: workspace with two publishable crates, verify job, matrix publish, workflow-level token, job-level token, secrets.* token, and GitLab pipeline that must pass untouched. Eleven entries in corpus, including cargo publish --dry-run workflow that is verification rather than release, and GitLab pipeline that parseWorkflow refuses so rules step over it.
- Import shared src/core/guardrails/workflow/ reader and extend its suite with cargo shapes; step-level env: reader already exists (step.env), so work is fixtures, not parser. No parser change was needed.
- Gate: helper suite green and no rule file carries its own YAML reader. Evidence: _workflow 10/10; every cargo rule calls context.helpers.parseWorkflow.
- release-no-long-lived-token, including token inside comment and one in reusable workflow's secrets: block. Evidence: skills/rule-process-cargo-release/guardrails/_no-long-lived-token.js; rule separates secrets.* (long-lived, rejected) from steps.auth.outputs.token (exchange, accepted), which is distinction whole skill rests on.
- release-token-step-scoped, including legitimate staging-URL variant of action. rule reports variable at workflow and at job level separately, and step-level token passes.
- release-id-token-isolated and release-actions-pinned carried by this skill. Same decision as uv node: copies with shared parser, because rule imports nothing (ADR 081) and engine has no partial inheritance.
- Gate: four rules green on corpus, and rule_tool_check on this repository stays clean. Evidence: precision and recall 1.00 on all four; four rules report nothing on this repository's five workflows.
- four advisory rules with one exception fixture each (dry run in separate verify job is first of them). Evidence: _dry-run-first.js, _package-list.js, _manifest-metadata.js, _version-not-in-workflow.js, nine fixtures. One rule changed shape in execution: release-version-matches-tag compares tag with [package].version, and rule is handed one file - so checkable form is release-version-not-in-workflow (pipeline must not rewrite version beside tag that already names one), same substitution uv node recorded. release-manifest-metadata reads Cargo.toml directly, because manifest rule can.
- body at about 150 lines plus references/manual-settings.md, references/publish-workflow.md, first-publish exception and yank recovery section. Measured: 159 lines of body, and two references that carry workflow (verify job with dry run, --list, 10 MB check; workspace loop and 30-minute window) and crates.io and github.com checklists.
- src/core/release/_detect.js reads Cargo.toml, Cargo.lock and release workflow, and labels cover Cargo case. Evidence: two fields (cargoManifest, cargoLock) with labels Cargo.toml / Cargo.lock, and Rust fixture in _detect.test.mjs.
- Gate: diff review that finds every removed claim with destination. Evidence: cartesian doc traits, 10 MB limit and yank recovery each live in named section of two references; rule table lists eight rules and names three items only human can see (Trusted Publisher, token removal, token-based first release).
- Run gates below. Evidence 2026-10-25: _accuracy 4/4, _coverage 1/1 (all eight cargo rules at precision and recall 1.00), _workflow 10/10, _false-positives 9/9, _detect 4/4, src/core/layers 36/36, pnpm census current.
- Run eight rules against this repository's own .github/workflows/. Result: all five workflows clean of eight cargo rules, because none publishes with cargo publish.
- Regenerate generated documents (pnpm census) and update tool count in README.md. Evidence: rule_tool_process_cargo_release is in tool list and surface map; README.md moved to 83 skills / 104 tools / 174 resources when skill landed; rule-process router lists it.

## Decision

Fold record into this ADR and session handoff, then delete source file. full text stays in git history.

## Consequences

docs/plans/skills/process/_rule-mcp-process-cargo-release.md is gone from tree; this ADR keeps what it delivered and handoff of this session names it.

## What would end this

The work this plan closed returns: a step it dismissed reopens, and this ADR no longer explains why.
