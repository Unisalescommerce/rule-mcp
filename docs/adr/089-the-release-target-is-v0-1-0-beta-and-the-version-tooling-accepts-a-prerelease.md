# 089: The release target is v0.1.0-beta, and the version tooling accepts a prerelease

- **Date**: 2026-09-15
- **Status**: superseded
- **Tags**: release, versioning, changelog, workflow
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

> Superseded by [ADR 125](125-first-release-is-v0-1-0-then-semver-from-commits.md) on the
> release target: the first published tag is `v0.1.0`, not `v0.1.0-beta`. The
> tooling still accepts a prerelease suffix when one is forced.

## Context

ADR 077 reset version to 0.1.0 and named v0.1.0 as first release. develop branch retargeted same release to v0.1.0-beta and taught release workflow to publish hyphenated tag as prerelease. Both are now in one tree, and manifests, changelog heading and release workflow have to agree on one answer. Two pieces of tooling assumed plain form: scripts/build/version/index.mjs validated --apply against /^\d+\.\d+\.\d+$/ and refused 0.1.0-beta, and changelog generator groups commits by git tag, so with no tag it writes only an [Unreleased] section and version gate finds no release heading to compare.

## Decision

version is 0.1.0-beta in package.json, server.json, both packaging manifests and newest CHANGELOG heading. release workflow marks tag containing hyphen as prerelease and plain tag as stable release. scripts/build/version/index.mjs accepts optional prerelease suffix in --apply. changelog section carries release name rather than [Unreleased], because version gate reads newest release heading and generator only writes one once tag exists.

## Consequences

ADR 077 is superseded on version it names; its reasoning about resetting away from v1.0.0 stands. Running `pnpm changelog` before tag exists rewrites heading back to [Unreleased], so release procedure is changelog first, then version --apply, then tag - order workflow already uses. future stable release needs no tooling change: plain tag validates and publishes as latest.

## What would end this

Publishing to registry that rejects prerelease identifiers, or decision to cut v0.1.0 directly without beta.

## Alternatives Considered

1. Keep 0.1.0 and drop prerelease workflow (rejected: beta is release project is cutting, and workflow change is three lines)
1. Leave changelog on [Unreleased] and relax version gate (rejected: gate is what catches manifest that drifted, and weakening it to fit one release costs more than naming section)
