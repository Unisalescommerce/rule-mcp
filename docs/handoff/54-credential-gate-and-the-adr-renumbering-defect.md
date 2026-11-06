# Session handoff: the credential gate runs, and the ADR renumbering is a defect

- Branch: `main` (the only branch).
- Covers: `a2b090c6..304c4eb8`, six commits.
- Date: 2026-11-06.

## What this session did

| Commit     | Change                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `bc27ba90` | `docs(adr): record ADR 206 and close out three completed plans` - ADR 207, 217, 218 plus their handoffs.                      |
| `192a8ddc` | `fix(cli): drop the pnpm global link on uninstall and deploy one project` - the code ADR 206 describes, with four test files. |
| `de8b11e1` | `chore(deps): bump opentui, eslint, jsdom, marked, playwright and the inspector`.                                             |
| `3f63e708` | `chore(census): refresh the snapshot the ADR closeout shifted`.                                                               |
| `e35c89a2` | `docs(plans): close the pi 1.5.0 skill-loading steps` - WS1-T3 and WS1-T3.1, plan `Status: done`.                             |
| `304c4eb8` | `fix(hooks): stage the whole census and run the hook tests in the suite`.                                                     |

## The credential gate now runs

Betterleaks was absent, so the pre-commit gate scanned nothing.

It now sits at `~/.local/bin/betterleaks`, version `2.0.0-rc.7`.

The `darwin_arm64` asset was checked against the release `checksums.txt`. The same file lists `linux_x64` with digest `230ef42d…`, which equals the pin in `.github/workflows/ci.yml`. So the pin matches upstream.

`rule-mcp secrets` answers `no credentials found` and exits 0. Every commit of this session printed that line.

## Defect: `rule_tool_handoff` renumbers the whole ADR corpus

This session ran the handoff with its default closeout. It rewrote the corpus:

- 235 ADR files deleted, 236 added, 26 files modified.
- The rewrite touched four trees only: `docs/adr`, `docs/handoff`, `docs/plans`, `docs/migrations`.
- Citations outside those trees keep the old numbers. `packages/`, `skills/` and the `docs/*.md` chapters were not touched.

Two examples:

- "main is the only branch" moved from 214 to 205. `docs/plans/plan-of-plans.md` and `docs/plans/_publication-cutover.md` still cite ADR 205.
- `packages/mcp/tools/adr/_english.js` still cites ADR 049.

Handoff 52 warned about this behavior. It is real.

The tree was reverted: `git checkout -- .` plus `git clean -fd docs/adr docs/handoff`. Nothing was lost. The sweep also archived `_pi-integration-and-debt.md` as ADR 232, and that closeout can run again after the repair is fixed.

The handoff was then re-run with `closeout: false`, which writes nothing.

## Also open

- Plan `_pi-integration-and-debt.md` has no open step and `Status: done`. The next handon retires it into an ADR.
- The census hook now stages `docs/01-getting-started.md` and `scripts/__tests__/fixtures/census.json`. Both were missing, so every ADR commit left the snapshot modified.
- The five hook tests now run in the foundation suite. `expandSuite("all")` went from 716 to 721 files.
- The full `pnpm test:foundations` suite was not run this session. Only the hook, ci and suite tests ran.

### Resume Prompt

next session opens with this block.

```prompt
Resume work on rule-mcp-workspace on `main`, the only branch. Read `docs/handoff/54-credential-gate-and-the-adr-renumbering-defect.md` first, then run `rule_tool_handon` with closeout disabled: the sweep renumbers the ADR corpus and rewrites citations in only four trees, so `packages/`, `skills/` and the `docs/*.md` chapters keep stale numbers.
First step: decide the repair for that numbering defect and write it as an ADR before touching code. Either keep existing numbers stable and number pending ADRs only, or rewrite every citation in the trees the sweep skips. Then re-run the closeout that retires `_pi-integration-and-debt.md`.
Every commit is `type(scope): subject`; the commit-msg hook rejects a scope-less message. The credential gate runs: betterleaks 2.0.0-rc.7 on `~/.local/bin`. Writing: STE100~80. Short sentences, active voice, one idea per sentence, same word for the same thing.
```
