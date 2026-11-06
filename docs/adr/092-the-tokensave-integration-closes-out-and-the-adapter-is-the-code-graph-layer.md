# 092: The TokenSave integration closes out: the adapter and its graph-backed tools are the code-graph layer

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: tokensave, architecture, closeout, code-graph
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

docs/plans/tokensave-integration.md analyzed TokenSave code-graph server (89 tools) against this repository's own surface (107 tools), produced replacement map, and tracked nine milestones (M0 to M8) across adapter, read paths, routing, edits, dependencies and hardening. It shipped on 2026-09-15, from commit d4521b5 (M0, adapter foundation) to commit f38b003 (M8, version gate, staleness and parity), with every milestone stamped done in plan.

## Decision

Fold plan record into this ADR, name it in session handoff, and delete source file; full text stays in git history. What landed is code-graph layer: src/core/tokensave/ with probe, adapter and parity behind barrel; file-listing and read providers that replaced file-tree scans; graph-backed candidates in routing; edit adapter for write tools; semantic-changes handoff section; graph checklist in rule_tool_check mode=project; dependency, test and diagnostic reads; and version gate with staleness and parity checks.

## Consequences

docs/plans/tokensave-integration.md is gone from tree and handoff of this session names what it carried. five questions below stay undecided and are now this ADR's open list rather than plan's section 9. ADR 088 remains statement of policy these milestones implement: TokenSave is primary code graph and JavaScript graph is fallback.

## What would end this

assumption is that TokenSave MCP surface stays stable enough to be this repository's primary code graph, and that its index is present next to source. Removing tools adapter binds to, or major version parity gate refuses, would make JavaScript graph primary one instead, which is what ADR 088 already names as fallback.

## Alternatives Considered

1. Adapter transport: call TokenSave through existing MCP gateway (cheaper, no process spawn) or shell out to `tokensave tool` (simpler to test). recommendation recorded in plan was MCP first with CLI fallback.
1. Skills as docs: whether indexing skills/ as TokenSave docs pollutes code graph. queryignore mechanism exists; it was to be validated with `tokensave discover` before enabling.
1. Counter ownership: whether server reads TokenSave counter into rule_tool_stats, or keeps two ledgers separate and reconciles with `tokensave gain`.
1. Version policy: which TokenSave major is minimum supported version. It was 7.12.1 at time of plan.
1. Multi-root: graph_root accepts array on search and files, so whether adapter should query sibling projects (rule-mcp-architect, virtual-office) in one call.
