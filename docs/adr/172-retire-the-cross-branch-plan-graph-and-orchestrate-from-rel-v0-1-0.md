# 172: Retire the cross-branch plan graph and orchestrate from rel/v0.1.0

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: plans, orchestration, governance, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

level-0 orchestrator (docs/plans/plan-of-plans.md) was written on 2026-10-21 around five branches: feat/evolution as destination, and feat/guardrails, feat/decision-models, feat/export and feat/[removed] merging into it in stages 3-5. Its stages are now unreachable. Measured 2026-10-25 on rel/v0.1.0: feat/evolution does not exist locally or as remote, three feature branches that survive exist only as remotes and are not ancestors of HEAD, and content graph was written to merge is already in this tree - 87 plan nodes, ADR 143-154, _export.md, _2026-10-01-scripts-mcp-layout.md. branch that diverged before release line shows hundreds of commits HEAD does not reach, which is not same as work missing from tree.

## Decision

Retire cross-branch layer and make plan-of-plans level-0 orchestrator of one branch. Stages 3-5 (merges into feat/evolution) are recorded as retired with measurement that made them unreachable, not as done. graph drops to one level: plans in this tree, grouped by orchestrator that orders them - _skills-plan.md for catalog, this file for installer track (installer-scope-adr-policy-features then mcp-host-integration-depth), and single-document tracks that order themselves. node format drops six-line cross-branch form for four-line in-branch form of ADR 146, because Branch: and Path: have nothing left to disambiguate. main stays out of scope: release line diverged from it and owner opens merge request.

## Consequences

The graph is executable from the branch the work is on: section 7 ends with the node to execute next, and no stage asks for a branch that does not exist. Cost: the historical stage records and the 2026-10-21 inventory stay in the file as evidence, so a reader must tell history from instruction - the retired stages say so in their own headings. The remote feature branches are left as they are: deleting them is a repository decision, not this one.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Recreate feat/evolution locally and merge remote feature branches into it: rejected, because it would import older states of catalog that is already here, and merges would conflict on 44 divergent plan files for no gain
1. Delete plan-of-plans and let skills-plan be only orchestrator: rejected, because installer and host-integration plans are outside skills graph and would lose only place that orders them
1. Keep six-line node format for symmetry: rejected, because Branch: line with one possible value is field nobody can get wrong, and ADR 146 already specifies conditional form
