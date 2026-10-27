# 193: Setup --scope project records projects.json and wires install writers

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: installer, setup, projects
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Slice A (ADR 192) added project host writers and hosts[].written but left CLI --scope / projects.json unwired. Installer-scope step 8 items 5–6 require flag-driven project installs that write only into chosen trees and a state store for refresh/uninstall walks.

## Decision

Add state/projects.json (record/forget/list). Expose setup --scope project, repeatable --project, --project-config, and --refresh-projects. Project plans call installProjectHost, merge written into the install manifest, and skip global shim/skills/service. Uninstall prepends a walk of projects.json. Wizard Scope UI and project add/remove stay deferred.

## Consequences

Positive: flag path installs into projects, refresh and uninstall reverse them, shared installs stay stdio-only. Negative: interactive wizard still cannot choose project scope; Claude project extras and numbering git hooks remain open.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Reuse only hosts[].written without projects.json (rejected: refresh/uninstall need project roots and projectConfig, not just paths)
1. Ship wizard Scope UI in the same slice (rejected: plan separates flag path from UI; keep slice small)
