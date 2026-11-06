# 147: Keep BM25 and gate a local decision model as a second opinion

- **Date**: 2026-10-22
- **Status**: accepted
- **Tags**: routing, decision-models, architecture, security, testing
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

decision-models audit measured local llama.cpp `/v1/systemone` endpoint against 95-prompt routing corpus. first ruler was broken: three corpus `expect` values named skills that no longer exist (`backend-api-design`, `ai-agents`, `devops-gitlab-ci`), covering five prompts. This ADR is written after repointing those prompts at surviving owners: idempotency to `backend-node`, error contract to `backend-security`, retrieval to `ai-context-engineering`, and CI merge blocking to `devops-testing`; structural test now fails if any `expect` names skill catalog does not carry.

Measured numbers:

- Audit baseline before repair: 77/95 exact, 90/95 top-or-alternative, 3/13 fixed on five-option shortlist, 1/13 on 83-skill catalog.
- Live pre-repair on this checkout: 76/95 exact, 89/95 top-or-alternative.
- Corrected ruler after repair: 77/95 exact (81.1%), 91/95 top-or-alternative (95.8%), recorded in `tests/fixtures/decision-models/corpus-baseline.json`.

model is deterministic and loopback-only, but its `confidence` is score, not calibrated probability, and unbounded option set made it confidently wrong (0.999 for wrong catalog pick).

## Decision

1. BM25 remains router. No generative model is in request path and no endpoint but loopback is reachable: `createDecisionClient` refuses every non-loopback host by construction.
2. model may only rerank BM25 shortlist, capped at six options. Its pick replaces BM25 pick only when model's probability clears per-model threshold recorded in registry; otherwise BM25 wins. Laya's floor is 0.05 in `src/core/decision/_registry.js`, below audit's 0.067-0.332 correct picks, so three fixes prototype found are not filtered out. registry carries each model's size, context, languages and shortlist cap; `auto` selects by prompt's detected language and unloads previous model before switching, so one-slot router never carries two. reranker ships off until Step 4 gate passes.
3. measurement command `scripts/audits/decision-models/corpus.mjs` runs corpus with model off and on, prints exact, top-or-alternative, per-model mean latency and input tokens, writes run to `tests/fixtures/decision-models/corpus-baseline.json`, and `--check` compares live model-off run with committed numbers.
4. Step 4 kill criterion: corpus exact rate must exceed 77/95 and top-or-alternative must stay at or above 91/95. If either regresses, feature ships off and Step 4 is reopened as rejected rather than tuned until it passes.
5. catalog experiment is measurement-only: 83 options are never production option set.
6. corpus names only current skills; structural test is guard against retired name returning.
7. Cache model's answer under SHA-256 digest of model id, prompt and questions, with shortlist folded into questions. `RULE_MCP_NO_CACHE=1` bypasses it, and cache is consulted before supervisor so hit never loads, unloads or swaps model. audit's determinism is what makes cache safe; digest is what makes model or shortlist change miss it.
8. semantic rule ships as advisory in new `semantic` family: `semantic-error-message-actionable` extracts literal error messages, asks one `noul` question about them, reports model's probability, and never fails check. No endpoint means rule is skipped, not failed. Its live precision on pair corpus is unmeasured; rule is advisory because of that.

## Consequences

Positive: the baseline is a file and a command, not a memory; a model or router change is compared against the same 95 prompts; the model cannot send prompt text off the machine; the ranker cannot be silently replaced by a worse catalog-wide guess.

Negative: the model-on measurement needs a loopback router and a loaded model, so the committed 3/13 and 1/13 are the audit's recorded prototype numbers until the command is rerun with `--on`; the corpus repair moves the live baseline from 76/89 to 77/91, so the audit's historical 77/90 is not directly comparable to the corrected ruler. The Italian slice measures 2/8 exact, 3/8 top-or-alternative and 5/8 unknown; Julia-1 is not installed, so the Italian routing claim is not made. The harness and registry ship, and the swap cost stays unmeasured. The persona severity normalizer is not shipped: the review labels are the agent's own, so the agreement measurement would be circular; the agent's labels stand.

## What would end this

If Step 4 cannot raise exact above 77/95 while keeping top-or-alternative at or above 91/95, model is not worth request-path cost and feature is removed. If deployment needs remote endpoint, decision layer is dropped rather than weakened: loopback is construction rule, not configuration default. If installed model is not decision model, client falls back to BM25 instead of guessing from successful load. If multilingual model is not installed, language path stays off and Italian claim is dropped rather than faked. If endpoint stops returning same probabilities for same state and questions, cache is removed rather than trusted. If live semantic rule's precision on its pair corpus is below 100%, it stays advisory or leaves family; it never blocks. If independent human-labeled severity set appears, normalizer can be measured and reconsidered; without it, it stays out.

## Alternatives Considered

1. Replace BM25 with model over whole catalog. Rejected: 1/13 fixed, confidently wrong (0.999 on wrong pick), and 83 options per request.
1. Use model's confidence as probability without threshold or shortlist. Rejected: audit measured 0.067-0.332 on correct picks and 0.999 on wrong catalog picks; it is score.
1. Ship reranker without repairing ruler. Rejected: five prompts named skills that no longer exist, so 81% baseline was measured on unaddressable target.
1. Use remote hosted model. Rejected: privacy, latency and non-goal of network path.
