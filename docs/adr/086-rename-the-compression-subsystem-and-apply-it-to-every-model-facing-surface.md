# 086: Rename the compression subsystem and apply it to every model-facing surface

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: compression, tokens, rename, mcp-boundary, determinism
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

deterministic compressor was branded "caveman" in module names, exports, environment variables, comments, docs, served skill and installer. user asked for no remaining caveman references outside README.md, and for algorithms to run on every model-facing surface: tool results, prompts and resources. 100-character floor was requested to avoid paying pass's overhead on short messages.

## Decision

Rename code, comments and configuration to neutral compression names: `_caveman*.js` becomes `_compression*.js`, `cavemanLevel`/`cavemanEnabled` become `compressionLevel`/`compressionEnabled`, `RULE_MCP_CAVEMAN_LEVEL` becomes `RULE_MCP_COMPRESSION_LEVEL`, `RULE_MCP_NO_CAVEMAN` becomes `RULE_MCP_NO_COMPRESSION`, and served skill moves from `rule-mcp-caveman` to `rule-compression` (renamed again to `rule-process-compression` in ADR 105). README.md keeps single phrase `compression system inspired by caveman`. MCP middleware (`finalize` for tool results, `compressMessages` for prompts, `readResource` for resources) now skips compression below `MIN_COMPRESS_LENGTH` (100) characters. compressor itself stays length-agnostic so unit tests and `rule_tool_compress` tool keep their exact behavior.

## Consequences

codebase, generated agent commands, installers and docs no longer carry caveman branding; README.md is only file that references inspiration. Every model-facing surface runs same deterministic pass, with size floor that keeps short error messages and acknowledgments readable. Historical ADRs and CHANGELOG entries were rewritten to neutral name, which loses original wording but honors no-caveman constraint. performance plan, audit and review documents were updated to match.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep caveman name inside code and only rename docs
1. Drop compressor entirely and rely on tokensave suppression
1. Apply compression to every string with no size floor
