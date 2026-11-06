# 100: The handoff family gets a generated index, and the root HANDOFF summary retires

- **Date**: 2026-09-20
- **Status**: accepted
- **Tags**: handoff, docs, cli, doctor, code-graph
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

docs/adr/ADR.md is generated from ADR files, but handoff family had no index: only list of handoffs was computed at runtime by handon tool, and nothing on disk described family. Worse, family whose index was absent read as clean, because doctor compared only file that existed. root HANDOFF.md, rewritten from handoff text when project already had one, shared name while holding something else entirely.

## Decision

docs/handoff/HANDOFF.md is generated from numbered handoff files by handoff doctor, exactly as docs/adr/ADR.md is generated from ADRs. family with documents and no index is stale by definition, so doctor creates index it finds missing; family whose directory is absent is left alone, because conjuring directory is not this repair's decision. root HANDOFF.md summary is retired: two artifacts under one name cannot be told apart, and numbered documents already carry what it said.

## Consequences

doctor is only writer of index; editing it by hand is work next run discards. missing index is reported and created instead of reading as clean, so project with handoffs but no HANDOFF.md now has one after doctor run. Projects that kept root HANDOFF.md summary lose it; generated handoff text is unchanged, and index covers numbered documents. two indexes share one table renderer, which moved to core/text.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep refreshing root HANDOFF.md and add index beside it: two files named HANDOFF.md in one project.
1. Name index docs/handoff/index.md: second convention for same artifact.
1. Refresh index only when it already exists: project that never committed one would never get it.
1. Leave index to handon tool at read time: nothing on disk would describe family, and no link would resolve.
