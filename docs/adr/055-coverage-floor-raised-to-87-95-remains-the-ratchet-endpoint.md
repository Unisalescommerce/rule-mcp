# 055: Coverage floor raised to 87; 95 remains the ratchet endpoint

- **Date**: 2026-09-07
- **Status**: accepted
- **Tags**: testing, coverage, ci, ratchet
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Phase 7 of plan (ADR 049/061/065) gates CI on rising branch-coverage floor. Landed targeted suites across darkest modules - doctor rendering, self-update gates, telemetry store I/O, HTTP transport, gateway core/render, transcripts, cache catalog verify, handon verification, project snapshot, role templates, terminal helpers, and more - taking measured floor from 83 to 87.88 on local full-suite run (multiple measures: 87.1-87.9; CI runs ubuntu/Node22 so floor is set below local measure for headroom). 95 target stays ratchet's endpoint; floor keeps rising as suites land.

## Decision

Raise BRANCH_FLOOR in scripts/reports/coverage/_threshold.data.mjs from 83 to 87. gate and ratchet mechanics are unchanged: pnpm test:coverage fails below floor, floor may only rise, and 95 is when phase closes. Every suite landed in this pass is co-located src/**/**tests** or folder-split repo-level tests, so glob runner picked them up with no package.json edits.

## Consequences

Positive: the branch floor moved 83 to 87, and the coverage work surfaced and fixed two real defects - the ADR index generator emitted tables prettier immediately reformatted (byte-equal gate was red on main), and the gateway loaded evidence from a tool name that never registered (evidence blocks carried 'Unknown tool' text). Negative: each remaining percentage point sits in CLI/daemon/transport arms that are platform- or subprocess-bound, so the last leg to 95 is slower per point than the first.

## What would end this

The assumption this leans on, and the observation that would make it wrong.
