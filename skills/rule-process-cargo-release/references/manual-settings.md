# Manual settings for a crates.io release

The half of the setup only the maintainer can perform. No rule can read a browser, so this is a
checklist: present it **before** changing any repo file, with resolved links and the exact
values, then wait for an explicit confirmation.

The workflow filename below (`publish.yaml`) is fixed: the file is created in Step 3, and the
user can enter the name now without waiting for it.

## On crates.io - for every published crate

> Open `https://crates.io/crates/<name>/settings/trusted-publishing` (you must be logged in as an
> owner of the crate).
>
> 1. Under **Add a new publisher** choose **GitHub** and enter:
>    - Repository owner: `<owner>`
>    - Repository name: `<repo>`
>    - Workflow filename: `publish.yaml`
>    - Environment: `release` (recommended: it is what allows a manual approval by a trusted
>      subset of maintainers)
> 2. Save. That workflow can now mint a 30-minute publish token for this crate, and nothing else
>    can.

If the crate is not published yet, this page does not exist: publish the first version with a
scoped API token first (see `First release` in the skill body), then come back here.

If the old setup used an API token, also:

> Delete the token at `https://crates.io/settings/tokens` and remove the `CARGO_REGISTRY_TOKEN`
> secret from `https://github.com/<owner>/<repo>/settings/secrets/actions`.

Tokens can be scoped; a token kept during the transition should be `publish-new` only, so a leak
cannot publish an update to an existing version.

## On github.com

**Protected environment.** The environment named in the publisher is what turns "CI published"
into "a maintainer approved":

> Open `https://github.com/<owner>/<repo>/settings/environments` and create `release`, then add
> **Required reviewers** and restrict **Deployment branches and tags** to the release tag pattern.

**2FA for everyone.** If the repository belongs to an organization:

> Open `https://github.com/organizations/<org>/settings/security` and enable **Require two-factor authentication** under Authentication security.

**Tag ruleset** - with CI publishing, whoever can push a `v*` tag can trigger a release:

> Open `https://github.com/<owner>/<repo>/settings/rules/new?target=tag` and create a ruleset that
> restricts tag creation to admins, with `Repository admins` in the bypass list.

**Notifications.** crates.io sends an email when a crate is published; tell the user to keep that
address active, because it is the only out-of-band signal that a publish happened.

## After the user confirms

Verify what can be verified without a browser - `cargo search <name>` for the crate,
`gh api repos/<owner>/<repo>/environments` for the environment when `gh` is authenticated - and
re-ask about anything still unset. Only then start the repo changes.
