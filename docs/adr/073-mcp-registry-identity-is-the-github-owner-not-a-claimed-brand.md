# 073: MCP registry identity is the GitHub owner, not a claimed brand

- **Date**: 2026-09-10
- **Status**: accepted
- **Tags**: registry, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

OSS-3: server.json claimed io.github.rule-mcp namespace while GitHub owner is pixu1980. MCP registry validates namespace ownership against publishing account, so file as written was unpublishable. Interview decision D9 settled identity on GitHub owner.

## Decision

server.json name is io.github.pixu1980/rule, derived from repository.url. Registry publication itself is deferred: no authenticated publish happens in this session; revisit once release pipeline (Step 6) ships signed tarballs.

## Consequences

server.json is publishable in shape; npm packages[] entry is untouched (out of scope, revisit with release pipeline in Step 6); actual registry publication stays explicit owner action.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Publish now with mcp-publisher CLI (rejected: needs owner's authenticated login, unavailable in this session; owner action 8 stays open)
1. Keep io.github.rule-mcp namespace (rejected: unpublishable and claims namespace maintainer does not control)
