# 231: pnpm workspace with packages mcp shared docs and publish from packages/mcp

- **Date**: 2026-11-01
- **Status**: accepted
- **Tags**: architecture, workspace, packages, publish, [removed]
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

server lived under single root package named rule-mcp with src/, tests/, scripts/docs-site, and case-studies/ at repo root. That blocked real pnpm workspace, forced publish metadata onto git facade, and made sibling [removed] awkward to link. Plan docs/plans/_scripts-mcp-layout.md (WS0-WS6 on rel/v0.1.0, ADR 172) extracted layout; ADR 126 is about feature closeout handoffs and must not be amended for this decision.

## Decision

Keep git root as private facade rule-mcp-workspace. Publish product as packages/mcp (name rule-mcp). Put cross-cutting helpers in packages/shared (rule-mcp-shared) with no re-export shim under mcp. Put docs site builder in packages/docs (rule-mcp-docs). Keep [removed] as sibling../[removed] ([removed]-gateway) linked via pnpm-workspace.yaml; CI and Docker materialize scripts/ci/[removed]-stub when sibling is absent and set RULE_MCP_NO_[removed]=1. Alias @mcp/* maps to packages/mcp/; shared imports use rule-mcp-shared. Relocate tests to scripts/**tests**/ and case-study apps to docs/case-studies/. Pack with pnpm pack --filter rule-mcp. Docker COPY packages/ and CMD node bin/rule-mcp.js. Do not create branch refactor/packages-mcp-[removed]-workspace.

## Consequences

Positive: clear publish boundary, workspace members match ownership, CI works without a real [removed] checkout, Docker and pack target the product package. Negative: every relative path and entrypoint depth had to move with the tree; docs and skills that still say src/ need ongoing cleanup; core/text stays in mcp by design until a later ADR. Supersedes the implied single-package layout; does not amend ADR 126.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep single root package named rule-mcp and only move folders without renaming publish boundary
1. Vendor [removed] into packages/ instead of sibling workspace member
1. Leave packages/mcp/shared re-export shim so old import paths keep working
1. Extract core/text into shared in same move
