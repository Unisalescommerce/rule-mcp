# 124: Rename rule_tool_plan_docs to rule_tool_impersonation

- **Date**: 2026-10-01
- **Status**: accepted
- **Tags**: tools, personas, naming, breaking
- **Author**: Emiliano Pisu <emiliano.pisu@pixu1980.com>

## Context

`rule_tool_plan_docs` was bookkeeping half of persona run: write the
audit/review/plan trio after `rule_tool_plan` handed agent operation.
name described files, not act. Callers already treat tool as
"impersonate this role and keep its documents".

## Decision

Rename tool to `rule_tool_impersonation`. module moves to
`src/tools/actions/_impersonation.js`. Persona command bodies, operation
contract, install instruction text and surface map follow new name.
Historical ADRs keep old name as decision they recorded.

## Consequences

`DEPRECATIONS` keeps `rule_tool_plan_docs` answering as `rule_tool_impersonation`
until 0.3.0, with one stderr warning on first use. After that old name is
gone. census regenerates `docs/09-tools.md` and `docs/16-surface-map.md`.

## What would end this

Nothing short of further rename; previous name is retired.
