# 169: Surface is the only tier picker; slash commands follow it

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, tui, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

OpenTUI installer still asked Surface and Commands as two screens with same three tiers (minimal, standard, full, custom). ADR 168 already said installer should have one vocabulary instead of two, but wizard kept both pickers. Users saw Surface then Commands on rail and had to answer same question twice.

## Decision

Drop Commands step from install rail. Surface step sets both tool surface and slash-command selection: preset maps to same command preset, and custom area/skill pick becomes command selection of those areas or skills with areas+personas+tasks families. commands dimension of profile still decides whether files are written; Surface only decides which ones.

## Consequences

rail is Preflight, Profile, Agents, Transport, Surface, Review, Install, Done. Flag-driven installs that pass --commands/--surface separately still work. Custom surface drill-down still has areas then skills, and that answer drives both server env and command files.

## What would end this

need to pick tools and slash commands on different tiers would bring the
Commands screen back; until then one picker is enough.

## Alternatives Considered

1. Keep both screens with shared defaults (still two questions for one tier)
1. Fold commands into profile only and remove Surface (loses custom areas/skills path)
