# Manual settings for an npm release

The half of the setup only the maintainer can perform. Nothing in the repository can
check it, so it is a checklist and not a rule: present it **before** changing any repo
file, with resolved links (`https://www.npmjs.com/package/<name>/access`, not "go to your
package settings") and the exact values, then wait for an explicit confirmation.

The workflow filename below (`publish.yaml`) is fixed: the file is created in Step 3, and
the user can enter the name now without waiting for it.

## On npmjs.com - for every public package

Repeat this block per package in a monorepo, each with its own link:

> Open `https://www.npmjs.com/package/<name>/access` (you must be logged in as a maintainer).
>
> 1. In **Trusted Publisher** select **GitHub Actions** and enter:
>    - Organization or user: `<owner>`
>    - Repository: `<repo>`
>    - Workflow filename: `publish.yaml`
>    - Environment: leave empty
>    - Enable only **Allow npm stage publish** - deny plain `npm publish`, so even hacked CI can't release without your approval.
> 2. In **Publishing access** select **Require two-factor authentication and disallow tokens**. This revokes all existing tokens - warn me first if any other automation publishes this package with a token.

If the old setup used an `NPM_TOKEN` secret, also:

> Delete the `NPM_TOKEN` secret at `https://github.com/<owner>/<repo>/settings/secrets/actions` and revoke the token itself at <https://www.npmjs.com/settings/~/tokens>.

## On github.com

**2FA for everyone.** If the repo belongs to an organization:

> Open `https://github.com/organizations/<org>/settings/security` and enable **Require two-factor authentication** under Authentication security.

For a personal account, ask the user to confirm 2FA is on at <https://github.com/settings/security> - prefer a hardware key or passkey.

**Tag ruleset** - with CI publishing, whoever can push a `v*` tag can trigger a release, so restrict tag creation:

> Open `https://github.com/<owner>/<repo>/settings/rules/new?target=tag` and create:
>
> - Ruleset Name: `Tags only by admins`
> - Enforcement status: `Active`
> - Bypass list: add `Repository admins`
> - Target tags: `Include all tags`
> - Tag rules: enable **Restrict creations**

**Immutable releases** - once a release is published, its tag and assets can never be changed or deleted, so an attacker can't silently swap artifacts under an existing version:

> Open `https://github.com/<owner>/<repo>/settings` and in the **Releases** section enable **Immutable releases**.

## After the user confirms

Verify what can be verified without a browser - `npm view <name>` for the package, `gh api
repos/<owner>/<repo>/rulesets` when `gh` is authenticated - and re-ask about anything still
unset. Only then start the repo changes.
