# 085: Add an Open Source Steward persona for governance, contributors and donors

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: personas, open-source, governance, catalog
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The review catalog covers every engineering axis except the one that keeps an open source project alive: governance, contributor onboarding, donor and funding management, release cadence and community building. Requests about those topics were routed to unrelated personas (docs, security, devops) whose lenses do not cover them. The old `.roo/commands/rule-mcp-*-oss.md` files already referenced `role=oss`, but no persona file existed, so the role was never loaded into the catalog and those commands fell back to a generic body.

## Decision

Add `personas/oss.md` as active persona named `Open Source Steward` with id `oss`. Its skills cover open source governance, contributor management, donor and funding management, release management, and community building and engagement. Its evidence skills point at process skills that already exist (`rule-process-adr`, `rule-process-changelog`, `rule-process-npm-release`). Because catalog is read from `personas/` folder at startup, role gains its MCP prompt, its slash commands (`rule-persona-oss-plan`, `rule-persona-oss-audit`, `rule-persona-oss-review`) and its tool surfaces with no code change.

## Consequences

free-text request about governance, contributors, donors or community now resolves to role that owns those lenses. persona is data, so editing file edits every surface. Stale `rule-mcp-*-oss.md` command files in `.roo/commands/` now have matching role and real body rather than fallback. catalog census (`docs/11-personas.md`) must be regenerated with `pnpm census`.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Extend docs persona with open source lenses
1. Fold open source governance into devops persona
1. Leave role proposed until full OSS skill ships
