# 181: Host install and uninstall maps are lookups on the host record

- **Date**: 2026-10-27
- **Status**: accepted
- **Tags**: installer, hosts, architecture
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Phase 1 of mcp-host-integration-depth deferred wiring installers/uninstallers through hostRecord to avoid large no-behavior-change diff. maps and record could disagree about which hosts exist.

## Decision

Add hosts/_writers.js as single table of install/uninstall pairs. hosts/_core.js holds path/identity so uninstall bodies can import it without cycling through writers table. hosts/index.js attaches .install/.uninstall from writers. _registry.js and _uninstall.js build their maps as Object.fromEntries(catalogHosts().map(id => [id, hostRecord(id).install|uninstall])). Move uninstallVscode into _uninstall-hosts.js so writers table does not import uninstallers map. Writer bodies stay where they are; one module per host remains deferred.

## Consequences

Positive: installers[id] === hostRecord(id).install for all 23 hosts (enforced by host-writers.test.mjs); adding a host requires writers + evidence in one place. Negative: path identity lives in hosts/_core.js and the public hostRecord in index.js is a thin writers attach (two modules for one record); generic install/uninstall closures are created once at module load for all GENERIC_HOSTS.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Move each writer body into hosts/`<id>`.js now (rejected: large diff, same observable behavior, conflicts with ADR 053 one-concern)
1. Keep parallel maps and only add consistency test (rejected: two sources of truth remain)
1. Lazy getters that import writers after load (rejected: unnecessary once circular imports are limited to runtime calls)
