# 099: The design-system persona becomes the UI/UX lead

- **Date**: 2026-09-18
- **Status**: accepted
- **Tags**: personas, ui, review
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`design-system` persona owned design tokens, semantic HTML and component API design, but nothing owned wider UI/UX surface: interaction patterns, motion, visual hierarchy, cross-framework parity and accessibility baseline. Those concerns sat unassigned while persona's five lenses covered only part of them.

## Decision

Rename role id `design-system` to `ui` and its title to UI/UX Lead. Widen its lenses from five to ten - user goals, accessibility as baseline, semantics/tokens/styling order, component API durability, flex-first layout, purposeful motion, visual hierarchy, consistency via tokens, cross-framework parity, and industry standards as floor. Expand evidence skills to include `rule-ui`, `rule-styleguide-a11y` and every frontend framework skill.

## Consequences

active role set stays at 19; only id and title change. three commands per role become `/rule-persona-ui-plan`, `/rule-persona-ui-audit` and `/rule-persona-ui-review`. Evidence skills grow from four to thirteen, so persona reaches every frontend skill and a11y styleguide. Aliases, persona catalog in `personas/`, registry test and `docs/13-personas.md` follow. Any citation of old `design-system` id is stale.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Add new `ui` role and keep `design-system` alongside it
1. Widen `design-system` lenses without renaming role
