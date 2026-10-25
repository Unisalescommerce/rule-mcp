---
name: rule-process-cargo-release
description: "Set up a secure release process for a Rust crate: publish to crates.io through Trusted Publishing, keep the API token out of the workflow, dry-run before the irreversible upload. Use for any request to publish a crate, release to crates.io, harden a cargo publish pipeline, or migrate a token-based release to OIDC."
tags:
  - "security"
  - "rust"
  - "cargo"
  - "crates-io"
  - "supply-chain"
  - "ci-cd"
frameworks: [cargo, github-actions]
guardrails:
  [
    release-no-long-lived-token,
    release-token-step-scoped,
    release-actions-pinned,
    release-id-token-isolated,
    release-dry-run-first,
    release-package-list,
    release-manifest-metadata,
    release-version-not-in-workflow,
  ]
---

# Release a Rust crate, securely

The outcome: no long-lived crates.io token in the repository, one workflow publishes, and the
credential that does it lives for thirty minutes. crates.io supports Trusted Publishing (RFC
3691): an OIDC exchange returns a token that expires in 30 minutes, and the action that fetches
it revokes it when the job ends.

The difference from npm is one sentence: **cargo cannot perform the exchange itself.**
`cargo publish --help` on 1.99.0 has no token and no OIDC flag, so the token is minted by an
action and injected through `CARGO_REGISTRY_TOKEN` - which means _where_ it is written is the
whole rule set.

## How to run this skill

Half of the setup is repository files; the other half is settings on crates.io and github.com
that **only the user can change**. The user acts before you do, and the order is strict -
**facts, then one batch of questions, then the manual settings, then the repo changes**:

1. **Gather facts** (Step 1), read-only and silent.
2. **Ask all questions together** in one message and wait for the answers.
3. **Hand off the manual settings** (Step 2) with resolved links and the exact values.
4. **Wait for an explicit confirmation** - no repo change until the user says the settings are done.
5. **Change the repository** (Step 3).

## Step 1: Gather facts

- **Crates.** Root `Cargo.toml`; `[workspace]` members are the publishable set, and
  `publish = false` marks the ones that never leave the machine.
- **Version source**: `[package] version`, or `version.workspace = true` inherited from the
  workspace - and which tool bumps it (`release-plz`, `cargo-release`, or a human).
- **Lockfile**: `Cargo.lock` committed or not, which for a binary is a decision and for a
  library is not.
- **Published or not**: `cargo search <name>` or the crate page; a crate that does not exist
  cannot use Trusted Publishing yet (see [First release](#first-release)).
- **Owner/repo** from `[package.repository]` or `git remote get-url origin`.
- **Tag format** from `git tag --sort=-creatordate | head`; default to `v1.0.0` only when there
  are no tags.
- **Metadata** the first publish requires: `license` or `license-file`, `description`,
  `repository`, `readme`.
- **Existing workflows**, especially any release workflow and any `CARGO_REGISTRY_TOKEN` from
  `secrets.`.

## The questions to ask together

One message, then wait: the **GitHub environment name** (a protected environment is what makes
the approval mandatory); whether the **version is bumped by a tool** or by hand in the tagged
commit; **binary or library**, which decides whether `Cargo.lock` is committed; the **MSRV** if
the crate declares one; whether the workspace publishes **every member or a tagged subset**; and
anything else the project raises.

## First release

A Trusted Publisher lives on the crate's settings page, which does not exist until the crate
does. So the **first publish uses an API token** - the crates.io documentation says so plainly -
and the migration happens immediately after:

1. Confirm the name is free and warn about typosquatting-adjacent names.
2. Publish the first version from the maintainer's machine: `cargo publish --dry-run`, then
   `cargo publish` with a token scoped to publish-new only.
3. Then run the full Step 2 checklist, and remove the token from the secrets. crates.io supports
   both methods during the transition; leaving the token there is the failure mode.

## Step 2: Manual settings (the user acts)

In `references/manual-settings.md`: the crates.io Trusted Publisher form (platform, repository
owner and name, **workflow filename**, optional environment) and the environment protection
rules on github.com. Present it as a numbered checklist with resolved links, then verify what
can be verified without a browser and re-ask about anything still unset.

## Step 3: Repo changes (do these yourself)

The workflow is in `references/publish-workflow.md`. The rules that shape it:

- Trigger on version tags, matching the repository's existing format.
- A verify job runs `cargo publish --dry-run` and `cargo package --list`; a workspace release
  also checks the `.crate` size against the 10 MB limit before the upload.
- The publish job declares `id-token: write` and nothing else write-shaped, installs no
  toolchain, restores no cache, and runs the pinned auth action before `cargo publish`.
- The token appears on **one step's** `env:`, never at job or workflow level.
- One publish per crate, and a token minted per job: the credential expires after 30 minutes,
  so a workspace that publishes ten crates in sequence can outlive a token minted once.

## A publish is permanent

This is the part with no npm equivalent: a `.crate` cannot be overwritten and its code cannot be
deleted. `cargo yank --version <v>` stops new resolutions and keeps existing lockfiles working,
and it removes nothing - not the code, not a leaked secret. Say that plainly; a yank is what a
maintainer reaches for during an incident and it is not what they think it is.

## Tell the user how to release now

```sh
# Bump the version (cargo-release, release-plz, or by hand) and update CHANGELOG.md
git add .
git commit -m 'Release 1.0.1'
git tag v1.0.1   # `git tag -s` is better if signing keys are set up
git push origin v1.0.1
```

CI verifies with `--dry-run`, exchanges the OIDC identity for a token, and publishes. Suggest a
patch release as an end-to-end test of the pipeline.

## What a rule enforces, and what nothing can

| Rule                          | Rejects                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `release-no-long-lived-token` | a registry token read from `secrets.` in a publishing workflow                         |
| `release-token-step-scoped`   | the token at workflow or job level instead of on the publish step                      |
| `release-actions-pinned`      | a `uses:` without a 40-hex SHA and a version comment                                   |
| `release-id-token-isolated`   | `id-token` on a job that builds, fetches, installs a toolchain, or is not the only one |

Three items stay with the reader of this page, because no rule can see them: the **Trusted
Publisher exists for this workflow filename**, the **API token is gone from the secrets**, and
the **first release was the token one** - the exception every later release inherits.

## See also

- [rule-process-npm-release](../rule-process-npm-release/SKILL.md) - the same subject for an npm package
- [rule-process-uv-release](../rule-process-uv-release/SKILL.md) - the same subject for a Python package
- [rule-mcp](../rule/SKILL.md) - central skill index and dispatcher
- [rule-process](../rule-process/SKILL.md) - process skill index
- [rule-platform-library](../rule-platform-library/SKILL.md) - package structure and public API design
