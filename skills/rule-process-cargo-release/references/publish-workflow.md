# Publishing workflow for a Rust crate

The file this skill creates, adapted to the workspace layout and the MSRV. Every action stays
pinned to a commit SHA with the version in a trailing comment.

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
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
        with:
          persist-credentials: false
      - name: Install the toolchain
        uses: dtolnay/rust-toolchain@<sha> # stable
      # The dry run is the review before the point of no return: it runs the
      # first three publish steps and leaves the archive in target/package.
      - name: Verify the crate
        run: cargo publish --dry-run --locked
      - name: Show what will be packed
        run: cargo package --list
      # crates.io refuses a .crate over 10 MB, and says so after the upload starts.
      - name: Check the archive size
        run: test "$(stat -c %s target/package/*.crate)" -lt 10485760
      - name: Upload the crate
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: crate
          path: target/package/
          retention-days: 1

  publish:
    runs-on: ubuntu-latest
    needs: verify
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
      - name: Download the crate
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          name: crate
          path: target/package/
      # The action exchanges the OIDC token for a 30-minute credential and
      # revokes it in its post step, whatever the outcome.
      - name: Authenticate with crates.io
        id: auth
        uses: rust-lang/crates-io-auth-action@<sha> # v1
      - name: Publish
        run: cargo publish --locked
        env:
          # On this step and nowhere else.
          CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}
```

The publish job installs no toolchain and restores no cache: `cargo publish` verifies the
archive it was given, and every extra step in that job inherits the ability to mint a token.

## A workspace with several crates

One job per crate, or one job that publishes in order, but **one token exchange per job**: the
credential expires after 30 minutes, so a sequence that publishes ten crates can outlive a token
minted once at the top. `cargo publish -p <name> --locked` publishes one member; a workspace
release usually needs a loop with a wait, because a crate cannot be published before its own
dependencies are on the index.

`cargo package --list` per member is the review that catches the other common failure: a crate
that packs test fixtures, a `target/` remnant or a 12 MB asset directory.

## What the token can and cannot do

- It is minted for one job and one crate set; the crates.io publisher records which workflow
  filename may ask for it, so renaming the workflow without updating the publisher breaks the
  next release - loudly, which is the point.
- It expires in 30 minutes and the action revokes it early. A stolen token is worth very little;
  a `secrets.CARGO_REGISTRY_TOKEN` is worth a crate takeover for as long as nobody rotates it.
- `cargo yank --version <v>` is the recovery tool after a bad publish, and it deletes nothing.

## Verify locally before the tag

```bash
cargo publish --dry-run --locked
cargo package --list
```

The second command is the one people skip, and it is the one that shows the 11 MB of fixtures
nobody meant to ship.
