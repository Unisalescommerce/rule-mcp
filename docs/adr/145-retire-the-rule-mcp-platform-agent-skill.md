# 145: Retire the rule-platform-agent skill

- **Date**: 2026-10-21
- **Status**: accepted
- **Tags**: skills, platform, removal, breaking, guardrails
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-platform-agent scaffolded AI-agent projects in framework-agnostic way: structure, tools, env config, testing, containerization. It sat under platform area and was reachable from platform router, dispatcher, rule-ai, rule-ai-agent-architecture and auth persona. owner decided on 2026-10-21 that catalog should not carry it: agent surface is already owned by rule-ai and rule-ai-agent-architecture, and scaffold guidance duplicated what those two say with different emphasis.

## Decision

Delete skills/rule-platform-agent and every live trace of it: two router rows, three dispatcher references, rule-ai table row and quick-selection line, cross-reference in rule-ai-agent-architecture, auth persona's evidence list, and plan index row. Regenerate census documents and snapshot. Keep historical records untouched: ADR 018 and CHANGELOG.md are history, and rewriting them would make record lie. Add src/core/skills/**tests**/_retired-skills.test.mjs as tombstone: retired id may have no directory, no link from any SKILL.md, persona or plan index, and no minted tool.

## Consequences

catalog drops from 84 to 83 skills, 105 to 104 tools and 176 to 174 resources, all enforced by docs-accuracy test. Plan index number 40 is retired and remaining numbers stay put, so every #NN reference in plans still points at same skill. retired id can no longer come back by accident: tombstone test fails on any reappearance, in catalog or in router.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Merge scaffold content into rule-ai-agent-architecture and delete id (rejected: content is part owner did not want, and merge would have kept it under new name)
1. Keep skill but unlist it from routers (rejected: unlisted skill is exactly orphan rule-platform-auth proved is invisible, and tests would have to be told to ignore it)
1. Deprecate with stub that points at rule-ai (rejected: stub still mints tool and resource, and catalog pays for redirect it can express as link)
