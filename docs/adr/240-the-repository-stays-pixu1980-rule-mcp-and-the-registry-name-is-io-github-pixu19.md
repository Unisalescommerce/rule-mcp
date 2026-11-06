# 240: The repository stays pixu1980/rule-mcp and the registry name is io.github.pixu1980/rule-mcp

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: naming, release, repository
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 160 renamed the project and named a repository that no longer answers: the old URL returns HTTP 404, while the remote this checkout uses is the `rule-mcp` repository under the same owner. Twenty-three tracked files outside the ADR and handoff record still name the dead slug, including four tests that enforce it.

## Decision

repository stays `pixu1980/rule-mcp`. registry name in `server.json` becomes `io.github.pixu1980/rule-mcp`. RuleMCP stays display name only, so package, binary and environment prefix do not move. No file may name another repository as current fact.

## Consequences

Positive: every current link, install instruction and registry entry names a repository that exists. Positive: the display name survives without a second rename. Negative: ADR 160 keeps the wrong repository in its text, because the record of a decision is history and is not edited. Negative: twenty-three files and four tests change in one sweep.

## What would end this

repository moves to another owner or name, and files that name it change in same commit.

## Alternatives Considered

1. Keep old slug and create repository under it as alias
1. Rename repository again to match display name
