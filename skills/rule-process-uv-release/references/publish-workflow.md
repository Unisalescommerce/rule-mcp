# Publishing workflow for a uv project

The file this skill creates, adapted to the project's Python version, package layout and
test command. Every action stays pinned to a commit SHA with the version in a trailing
comment.

## `.github/workflows/publish.yaml`

```yaml
name: Release
on:
  push:
    tags:
      - "v*"
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Install uv
        uses: astral-sh/setup-uv@<sha> # v6
      - name: Install dependencies
        run: uv sync --locked
      - name: Run tests
        run: uv run --frozen pytest

  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Install uv
        uses: astral-sh/setup-uv@<sha> # v6
      # --no-sources is the documented publish recommendation: the package must
      # build the way pip and build will build it, without tool.uv.sources.
      - name: Build sdist and wheel
        run: uv build --no-sources
      - name: Upload the artifacts
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: dist
          path: dist/
          retention-days: 1

  publish:
    runs-on: ubuntu-latest
    needs: [test, build]
    # A protected environment is what makes the approval mandatory.
    environment: release
    permissions:
      contents: read
      id-token: write # the OIDC exchange Trusted Publishing needs
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Download the artifacts
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          name: dist
          path: dist/
      - name: Install uv
        uses: astral-sh/setup-uv@<sha> # v6
      # No token: uv exchanges the OIDC identity for a short-lived credential
      # and revokes it after the upload, even when the upload fails.
      - name: Publish to PyPI
        run: uv publish
```

The publish job installs no dependencies and restores no cache: anything that runs there can
ask for a publish token too.

## Attestations

`uv publish` uploads an attestation when a file named `<artifact>.publish.attestation` sits
beside the artifact in `dist/`, and it **does not create one**. A workflow that wants
provenance needs a step that produces those files before the upload. If the index rejects them
(not every index supports PEP 740), `--no-attestations` turns the upload off - say which of the
two the project chose instead of implying `uv publish` produces provenance by itself.

## Publishing to another index

For a registry that is not PyPI, add the index to `pyproject.toml` and publish by name:

```toml
[[tool.uv.index]]
name = "internal"
url = "https://example.test/simple/"
publish-url = "https://example.test/legacy/"
explicit = true
```

```bash
uv publish --index internal --check-url https://example.test/simple/
```

`uv publish --index <name>` reads `pyproject.toml`, so the publish job keeps its checkout step.
`--check-url` skips files the registry already has and handles raced parallel uploads.

## Dependency cooldown

uv spells the cooldown `--exclude-newer`, or `exclude-newer` under `[tool.uv]`, with
`UV_EXCLUDE_NEWER` in the environment:

```toml
[tool.uv]
exclude-newer = "3 days"
```

Verified against `uv 0.13.5` (`uv sync --help` carries `--exclude-newer` and
`--exclude-newer-package`). **No area skill owns this rule yet** - the npm plan hands its
equivalent to `rule-toolchain-pnpm`, and the Python spelling has no owner at all.

## Verify the release locally before the tag

```bash
uv build --no-sources
uv run --with dist/*.whl --no-project -- python -c "import <package>"
```

The second command installs what the registry received, not the working tree.
