---
name: rule-process-uv-release
description: "Set up a secure release process for a Python package managed with uv: build with uv, publish to PyPI through Trusted Publishing, keep no API token in a workflow. Use for any request to publish a Python package, release to PyPI, harden a uv publish pipeline, or migrate an NPM-style or twine-based release to OIDC."
tags:
  - "security"
  - "python"
  - "uv"
  - "pypi"
  - "supply-chain"
  - "ci-cd"
frameworks: [uv, github-actions]
guardrails:
  [
    release-no-pypi-token,
    release-build-no-sources,
    release-actions-pinned,
    release-id-token-isolated,
    release-sync-locked,
    release-version-not-in-workflow,
    release-attestations,
    release-least-privilege,
  ]
---

# Release a Python package with uv, securely

The outcome: no PyPI token exists to steal, one workflow publishes, and every release still
needs a human with 2FA. The mechanism is PyPI's Trusted Publisher: uv exchanges the workflow's
OIDC identity for a short-lived token and revokes it after the upload - even when the upload
fails - so the credential never outlives the job.

## How to run this skill

Half of the setup is repository files; the other half is settings on pypi.org and github.com
that **only the user can change**. The settings are the part that needs the user, so the user
acts before you do. For the settings, produce click-by-click instructions with **direct links
resolved from the project's real data** (project name from `pyproject.toml`, owner/repo from
the `repository` field) and the exact values to enter. Never say "go to your package settings".

The order is strict - **facts, then one batch of questions, then the manual settings, then the
repo changes**:

1. **Gather facts** (Step 1), read-only and silent.
2. **Ask all questions together** in one message and wait for the answers.
3. **Hand off the manual settings** (Step 2) and ask the user to make every change.
4. **Wait for an explicit confirmation** - no repo-changing command and no file edit until
   they say the settings are done.
5. **Change the repository** (Step 3).

## Step 1: Gather facts

- **Projects.** Root `pyproject.toml`: `[project]` (`name`, `version` or `dynamic`),
  `[build-system]`, `requires-python`, and `[tool.uv]`. With a `[tool.uv.workspace]` or several
  `pyproject.toml` files it is a workspace - enumerate the members and keep the ones that are
  not `private`.
- **Lockfile.** `uv.lock` is committed or not, which decides whether CI can run `--locked`.
- **Published or not.** `curl -s https://pypi.org/pypi/<name>/json` answers `.info.version`
  for a project that exists and 404 for one that does not. There is no `uv` subcommand for
  this question; the JSON API is the read-only answer.
- **Owner/repo** from `[project.urls]` or `git remote get-url origin`.
- **Version source**: static in `pyproject.toml`, dynamic (`hatch-vcs`, `setuptools-scm`), or
  bumped by `uv version --bump` before the tag.
- **Tag format** from `git tag --sort=-creatordate | head`; default to `v1.0.0` only when
  there are no tags.
- **Existing workflows**, especially any release workflow and any `UV_PUBLISH_TOKEN` or
  `TWINE_PASSWORD` in it.

## The questions to ask together

One message, then wait: the **GitHub environment name** (a protected environment is what makes
the approval mandatory); the **cooldown** (uv's `exclude-newer`, 1 or 3 days - and it has no
owner skill yet, so say so); whether the **version is static or bumped by `uv version`**;
whether **attestations** are wanted (see Step 3); and anything else the project raises.

## Step 2: Manual settings (the user acts)

In `references/manual-settings.md`: the PyPI Trusted Publisher form (owner, repository,
**workflow filename**, environment), the environment protection rules on github.com, and the
token deletion and revocation. Present it as a numbered checklist with resolved links, then
verify what can be verified without a browser and re-ask about anything still unset.

## Step 3: Repo changes (do these yourself)

The workflow, its build and publish steps and the attestation note live in
`references/publish-workflow.md`. The rules that shape it:

- Trigger on version tags, matching the repository's existing format.
- `uv build --no-sources` in the build job: without the flag, a `tool.uv.sources` substitution
  is baked into the metadata and consumers cannot resolve the package.
- The publish job runs `uv publish` and installs nothing: `id-token: write` on that job alone,
  `contents: read` everywhere, `persist-credentials: false` on every checkout.
- `uv publish` needs no credential when the publisher exists - if a `UV_PUBLISH_TOKEN` survives
  the migration, the migration is not finished.
- Attestations: `uv publish` **uploads** files named `dist/<artifact>.publish.attestation` and
  **creates none**. If provenance is wanted, a step must generate them first; say that plainly
  instead of implying the upload produces them.

## Not yet published projects

A Trusted Publisher lives on the project's publishing settings page, which does not exist until
the project does. On a 404: check the name is free and warn about typosquatting-adjacent names;
do the **first release manually** from the maintainer's machine (`uv build --no-sources`, then
`uv publish` with an API token the maintainer creates and deletes right after); then run the
full Step 2 checklist, and every later release goes through tag -> CI -> publish with OIDC.

## Tell the user how to release now

```sh
# Bump the version (uv version --bump patch) and update CHANGELOG.md
git add .
git commit -m 'Release 1.0.1'
git tag v1.0.1   # `git tag -s` is better if signing keys are set up
git push origin v1.0.1
```

CI builds with `--no-sources`, publishes with the short-lived token, and the run is the record.
Suggest a patch release as an end-to-end test of the pipeline.

## What a rule enforces, and what nothing can

| Rule                        | Rejects                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `release-no-pypi-token`     | any PyPI credential in the workflow, or a `--token` on the command |
| `release-build-no-sources`  | `uv build` in a release workflow without `--no-sources`            |
| `release-actions-pinned`    | a `uses:` without a 40-hex SHA and a version comment               |
| `release-id-token-isolated` | `id-token` on a job that syncs, caches, or is not the only one     |

Two items stay with the user, because no rule can see a browser: the **Trusted Publisher is
configured with this workflow's filename**, and the **token is deleted and revoked**. One more
stays with you: uv cannot generate attestations, so provenance is a step you add, not a
property of `uv publish`.

## See also

- [rule-process-npm-release](../rule-process-npm-release/SKILL.md) - the same subject for an npm package
- [rule-mcp](../rule/SKILL.md) - central skill index and dispatcher
- [rule-process](../rule-process/SKILL.md) - process skill index
- [rule-platform-library](../rule-platform-library/SKILL.md) - package structure and public API design
