# Pending: Derive the tokensave switch from the project and accept on+autotrack as its name

- **Date**: 2026-10-28
- **Status**: proposed
- **Tags**: installer, feature, tokensave, agents
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The feature catalog carried three tokensave levels already, but the switch answered two questions it could not answer. The third level was named `autotrack` while the rest of the surface reads `on`, so a user asking for `on+autotrack` was refused. And the default was a constant: DEFAULT_OPTOUT_ENV wrote RULE_MCP_NO_TOKENSAVE=0 into every generated config, so every project claimed an integration whose inputs - a code graph - it might not have. Whether tokensave awareness has anything to read is a property of the project, not of the user, and env.json is per user while .tokensave/ is per checkout.

## Decision

Keep one canonical level list (on, autotrack, off) and treat `on+autotrack` as an input alias resolved by canonicalLevel(), so levelsFor() lists a level once and envPatchFor() stays the only source of the env patch. With no choice recorded, readLevel('tokensave') falls back to hasTokensave(projectDir ?? process.cwd()): on when the checkout has .tokensave/, off when it does not. A project-scope install writes that derived value into the project's own server config through tokensaveProjectEnv(projectRoot), because that entry belongs to one project; the user-level env.json no longer carries a tokensave default. An explicit off or autotrack in env.json outranks the guess, and a recorded 0 does not count as a decision: every earlier install wrote it, so it cannot be distinguished from a choice.

## Consequences

Positive: the switch states what the project can use instead of claiming an integration with nothing to read; one name resolves to one level, so the written patch and the reported level cannot disagree; no new command, flag or subsystem. Negative: an explicit `on` leaves no trace in env.json (envPatchFor removes the key), so a project without a graph overrides it - closing that needs a sentinel value or treating the absent key as a choice; the derived default is decided at install time for project configs and at read time elsewhere, so the two can disagree until the next install.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Rename the canonical level to `on+autotrack`: breaks `--level autotrack` in existing scripts and docs for a cosmetic gain.
1. Keep the constant default and document that a graphless project should turn it off by hand: leaves every install claiming an integration it cannot use.
1. Resolve the default only at runtime from process.cwd(), never at install: one rule, but the written project config would stop describing what the server does.
