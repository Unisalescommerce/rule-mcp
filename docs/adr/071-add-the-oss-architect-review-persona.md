# 071: Add the OSS Architect review persona

- **Date**: 2026-09-10
- **Status**: superseded
- **Tags**: persona, oss, open-source, governance, licensing, community
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

> Superseded by [ADR 085](085-add-an-open-source-steward-persona-for-governance-contributors-and-donors.md). The develop branch added its own OSS persona, Open Source Steward, and that is the one the merge kept.

## Context

persona catalog is filesystem-driven (src/roles/*.md): adding persona is adding one file with frontmatter and lenses list in body; server loads it at startup and generates plan/audit/review prompts, slash commands, and census rows. interview with developer defined persona: id oss, title OSS Architect, 25 years of experience, layer process, status active, standalone; lenses covering licensing (SPDX conformance, stack compatibility, dual licensing, headers), governance (decision model, documented process, maintainer roles, independence), contributing (guides and triage, CI gates, CLA/DCO, review process), funding (platforms, transparency, sustainability, alternatives), plus security disclosure, release process, community health, and contributor onboarding; deliverables mix checklists, gap analysis, prioritized roadmap, and maturity score.

## Decision

Add OSS Architect persona (id: oss) as src/roles/oss.md, status active, layer process, 25 years, 12 lenses focused on project itself (own license, governance, contributing, funding, disclosure, release, community health). Standard schema: no code change; registry tests and census updated to new counts (76 prompts, 57 persona prompts, 77 commands).

## Consequences

Positive: the persona is drop-in (one file in src/roles/, no code change): it generates three persona prompts (rule-persona-oss-plan, rule-persona-oss-audit, rule-persona-oss-review) and three slash commands; docs/13-personas.md and the census blocks are regenerated; README now advertises 76 prompts. The licensing lens stays on the project's own license axis (SPDX, dual license, open core) without overlapping supply-chain's dependency axis. Negative: the counts change (73 to 76 prompts, 74 to 77 commands) and the two hardcoded arrays in the registry tests were updated; the persona carries 12 lenses (tied with devops, the current maximum), so the axis should be re-checked if the content grows.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Extend supply-chain (dependency licensing): rejected. supply-chain axis is dependency chain; OSS persona looks at project itself (its own license, governance, community, funding)
1. Extend devx (contributing/onboarding): rejected. Contributing is one lens, not axis; OSS Architect is project and ecosystem perspective
1. Add persona as proposed (no prompts generated): rejected. interview asked for active, with three plan/audit/review operations
