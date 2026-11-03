# 44: Plan audit closed, rule-process-ai at 21 of 23

- **Branch**: `rel/v0.1.0`
- **Commit range**: `0a70bacd`..HEAD (reference audit F1-F3 → WS-C node → advisory rules → Phase 4)
- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0; merge commits: 2
- **Date**: 2026-11-03

## Done

1. **Reference audit closed** — F1, F2 and F3 are marked resolved in `docs/plans/_plan-of-plans-reference.md` with the evidence that closed them: 92 plans carry `## Dependency graph`, the Stage 3 split reads `3.1 < 3.2` in the test, and both toolchain plans run in Stage 4. Open boxes in that file: 8 → 5.
2. **WS-C opened** — the first node with closed edges is `rule-process-ai`, and its Phase 0, Phase 1 and Phase 3 are complete. The node sits at 21/23.
3. **The reduction signal** — `SKILL.md` names the four phrase families, the lowercase substring rule and the English-only limit. `SCOPE_CHALLENGES` (its own fixture, because `routing-corpus.mjs` is at its ratchet) pins one prompt per family, and the suite asserts both the signal and the route.
4. **Spelling map completed** — `-ogue` narrowed to `catal|dial|anal` so `monologue`, `epilogue`, `prologue` and `travelogue` stay; the medical family, the `-lled`/`-lling` family and the single words (`sceptre`, `manoeuvre`, `tyre`, `jewellery`, `sulphur`, `mediaeval`, ...) added. Tests T3.6-T3.9 were red first.
5. **Prose rules** — `ai-bidi-controls` blocks any invisible direction override; `ai-no-emoji` reads documents only (source glyphs are interface copy); `ai-nfc-text` compares the NFC normalization; `ai-repeated-opener` and `ai-structural-tells` read documents. Corpus pairs live in `scripts/__tests__/fixtures/prose-corpus.mjs`, merged in `_scores.fixture.mjs`, because the shared corpus may only shrink.
6. **Routers** — seven missing rows added across five area routers, and `ROUTER_GAPS` is empty. No area waits for a leaf, so `DEPENDENCIES.md` needed no new entry.
7. **Gates** — corpus, routing corpus, reminder, enforcement and docs-accuracy green; `pnpm census:check` current; `pnpm test:all` 2976 tests, 2973 pass, 0 fail, 3 skip. `pnpm lint` is red repo-wide (2,247 errors, nearly all `unicorn/no-asterisk-prefix-in-documentation-comments`) on files this session never touched, so the gate cannot pass until that config is reconciled; the files touched here pass eslint on their own.

## State

- `rule-process-ai`: 21/23. Phase 0, 1, 3 and 4 done; Phase 2 has `ai-bidi-controls` blocking plus four advisory rules.
- Three B rules are recorded as blocked, not built: `ai-identifier-english` is already carried by `ai-english-only-prose` (dictionary-driven, so `calcolaTotale` passing is a data gap), `ai-plain-sentence-length` has no documented threshold, `ai-terminology-consistency` has no glossary.
- Feature range `325936e6..HEAD`: 456 commits, 0 Conventional Commit violations, 2 merge commits (`e9d29e8e`, `df6ba117`).
- `pnpm changelog` regenerates everything under `[Unreleased]` (1,658 lines); that rewrite was reverted and belongs to the release, not to a working session.

## Left out / next

- Decide the sentence-length threshold, the glossary, and whether the foreign-token dictionary should grow; that decision unblocks three rules.
- Phase 2 also owes the census regeneration once the advisory set is complete.
- `docs/plans/_plan-of-plans-reference.md` still has 5 open boxes while ADR 171 declared it deleted; it stays unarchivable until they close.
- Two tests are load flakes under the full suite and pass alone: `daemon start detaches instead of holding the daemon open` and `the hard timeout aborts the call and the client does not retry`.
- Feature close is still pending: `--close-feature --squash` with 456 commits and 2 merge commits.

### Resume Prompt

```prompt
Resume work on rule-mcp from docs/handoff/44-plan-audit-and-process-ai-21-of-23.md on branch rel/v0.1.0.
Run rule_tool_handon first; trust only claims that still hold.
rule-process-ai is at 21/23: Phase 0, 1, 3 and 4 are done; Phase 2 has ai-bidi-controls plus four advisory rules. Three rules are blocked on a decision, not on code: the sentence-length threshold, a terminology glossary, and whether the foreign-token dictionary grows.
First step: decide those three, or close the feature (456 commits, 2 merge commits) with --close-feature --squash.
Every commit is type(scope): subject. Do not push.
```
