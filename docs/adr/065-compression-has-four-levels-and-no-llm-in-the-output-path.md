# 065: Compression has four levels and no LLM in the output path

- **Date**: 2026-09-09
- **Status**: accepted
- **Tags**: compression, tokens, determinism, text
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

caveman skill defines lite/full/ultra intensity levels, and its caveman-compress companion reaches its numbers by calling LLM and validating result with validate.py. server had one level, 16-word vocabulary and no validator, measured at 0.5-2.2 percent against skill's ~75 percent claim. Whether to port LLM step was open question.

## Decision

Port deterministic half and refuse LLM half. Four levels (off, lite, full, ultra) select data tables tagged per level, and validate.py becomes src/core/text/compress-guard/, running per prose run with rollback on violation. LLM in output path would cost determinism, cacheability and zero-dependency contract, and result cache could no longer replay compression. guard plus per-block rollback buys same safety deterministically, and caveman skill is credited as idea source rather than invoked.

## Consequences

vocabulary can be aggressive because bad rule costs one paragraph, not whole result. Measured by pnpm report:compression: 2.03 percent on real tool results and 34.2 percent on verbose prose at full, with zero guard violations. plan's 8 and 20 percent targets were corrected by measurement, because this repository's own docs are already written in compressed style. guard immediately caught real bug: 4-backtick fence wrapping 3-backtick content desynced fence walker. Cost: compression level is part of tool cache key, so changing it recomputes.

## What would end this

The assumption this leans on, and the observation that would make it wrong.
