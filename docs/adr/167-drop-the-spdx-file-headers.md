# 167: Drop the SPDX file headers

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: legal, governance, process
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Every tracked source file opened with two machine-readable lines:

```text


```

ADR 063 introduced them with REUSE.toml to make per-file licensing explicit. The
result was 1456 files whose first two lines are identical boilerplate, CI job
that exists only to check them, and header that says nothing reader of the
repository does not already know. owner asked for headers and check
to go.

## Decision

Remove two header lines from every tracked file, delete header checker
and `License headers` CI job, and stop treating header as source-file
requirement. `LICENSE`, `REUSE.toml` and package metadata remain the
license grant; no file changes its license.

## Consequences

Files start with their first meaningful line and size budget counts what a
module wrote. license is stated once, in files license
reader already looks for, instead of repeated in every implementation file. A
tool that scans per-file SPDX tags will find none; REUSE.toml still maps the
repository to MIT.

## What would end this

distribution model that needs per-file SPDX tag, or downstream consumer
that rejects files without one, would bring headers back as packaging
step rather than hand-written line in every file.

## Alternatives Considered

1. Keep headers and drop only CI job (boilerplate would drift, and
   nobody would notice)
1. Keep single header on entry points only (per-file claim that is true
   for some files is worse than no per-file claim)
1. Replace headers with generated file at release time (build step for
   text nobody reads)
