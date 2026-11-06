# 183: Project-scope host table and manifest written paths

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: installer, hosts, manifest
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Global host paths live in _hosts.data.js and hostRecord. Project installs need separate table so they never invent home paths. Manifest v2 recorded level per host but deferred written[] until project-scope installs existed; uninstall of project files needs list of paths written.

## Decision

Add _project-hosts.data.js (shared/local project files + dialects) and _install-project.js (shared portable entry vs local launcher). Extend host-formats with servers for VS Code project mcp.json. recordInstall merges unique written[] onto hosts[agent]. CLI --scope and projects.json stay for later slice.

## Consequences

Positive: project writers and the path table agree; uninstall can reverse project files via written[]; JetBrains project path is .junie/mcp/mcp.json. Negative: setup CLI does not yet expose --scope project; Claude project extras (CLAUDE.md, commands, hooks) are not in this slice.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Reuse user-level hostRecord paths for projects (rejected: would write into HOME from project install)
1. Defer written[] until CLI lands (rejected: writer with no reverse path repeats ADR 175 deferral)
