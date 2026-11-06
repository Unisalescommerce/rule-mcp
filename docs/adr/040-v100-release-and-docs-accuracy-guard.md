# 040: v1.0.0 release and the docs-accuracy guard

- **Date**: 2026-08-25
- **Status**: accepted
- **Tags**: release, docs, accuracy, testing
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

README and docs advertised tool/resource/prompt/skill surface (99/146/24/89) that had silently drifted: after architect split real surface is 90/168/21/80. Nothing verified claims, only `docs-scan` checked that referenced tool _names_ still exist. repository had also never cut release: version stayed 1.0.0, everything lived under `[Unreleased]`.

## Decision

1. Add `test/docs-accuracy.test.mjs`: it computes runtime surface (`listTools`/`listResources`/`listPrompts` + `skills/` dirs) and fails when README.md disagrees. Counts become tested contract, not prose.
2. Cut **v1.0.0**: promote `[Unreleased]` history into dated `[1.0.0]` section, keep `[Unreleased]` for future work, and add `.github/workflows/release.yml` that publishes GitHub Release from changelog entry whenever `v*` tag is pushed. No npm publish in this milestone (package is consumed from repo; publishing can be follow-up ADR).

## Consequences

**Positive**: stale-claim regressions are structurally impossible; repo has reproducible release flow (tag -> changelog-based GitHub Release); status section in README doubles as health snapshot.
**Negative**: npm distribution is still pending; accuracy test adds small runtime cost to suite.
