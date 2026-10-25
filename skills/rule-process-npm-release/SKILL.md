---
name: rule-process-npm-release
description: "Set up a secure release process for an npm package to protect it from supply chain attacks. Use for any request to create and publish a new npm package, secure npm publishing or releasing, set up npm Trusted Publishing, provenance, or Staged Publishing, harden a release workflow."
tags:
  - "security"
  - "npm"
  - "supply-chain"
  - "ci-cd"
frameworks: [npm, github-actions]
guardrails:
  [
    release-no-npm-token,
    release-stage-publish,
    release-actions-pinned,
    release-id-token-isolated,
    release-tag-trigger,
    release-ignore-scripts,
    release-no-persist-credentials,
    release-least-privilege,
  ]
---

# Release an npm package securely

The outcome: no npm token exists to steal, releases can come only from one CI workflow, and
every release still needs a manual approval with the maintainer's 2FA key. Three moves do it -
a Trusted Publisher on npmjs.com, a workflow whose publish job holds no dependencies, and
staged publishing so the tarball exists before the version does.

## How to run this skill

Half of the setup is repository files; the other half is settings on npmjs.com and github.com
that **only the user can change**. The settings are the part that needs the user, and if you do
the repo changes first the instructions scroll past and get missed - so the user acts before you
do. For the settings, produce click-by-click instructions with **direct links resolved from the
repo's real data** (package names from `package.json`, owner/repo from the `repository` field)
and the exact values to enter. Never say "go to your package settings".

The order is strict - **questions, then manual settings, then CLI and files**:

1. **Gather facts** (Step 1), read-only and silent, to learn the project's shape.
2. **Ask all questions together**, in one message, and wait for the answers.
3. **Hand off the manual settings** (Step 2) and ask the user to make every change.
4. **Wait for the user to confirm** they have changed everything - do not run any
   repo-changing command or touch any files until they say so.
5. **Run the CLI and change files** (Step 3).

The only commands allowed before the user answers and confirms are the read-only
fact-gathering ones in Step 1. Every mutating command - `npm config set`, writing workflow
files, editing `package.json` - waits for Step 3.

## Step 1: Gather facts

Read-only and silent.

- **Packages.** Root `package.json`; with `workspaces` (or `pnpm-workspace.yaml`) enumerate
  every workspace, and keep only those without `"private": true`.
- **GitHub owner/repo** from the `repository` field (`git+https://github.com/owner/repo.git`,
  `github:owner/repo`, `owner/repo`), falling back to `git remote get-url origin`; ask if
  neither exists, then add the field.
- **Org or personal account**, because it changes the 2FA instructions.
- **Package manager and version** from `packageManager` and the lockfiles.
- **Published or not**: `npm view <name> version` per public package (E404 = not yet).
- **Tag format** from `git tag --sort=-creatordate | head`; default to `v1.0.0` only when
  there are no tags. Also: the `build` script and its output directory, and any existing
  release workflow or `secrets.NPM_TOKEN`.

## The questions to ask together

One message, then wait: the **cooldown length** (1 day, or 3 days which blocks ~94% of
malicious releases); whether **monorepo build tools** move into `dependencies` for the
`--omit=dev` install; the **`repository` field** if it is missing; anything else the project
raises. Do not drip questions out one at a time.

## Step 2: Manual settings (the user acts)

Everything the browser owns - Trusted Publisher with stage-only, publishing access with
tokens disallowed, the `NPM_TOKEN` deletion and revocation, 2FA, the tag ruleset, immutable
releases - is in [references/manual-settings.md](references/manual-settings.md). Present it as
a numbered checklist with resolved links and the exact values, then wait for an explicit
confirmation. Verify what you can afterwards (`npm view <name>`, `gh api
repos/<owner>/<repo>/rulesets`) and re-ask about anything still unset.

## Step 3: Repo changes (do these yourself)

**Do not start until the user confirms.** Ask before overwriting an existing release workflow;
carry over intentional extras (changelog generation, GitHub Releases) into separate jobs
without `id-token`.

The file is `.github/workflows/publish.yaml`, and its full text, the zizmor command, the CI
lint workflow, the dependency cooldown and the `postinstall` policy live in
[references/publish-workflow.md](references/publish-workflow.md). The rules that shape it:

- Trigger on version tags, matching the repo's existing tag format.
- The publish job installs no dependencies, uses no cache, and runs no third-party action
  beyond checkout, setup-node and download-artifact.
- Build in a **separate job** and pass output via artifacts. Only the publish job gets
  `id-token: write`; every job gets `contents: read` and `persist-credentials: false`.
- `--ignore-scripts` on every install and on publish.
- `npm stage publish`, not `npm publish` - CI stages, a human approves with 2FA.

Remove any `secrets.NPM_TOKEN` from the YAML now; the secret itself is already gone from the
Step 2 checklist.

## Not yet published packages

A Trusted Publisher lives on the package's settings page, which does not exist until the
package does. On an E404: check the name is free and warn about typosquatting-adjacent names;
do the **first release manually** from the maintainer's machine (`npm publish --ignore-scripts`,
`--access public` for a scoped package, interactive 2FA, no provenance badge); then run the
full Step 2 checklist against the new package, and every later release goes through
tag -> CI -> staged approval. In a monorepo some packages may already be published - split the
checklist accordingly.

## Monorepo specifics

Per-package Trusted Publishers, `--workspaces` versus `--workspace`, the pnpm-only publish
exception and the `--omit=dev` hack are in
[references/publish-workflow.md#monorepo](references/publish-workflow.md#monorepo-specifics).

## Tell the user how to release now

```sh
# Bump version in package.json and update CHANGELOG.md
git add .
git commit -m 'Release 1.0.1 version'
git tag v1.0.1   # `git tag -s` is better if signing keys are set up
git push origin v1.0.1
```

Use the repo's detected tag format. CI stages the release, and the user approves it in
**Staged Packages** (npm user menu) or with `npm stage approve` - the manual 2FA step hacked
CI cannot fake. Suggest a patch release as an end-to-end test of the pipeline.

## What a rule enforces, and what nothing can

Eight rules run on the workflow file, and they are the part of this checklist a machine can
refuse:

| Rule                             | Rejects                                                           |
| -------------------------------- | ----------------------------------------------------------------- |
| `release-no-npm-token`           | any npm credential in the workflow                                |
| `release-stage-publish`          | `npm publish` where `npm stage publish` is required               |
| `release-actions-pinned`         | a `uses:` without a 40-hex SHA and a version comment              |
| `release-id-token-isolated`      | `id-token` on a job that installs, caches, or is not the only one |
| `release-tag-trigger`            | a publishing workflow with no tag filter                          |
| `release-ignore-scripts`         | an install or publish without `--ignore-scripts`                  |
| `release-no-persist-credentials` | a checkout that keeps the job token                               |
| `release-least-privilege`        | a release job with a write permission beyond `id-token`           |

Two items stay with the user, because no rule can see a browser: **every public package has a
stage-only Trusted Publisher with tokens disallowed**, and **the token is deleted and revoked**.
A third stays with you: after the setup, run `npx @e18e/cli analyze` and offer to draft a plan
for the heaviest dependency branches ([replacements](https://e18e.dev/docs/replacements/)) -
later, not now.

## See also

- [rule-mcp](../rule/SKILL.md) - Central skill index and dispatcher
- [rule-process](../rule-process/SKILL.md) - Process skill index
- [rule-platform-library](../rule-platform-library/SKILL.md) - Package structure and public API design for the thing being published
- [rule-styleguide-git](../rule-styleguide-git/SKILL.md) - Conventional commits behind the changelog
- [rule-toolchain-pnpm](../rule-toolchain-pnpm/SKILL.md) - pnpm settings referenced by the cooldown step
- [rule-process-readme](../rule-process-readme/SKILL.md) - The README users land on after install
