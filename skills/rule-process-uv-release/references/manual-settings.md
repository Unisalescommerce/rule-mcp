# Manual settings for a PyPI release

The half of the setup only the maintainer can perform. No rule can read a browser, so this is
a checklist: present it **before** changing any repo file, with resolved links and the exact
values, then wait for an explicit confirmation.

The workflow filename below (`publish.yaml`) is fixed: the file is created in Step 3, and the
user can enter the name now without waiting for it.

## On pypi.org - for every published project

> Open `https://pypi.org/manage/project/<name>/settings/publishing/` (you must be logged in as
> an owner of the project).
>
> 1. Under **Add a new publisher** choose **GitHub** and enter:
>    - Owner: `<owner>`
>    - Repository name: `<repo>`
>    - Workflow name: `publish.yaml`
>    - Environment name: `release` (recommended: it is what allows a manual approval by a
>      trusted subset of maintainers)
> 2. Save. The workflow named above can now mint a short-lived token for this project, and
>    nothing else can.

If the old setup used a PyPI API token, also:

> Delete the token at `https://pypi.org/manage/account/token/` and remove the
> `UV_PUBLISH_TOKEN` / `TWINE_PASSWORD` / `PYPI_API_TOKEN` secret from
> `https://github.com/<owner>/<repo>/settings/secrets/actions`.

PyPI no longer accepts username and password for uploads, which is why a token - or a publisher -
is the only choice; warn the user before revoking a token another pipeline still uses.

## On github.com

**Protected environment.** The environment named in the publisher is what turns "CI published"
into "a maintainer approved". Set it up before the first run:

> Open `https://github.com/<owner>/<repo>/settings/environments` and create `release`, then add
> **Required reviewers** (yourself or a maintainer group) and restrict **Deployment branches and
> tags** to the tag pattern the release uses.

**2FA for everyone.** If the repository belongs to an organization:

> Open `https://github.com/organizations/<org>/settings/security` and enable **Require two-factor authentication** under Authentication security.

**Tag ruleset** - with CI publishing, whoever can push a `v*` tag can trigger a release:

> Open `https://github.com/<owner>/<repo>/settings/rules/new?target=tag` and create a ruleset that
> restricts tag creation to admins, with `Repository admins` in the bypass list.

**Immutable releases** - once a release is published, its assets can never be swapped:

> Open `https://github.com/<owner>/<repo>/settings`, and in the **Releases** section enable
> **Immutable releases**.

## After the user confirms

Verify what can be verified without a browser - `curl -s https://pypi.org/pypi/<name>/json` for
the project, `gh api repos/<owner>/<repo>/environments` for the environment when `gh` is
authenticated - and re-ask about anything still unset. Only then start the repo changes.
