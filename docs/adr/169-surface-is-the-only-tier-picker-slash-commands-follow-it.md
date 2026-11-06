# 169: Surface is the only tier picker; slash commands follow it

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, tui, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The OpenTUI installer still asked Surface and Commands as two screens with the same three tiers (minimal, standard, full, custom). ADR 168 already said the installer should have one vocabulary instead of two, but the wizard kept both pickers. Users saw Surface then Commands on the rail and had to answer the same question twice.

## Decision

Drop the Commands step from the install rail. The Surface step sets both the tool surface and the slash-command selection: a preset maps to the same command preset, and a custom area/skill pick becomes the command selection of those areas or skills with the areas+personas+tasks families. The commands dimension of a profile still decides whether files are written; Surface only decides which ones.

## Consequences

The rail is Preflight, Profile, Agents, Transport, Surface, Review, Install, Done. Flag-driven installs that pass --commands/--surface separately still work. Custom surface drill-down still has areas then skills, and that answer drives both the server env and the command files.

## What would end this

A need to pick tools and slash commands on different tiers would bring the
Commands screen back; until then one picker is enough.

## Alternatives Considered

1. Keep both screens with shared defaults (still two questions for one tier)
1. Fold commands into the profile only and remove Surface (loses the custom areas/skills path)
