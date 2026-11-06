# 077: Reset the project version to 0.1.0, first release will be v0.1.0

- **Date**: 2026-09-10
- **Status**: superseded
- **Tags**: release, versioning
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

> Superseded by [ADR 089](089-the-release-target-is-v0-1-0-beta-and-the-version-tooling-accepts-a-prerelease.md) on the version it names: the first release is v0.1.0-beta.

## Context

tree says 1.0.0 everywhere and carries tag v1.0.0, but no shippable artifact ever shipped under it (OSS-11) and project is pre-1.0 in maturity. owner decided published version will be v0.1.0: reset repo now and wait for first real 0.1.0 release out of Step 6 pipeline.

## Decision

Reset project version to 0.1.0 in package.json, server.json (both version fields), CHANGELOG release heading and scoop/winget manifests with recomputed hashes. Delete tag v1.0.0 locally and on remote. first publish - npm or registry - will be v0.1.0.

## Consequences

package.json, server.json, CHANGELOG and distribution manifests go back to 0.1.0 with recomputed hashes; tag v1.0.0 is deleted locally and remotely; Step 26 placeholder question is settled (publish v0.1.0, no placeholder); dangling GitHub Release v1.0.0 page needs owner deletion in UI.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep 1.0.0 and publish v1.0.1 and later (rejected: 1.0.0 implies stability project has not earned, and no artifact ever shipped under it)
1. Publish 0.0.0 placeholder now (rejected: owner decision is v0.1.0 for first publish)
