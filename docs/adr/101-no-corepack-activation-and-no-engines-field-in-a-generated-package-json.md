# 101: No corepack activation and no engines field in a generated package.json

- **Date**: 2026-09-20
- **Status**: accepted
- **Tags**: guardrails, pnpm, corepack, manifest, gateway, toolchain
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Language models write deployment boilerplate into generated manifests: `packageManager`, `engines`, `devEngines.packageManager`. The first and third activate corepack, which then gets a vote on whether the install runs - it downloads a package manager on a machine that is offline, verifies a signature from behind a proxy that rewrites it, and shadows the package manager already on PATH. `engines` reaches the same veto another way: npm, pnpm and yarn warn or refuse when the running Node falls outside the declared range. The rule that forbade the corepack fields said `engines` was fine because it asserts a version and fetches nothing, which is true about the fetch and beside the point about the veto.

## Decision

rule-mcp does not support either field. Two guardrails own it: `pkg-no-corepack` for `packageManager` and `devEngines.packageManager`, `pkg-no-engines` for `engines`. path-bound write path strips them from generated manifest before it checks, so guardrail runs on what would be written, receipt binds cleaned content, and reply carries it back for caller to apply. repository drops `engines` from its own package.json: Node floor lives in `.nvmrc`, in installers (`NODE_MIN=20`) and in CI, where person reads it and nothing acts on it during install.

## Consequences

rule-mcp's own package.json no longer declares `engines`, so consumers no longer get npm's version warning; Node floor is enforced by installers (`NODE_MIN=20`) and stated where person reads it. model that writes fields through path-bound gateway flow gets receipt for cleaned manifest and must apply what reply returns; original content is refused by hash. bare `code` string carries no path and so is neither checked nor cleaned, which is why manifest is written through `files`.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep `engines` legal (assert version, fetch nothing) and ban only corepack fields.
1. Let guardrail report and leave fix to model: two round trips and model that can still ship field if it ignores failure.
1. Strip fields in rule_tool_apply only: receipt would bind content that was never checked, so check and write would describe different files.
