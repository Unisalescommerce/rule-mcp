# 173: One host record answers for every catalog host

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: installer, hosts, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Four registries grew independently: the agent catalog (23 names), the command targets (11 agents), the command gaps (13 reasons) and the hook hosts (15 rows, 5 writable). Each could name a host the others had never heard of, and the paths lived in four more places - install in _agents-_.js, uninstall in \_uninstall_.js, detection in _detect.js, and the documented file table in _hosts.data.js. The measured cost: droid was written to ~/.factory/mcp.json and removed from ~/.config/droid/mcp.json; antigravity was written to and read from a path its documentation does not name; neovim and emacs were "removed" from a mcp.json no installer ever wrote; ten catalog hosts had no hook row at all and hookSupport answered for them with an "Unknown host" fallback, so nothing in the tree could tell a measured absence from an oversight.

## Decision

Every catalog host has one record, in src/cli/installers/hosts/index.js: label, kind, evidence status, file its MCP entry lives in, paths earlier releases wrote, per-rung levels and computed ceiling. install, uninstall, detect, doctor, and invariant test read it. four registries keep their own surface - command target is not hook row - but tests/installers/host-record.test.mjs fails when host is missing from one of them, or in two command lists at once.

## Consequences

One place to change, and test that says when host is half-known. Cost: record is fifth module that everyone imports, so change to it is change to install surface; and uninstallers now depend on module that depends on installers' path helpers, which is slightly wider import graph for CLI that runs often.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave four registries and add test only: rejected, because test needs single answer to compare against, and inventing one only for test is same module without readers
1. One module per host, 23 files of twelve lines: deferred to Phase 2 and rejected there on ADR 053 grounds - one file per concern, and 23 identical files are one concern with 23 names
1. Put record in catalog (_catalog.js) instead of new folder: rejected, because catalog answers 'which agents exist' and this answers 'where each one lives', and merging them would make catalog import path helpers
