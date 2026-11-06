# 125: First release is v0.1.0, then SemVer from commits

- **Date**: 2026-10-01
- **Status**: accepted
- **Tags**: release, versioning, semver
- **Author**: Emiliano Pisu <emiliano.pisu@pixu1980.com>

## Context

Manifests said `0.2.0-rc` and ADR 089 named `v0.1.0-beta`, but no release
tag ever shipped. Deriving next version from whole untagged history
jumps to `1.0.0` because of accumulated `feat` and breaking commits. owner
wants first published tag to be `v0.1.0`, then ordinary Semantic Versioning
from that tag onward. Manifests are parked on `0.1.0-beta` until that cut.

## Decision

1. first cut is forced: `pnpm release --version 0.1.0` (and matching
   tag `v0.1.0`). empty `0.2.0-rc` changelog heading is removed; historical
   `0.1.0-beta` entries stay as history only.
2. `scripts/release` accepts `--version <x.y.z[-prerelease]>` so plan can
   override derived bump once. Without flag, version stays a
   function of the commits since the newest tag (ADR 119 / ADR 122).
3. After `v0.1.0` exists, every later release is derived: `fix` -> patch,
   `feat` -> minor, `!` / `BREAKING CHANGE` -> major.
4. ADR 089 is superseded on release target it named.

## Consequences

`rule_tool_update` follows release tags; first tag clients can land on is
`v0.1.0`. Forcing version is explicit escape hatch for first cut, not
default path.

## What would end this

Shipping different first tag, or moving releases to pipeline that never
accepts override.
