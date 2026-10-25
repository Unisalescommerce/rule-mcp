# The publish workflow

The file this skill creates, and the lint that keeps it honest. Adapt the Node version,
the build output path and the install commands to the project's package manager; keep
every action pinned to a commit SHA with the version in a trailing comment.

## `.github/workflows/publish.yaml`

```yaml
name: Release
on:
  push:
    tags:
      - "v*"
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Install Node.js
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: 26
          cache: npm
      - name: Install dependencies
        run: npm ci --ignore-scripts
      - name: Run tests
        run: npm test

  build: # Separate job so build-time dependencies can't publish
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Install Node.js
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: 26
          package-manager-cache: false # Slower, but no cache poisoning risk
      - name: Install dependencies
        run: npm ci --ignore-scripts
        # For a monorepo with build tools in root `dependencies`:
        # run: npm ci --omit=dev --ignore-scripts
      - name: Build package
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: build-artifacts
          path: dist/
          retention-days: 1

  publish: # The critical job: no dependencies installed at all
    runs-on: ubuntu-latest
    needs:
      - test
      - build
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Download build artifacts
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          name: build-artifacts
          path: dist/
      - name: Install Node.js
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version: 26
          package-manager-cache: false
      - name: Publish npm package
        run: npm stage publish --ignore-scripts
```

If an old workflow used `secrets.NPM_TOKEN`, remove it from the YAML now - deleting the
secret and revoking the token is already covered by the manual settings checklist.

If there is no build script, drop the build job and the artifact steps entirely (best
case - see [Nano ID's workflow](https://github.com/nanostores/nanostores/blob/main/.github/workflows/release.yml)).

**Use `npm` for the publish command even when the project uses pnpm, yarn, or bun.** The
only exception is a project that genuinely needs its own package manager's staged-publish
command (e.g. `workspace:` or `beforePacking`); there, use that tool's command instead.

## Run zizmor locally and fix every finding

```bash
docker run --rm -t -v "$(pwd):/repo:ro" ghcr.io/zizmorcore/zizmor:latest /repo/.github/workflows
```

Run it yourself if Docker is available; otherwise ask the user to run this command and
paste the output. Fix everything it reports in the existing workflows
(`pull_request_target` misuse, shell injection, unpinned actions), then re-run until
clean. Remind the user to **delete stale branches** that still contain old vulnerable
workflows - attackers exploit old branches (that's how Nx was hit).

## `.github/workflows/check-workflows.yaml` - keep linting on CI

```yaml
name: Lint CI workflows
on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["**"]
jobs:
  zizmor:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Run zizmor
        uses: zizmorcore/zizmor-action@6599ee8b7a49aef6a770f63d261d214911a7ce02 # v0.6.0
        with:
          advanced-security: false
```

## Dependency cooldown

Apply the cooldown the user already chose in the batched questions - the fast (1 day) or
the more secure (3 days). If it wasn't settled, use this fact to decide:

> A 3-day delay before adopting new dependency versions blocks ~94% of malicious releases (median takedown is 14 hours).

Apply the one matching the project's package manager:

```bash
npm config set --location=project min-release-age 3
pnpm config set --location=project minimumReleaseAge 4320
yarn config set npmMinimalAgeGate 3d
```

For bun, add to `bunfig.toml`:

```toml
[install]
minimumReleaseAge = 259200
```

**pnpm 11+ already turns cooldown on** - `minimumReleaseAge` defaults to `1440` (1 day). So
on pnpm 11 you're only _raising_ it to 3 days (`4320`).

## Monorepo specifics

- **npm settings are per package.** Every public workspace package needs its own Trusted
  Publisher entry pointing at the same repo and the same `publish.yaml`. Emit one settings
  link per package; missing one leaves that package unprotected.
- One workflow can release everything: `npm stage publish --ignore-scripts --workspaces`, or
  `--workspace=<name>` per package if versions are tagged independently (adjust the tag
  trigger to the repo's scheme, e.g. `<name>@*`).
- **Publish with `npm`, unless the package relies on a pnpm-only feature** - the `workspace:`
  protocol, or a `beforePacking` hook in `.pnpmfile.cjs`. Then publish with
  `pnpm stage publish`, drop `actions/setup-node` from the publish job and let pnpm provide
  Node (`use-node-version` in `pnpm-workspace.yaml`). Check first that the pnpm version
  supports staged publishing; if not, say the tradeoff rather than silently downgrading.
- **The `--omit=dev` hack.** Keep build tools in the root `dependencies` and test/lint tools
  in `devDependencies`, then install in the build job with `npm ci --omit=dev
--ignore-scripts`. Moving packages between the two changes the published metadata, so it is
  one of the questions asked up front.

## Make sure `postinstall` scripts are disabled locally

Dependency `postinstall`/`preinstall` scripts run arbitrary code on every developer
machine. npm 12, pnpm 10, yarn 4.14, and bun disable them by default - check the version
actually in use (`packageManager` field, `npm --version` etc.):

- Version is new enough -> nothing to add, just confirm.
- Older -> add an explicit config:

  ```bash
  npm config set --location=project ignore-scripts true
  yarn config set enableScripts false
  ```

  Warn with npm's `ignore-scripts=true`: it also skips the project's own lifecycle scripts
  (`prepare`, husky hooks) - check nothing depends on them.

If some dependency genuinely needs its build script, allowlist that one package instead of
re-enabling everything.
