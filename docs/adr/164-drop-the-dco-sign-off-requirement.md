# 164: Drop the DCO sign-off requirement

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: governance, ci, process
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

Every commit carried `Signed-off-by` trailer under Developer Certificate of Origin. rule lived in `.githooks/commit-msg`, in `dco` CI job, in `tests/docs/dco.test.mjs` and in `CONTRIBUTING.md` paragraph. On single-maintainer repository trailer certifies provenance MIT license already covers (`inbound = outbound`), while every contributor pays rejection and `git commit -s` for it. owner asked for gate to be removed.

## Decision

Remove requirement, not check: commit-msg hook validates conventional subject only, `dco` CI job and its test are deleted, and `CONTRIBUTING.md` states that there is no CLA and no DCO sign-off requirement. licensing sentence stays: inbound contributions are MIT, matching `LICENSE` and `REUSE.toml`.

## Consequences

contributor no longer adds trailer or installs `git commit -s`. Existing trailers stay in history and remain valid provenance records; nothing is rewritten. repository loses per-commit certification, so future contribution dispute rests on license and git history alone.

## What would end this

multi-maintainer model that needs per-commit provenance, or downstream consumer that needs DCO trail, would bring trailer back as policy decision rather than hook default.

## Alternatives Considered

1. Keep DCO and exempt maintainer (exception would be invisible to contributors and unenforced)
1. Replace it with CLA (heavier requirement, against inbound-equals-outbound policy)
1. Keep hook and drop only CI job (local commits would still be rejected)
