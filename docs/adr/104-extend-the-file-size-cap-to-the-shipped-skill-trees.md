# 104: Extend the file-size cap to the shipped skill trees

- **Date**: 2026-09-21
- **Status**: accepted
- **Tags**: architecture, quality-gate, file-size, skills
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

150-line cap has covered src/, scripts/ and tests/ since ADR 053. trees under skills/ are not covered: they are assets user receives, and six of their source files exceed cap today - scaffold-component.mjs at 697 lines, _renderer.js 412, _filters.js 381, _expression-parser.js 371, _template-instance.js 335, _worker-pool.js 264. Those six are exactly god files ARCH-7 must split to reach its gini gate, and fifth, scaffold-component.mjs, is third-highest complexity in repo at 104 while being absent from plan's list of four. rule that does not cover code that ships cannot keep code that ships from growing back, and ARCH-6 showed what unwatched gate costs: its work sat uncommitted while test that would have caught drift was itself not running.

## Decision

Add skills/ to size-cap roots. Exempt test files skill trees ship beside their code, since test table is data about behavior rather than module that grew, and scope that exemption to skills/ so roots already covered lose no file. Grandfather six pre-existing offenders in ratchet with their current sizes, which may only shrink. ratchet's own rule that new entries are forbidden is amended to allow one adoption baseline taken when root is added, recorded in ADR that adds it.

## Consequences

cap now reaches code user receives, so six largest shipped files can only shrink: each split deletes its ratchet entry, and growth in any of them fails build. gate scans few hundred more files, which costs milliseconds. ratchet stops being closed list - it can gain adoption baseline whenever root is added - which is real loss of strictness, and reason baseline is tied to ADR rather than to commit. Test tables under skills/ stay outside cap, so shipped test may still grow without review; reasoning is that test table is read in one pass while 700-line module is not, and exemption is scoped to skills/ so no file already covered is dropped.

## What would end this

This leans on six files being on their way to split ARCH-7 already committed to. If those splits do not land, ratchet becomes permanent home for six god files with ceiling that only ratifies status quo - at that point honest move is to delete entries and treat skills trees as shipped data, which is what alternatives 3 and 4 above describe.

## Alternatives Considered

1. Leave cap over src/scripts/tests only: six splits ARCH-7 performs would be unguarded, so trees could re-bloat moment step closes.
1. Add all 14 over-cap files, tests included: 8 of them are test tables, and splitting table by line count is churn without reader benefit.
1. Treat skills/ as shipped content and exempt it wholesale: that leaves tree's largest file (697 lines) permanently outside every size rule in repo.
1. Split six first and extend cap after: gate would not exist while splits happen, which is order this repo has already learned to avoid.
