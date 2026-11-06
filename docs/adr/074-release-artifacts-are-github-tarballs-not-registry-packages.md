# 074: Release artifacts are GitHub tarballs, not registry packages

- **Date**: 2026-09-10
- **Status**: accepted
- **Tags**: registry, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

OSS-11: release workflow publishes nothing but GitHub Release with changelog excerpt - no build job, no artifact, no checksum, no provenance. artifact project ships is GitHub tarball, which is unverified and unsigned. Interview decision D4 keeps distribution on git-clone plus installer.

## Decision

Release artifacts are signed GitHub Release tarballs, not registry packages: pipeline packs tarball, checksums it with SHA256SUMS, installs it from scratch to prove it, and attaches both files to GitHub Release.

## Consequences

release.yml grows build/verify/release jobs; tarball plus SHA256SUMS are shippable unit and documented verify path; npm distribution stays out of scope so OSS-4 remains documentation fix.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Publish to npm and ship registry tarball (rejected: distribution stays git-clone plus installer per D4; package name is unclaimed and publication is out of scope)
1. Keep changelog-only release (rejected: v1.0.0 release is excerpt with no verifiable artifact - OSS-11)
