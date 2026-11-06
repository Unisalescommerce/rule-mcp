# 245: The release asset is the source tree, built with pnpm, and a tag needs no signature

- **Date**: 2026-11-06
- **Status**: accepted
- **Supersedes**: [074]
- **Tags**: release, ci, packaging
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The release pipeline had never run. Its pnpm pack of packages/mcp held no bin, no skills and no lockfile, and depended on the private rule-mcp-shared, so npm install failed with a 404. The workflow also required a GPG-signed tag, and pnpm release makes an unsigned annotated tag. The owner decided that nothing goes to npm.

## Decision

scripts/package.sh writes the committed tree with git archive as rule-mcp-VERSION.tgz. The verify job extracts it, runs pnpm install --frozen-lockfile and pnpm docs:build, and runs the CLI. The release job needs no signing key, and .github/release-signing-key.asc is gone. pages.yml builds the site with pnpm and publishes it to GitHub Pages. The first release is pnpm release --version 0.1.0.

## Consequences

An install from a tarball needs Node.js and pnpm, the same as a clone, and rule-mcp update works only in a clone. The scoop and winget manifests stay unsupported, because their hash cannot match a tarball that contains them. RULE_MCP_UPDATE_REQUIRE_SIGNATURE stops updates on unsigned tags. Once a tag exists, CI fails on a stale changelog, and an entry holds the sha of its own commit, so a post-commit hook adds the entry in a second `chore(changelog): refresh` commit.

## What would end this

A package registry or a signed-provenance requirement appears.

## Alternatives Considered

1. Ship pnpm deploy output (rejected: 77 MB and one platform binary per asset)
1. Keep the tag signature (rejected by the owner: a release must work from any machine)
