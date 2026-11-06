# 095: Every handoff mode sweeps completed working papers, and closeout false is the read-only run

- **Date**: 2026-09-17
- **Status**: accepted
- **Tags**: docs, closeout, handoff, handon, process
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

ADR 079 put closeout sweep on close-session alone and rejected archiving in both modes, because plain handoff was read-only snapshot also used on resume through handon. That left docs tree stale in common case: session that never ran close-session kept finished audits, reviews and plans on disk forever, and sweep was reachable only by explicit mode nobody typed at end of ordinary session. maintainer asked for sweep to happen automatically at handoff and at resume so docs/audits, docs/reviews and docs/plans stay current, and for handon to propose next workstream instead of only verifying.

## Decision

Both handoff modes and handon archive completed working papers by default, in src/tools/handoff/_closeout.js, and report what they archived. new optional closeout boolean, default true, is added to both tool schemas, to CLI as --no-archive, and to /rule-handoff vocabulary as no-archive token: closeout false is read-only diagnosis that writes nothing and renumbers nothing. Archiving and ADR renumbering are now one act, so run that writes ADRs repairs numbering first and run asked to touch nothing does neither. handon sweeps after it verifies, so report describes tree handoff was written against rather than calling its own archived papers deleted; list mode stays pure listing. handon then adds Next from plans: for every docs/plans file with unchecked step, newest date first, nearest heading above first open step plus that step, worded as proposal user confirms before work starts. MCP readOnlyHint annotation on handon is dropped, and skill and prompt vocabulary now say it writes through sweep.

## Consequences

Finished working papers leave tree at every handoff instead of only at session close, so docs/audits, docs/reviews and docs/plans hold open work and nothing else. plain handoff is no longer pure read: it creates ADRs, deletes sources and can renumber, which /rule-handoff workflow now covers with explicit docs(adr) commit step before handoff file is committed alone. Resume costs one extra mutation that user can turn off. plan proposal is derived, not stored: it re-reads docs/plans on every resume, so it cannot go stale, and it proposes only first open step of each plan because user owns choice of workstream.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep sweep on close-session only (ADR 079) and ask user to run it: rejected because stale tree was complaint, and mode that must be remembered is reason it went stale.
1. Give handon separate sweep tool or flag-only surface: rejected because sweep is one implementation in _closeout.js and handon already walks docs tree on every resume.
1. Have handon pick one active plan by convention: rejected as guess, because five plan files live in docs/plans and any single pick would be wrong for four of them.
1. Add third handoff mode for sweep: rejected because mode distinction does not describe it, and boolean is smaller surface.
