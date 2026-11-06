# 221: Derive the tokensave switch from the project and accept on+autotrack as its name

- **Date**: 2026-10-28
- **Status**: proposed
- **Tags**: installer, feature, tokensave, agents
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

feature catalog carried three tokensave levels already, but switch answered two questions it could not answer. third level was named `autotrack` while rest of surface reads `on`, so user asking for `on+autotrack` was refused. And default was constant: DEFAULT_OPTOUT_ENV wrote RULE_MCP_NO_TOKENSAVE=0 into every generated config, so every project claimed integration whose inputs - code graph - it might not have. Whether tokensave awareness has anything to read is property of project, not of user, and env.json is per user while.tokensave/ is per checkout.

## Decision

Keep one canonical level list (on, autotrack, off) and treat `on+autotrack` as input alias resolved by canonicalLevel(), so levelsFor() lists level once and envPatchFor() stays only source of env patch. With no choice recorded, readLevel('tokensave') falls back to hasTokensave(projectDir?? process.cwd()): on when checkout has.tokensave/, off when it does not. project-scope install writes that derived value into project's own server config through tokensaveProjectEnv(projectRoot), because that entry belongs to one project; user-level env.json no longer carries tokensave default. Every recorded level outranks guess, so each one writes value: off writes 1, autotrack writes 1 under its own key, and on writes `0` instead of removing key, because only value can be told apart from never choosing. user-level file that is exactly constant table earlier version wrote carries no decision, so setup path drops that one key once (pruneHistoricalTokensaveDefault) and project decides from then on; file user edited, or chosen 1, is left untouched.

## Consequences

Positive: the switch states what the project can use instead of claiming an integration with nothing to read; one name resolves to one level, so the written patch and the reported level cannot disagree; `on` is a decision that survives a project without a graph, and the generated config states the same thing the runtime does; no new command, flag or environment key. Negative: the meaning of `0` changed, so a file written by an earlier install has to be pruned once before the derived default can apply, and an install that never runs leaves it pinned on; the derived default is decided at install time for project configs and at read time elsewhere, so the two can disagree until the next install.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Rename canonical level to `on+autotrack`: breaks `--level autotrack` in existing scripts and docs for cosmetic gain.
1. Keep constant default and document that graphless project should turn it off by hand: leaves every install claiming integration it cannot use.
1. Resolve default only at runtime from process.cwd(), never at install: one rule, but written project config would stop describing what server does.
