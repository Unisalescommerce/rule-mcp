# 181: Retire the cross-branch plan graph and orchestrate from rel/v0.1.0

- **Date**: 2026-10-25
- **Status**: accepted
- **Tags**: plans, orchestration, governance, release
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The level-0 orchestrator (docs/plans/plan-of-plans.md) was written on 2026-10-21 around five branches: feat/evolution as the destination, and feat/guardrails, feat/decision-models, feat/export and feat/[removed] merging into it in stages 3-5. Its stages are now unreachable. Measured 2026-10-25 on rel/v0.1.0: feat/evolution does not exist locally or as a remote, the three feature branches that survive exist only as remotes and are not ancestors of HEAD, and the content the graph was written to merge is already in this tree - 87 plan nodes, ADR 151-154, export.md, 2026-10-01-scripts-mcp-layout.md. A branch that diverged before the release line shows hundreds of commits HEAD does not reach, which is not the same as work missing from the tree.

## Decision

Retire the cross-branch layer and make plan-of-plans the level-0 orchestrator of one branch. Stages 3-5 (the merges into feat/evolution) are recorded as retired with the measurement that made them unreachable, not as done. The graph drops to one level: the plans in this tree, grouped by the orchestrator that orders them - skills-plan.md for the catalog, this file for the installer track (installer-scope-adr-policy-features then mcp-host-integration-depth), and the single-document tracks that order themselves. The node format drops the six-line cross-branch form for the four-line in-branch form of ADR 154, because Branch: and Path: have nothing left to disambiguate. main stays out of scope: the release line diverged from it and the owner opens the merge request.

## Consequences

The graph is executable from the branch the work is on: section 7 ends with the node to execute next, and no stage asks for a branch that does not exist. Cost: the historical stage records and the 2026-10-21 inventory stay in the file as evidence, so a reader must tell history from instruction - the retired stages say so in their own headings. The remote feature branches are left as they are: deleting them is a repository decision, not this one.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Recreate feat/evolution locally and merge the remote feature branches into it: rejected, because it would import older states of a catalog that is already here, and the merges would conflict on 44 divergent plan files for no gain
1. Delete plan-of-plans and let skills-plan be the only orchestrator: rejected, because the installer and host-integration plans are outside the skills graph and would lose the only place that orders them
1. Keep the six-line node format for symmetry: rejected, because a Branch: line with one possible value is a field nobody can get wrong, and ADR 154 already specifies the conditional form
