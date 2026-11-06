# 166: Orchestrate the plan catalog with a staged dependency graph

- **Date**: 2026-10-21
- **Status**: accepted
- **Tags**: plans, orchestration, dependency-graph, process, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

docs/plans holds 94 files on feat/guardrails-evolution: 82 skill plans, one cross-skill plan (bundler-family), 9 area plans, and three documents that are not work. Nobody knows what to run first. DEPENDENCIES.md states four edges and stops there, while plans themselves force more: rule-mcp-method must close before rule-process, served-references surface of rule-platform-desktop unblocks nine plans, and route-table generator in rule-process unblocks seven routers. Measured baseline: no plan carries status marker, none has dependency graph section, 35 plans have at least one closed box and none is done.

## Decision

One orchestrator at docs/plans/skills/_skills-plan.md, inside catalog it orders. Nodes are whole plans: 83 of them (82 skill plans plus bundler-family cross-skill plan). 9 area plans are absorbed into leaf and router plans that implement their content and leave graph. Edges have four kinds with different executor semantics: HARD blocks, ORDER warns, CONFLICT serializes on five shared files (dispatcher, router-gaps, ADR index and numbering, census snapshot and generated docs, guardrail corpus), CONTRACT blocks on one exporting phase of plan. Nine precedence policies govern edges, and contradiction between plan's text and graph is audit finding rather than silent override. Twelve stages order work; Stage 0 runs rule-process-ai, then rule-process-adr, then rule-platform-desktop#3, then rule-process#2 and #3. AI area needs no exception: ADR 129's eight rules move to rule-ai-agent-architecture, leaf that consumes them, so leaf precedes its router in all eleven areas. rule-process-tdd carries CONTRACT edge to rule-platform-mobile#2 because rule it cites lives there. Execution is on this branch, one commit per stage, four human gates: Stage 0 before anything, area close, any node touching five shared files, and any destructive node.

## Consequences

catalog gains one file that says what to do next, and every plan gains three lines that make answer checkable. Cost: 83 plans must be retrofitted stage by stage, and stale progress row now fails test instead of going unnoticed. AI plans change: eight rules move from rule-ai to rule-ai-agent-architecture, which inverts nothing else. nine area plans become superseded documents and their content lives where it is implemented.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Run plans in alphabetical order index already has (rejected: it puts routers before leaves and ignores seven-plan generator contract)
1. One branch per plan or per area (rejected: five shared files conflict on every merge, and branch already carries plans)
1. Generate graph from data file (rejected for now: plans' dependency prose is source, and data file would be second place to keep true before first is stable)
1. Keep nine area plans as verification nodes in final stage (rejected: their content duplicates what leaf plans implement, and node that verifies another node's output is review, not plan)
