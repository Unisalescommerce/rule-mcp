# 160: Rename the server to RuleMCP

- **Date**: 2026-10-23
- **Status**: accepted
- **Tags**: architecture, naming, release, migration
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

project has shipped as `rule-mcp`. GitHub repository is now `pixu1980/rule` and product name is RuleMCP. npm name `rule-mcp` belongs to unrelated third-party package, while `rule-mcp` is free. `RULE_MCP_*` environment prefix, `rule-*` skill names and `rule-mcp-architect` sibling are separate compatibility contract.

## Decision

Rename the project identity to RuleMCP: the package and binary are `rule-mcp`, the GitHub repository is `pixu1980/rule`, and the npm package is `rule-mcp`. Keep the `RULE_MCP_*` environment prefix, the `rule-*` skills and the `rule-mcp-architect` sibling under their current names. Historical ADRs, handoffs, reviews, audits and the changelog keep their old references; a migration note maps the old name to the new one.

## Consequences

old GitHub URL redirects to new repository. Users must reinstall binary and update MCP client configs from `rule-mcp` to `rule-mcp`; old shim is removed. npm name `rule-mcp` is different project and must not be used. rename is breaking CLI change, mitigated by migration note and unchanged environment prefix.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Use `rule-mcp` (npm name is owned by unrelated third party)
1. Use `@pixu1980/rule-mcp` (scoped, but GitHub repository is already `rule-mcp`)
1. Use `rule-mcp-server` (npm name is owned by unrelated third party)
1. Keep `rule-mcp` (does not match renamed repository or RuleMCP product name)
