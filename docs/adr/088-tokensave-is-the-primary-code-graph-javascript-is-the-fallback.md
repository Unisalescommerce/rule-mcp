# 088: TokenSave is the primary code graph, JavaScript is the fallback

- **Date**: 2026-09-15
- **Status**: accepted
- **Tags**: tokensave, architecture, adapter, fallback, code-graph
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

TokenSave indexes this project into local code graph and already ships 89 MCP tools for symbols, relationships, impact, health, tests, git history and edits. server used it only as suppression signal: it detected.tokensave/ and trimmed its own context dumps. Everything else was reimplemented in JavaScript. analysis in docs/plans/tokensave-integration.md maps 18 replacement opportunities and stages them in milestones; M0 is foundation every later milestone depends on.

## Decision

Add src/core/tokensave/ with three modules and barrel. probe.js detects .tokensave/tokensave.db, reads config and branch metadata, and exposes { available, version, branch, parentBranch, staleSeconds }; status reader is injected so probe has no client dependency. client.js is only place that calls tokensave CLI, mapping every call to `tokensave tool <name> --json --args <json> --project <path>` and normalizing missing binary, non-zero exit and malformed envelope into one { ok: false, unavailable: true, error } result. fallback.js exports withFallback(name, tokensaveFn, jsFn), which returns { value, path } and selects JavaScript path only for TokensaveUnavailableError; every other error propagates. TokenSave is primary code graph; JavaScript already in server stays as tested fallback and only code path used when graph is absent.

## Consequences

server gains optional runtime dependency on local TokenSave installation; when graph or binary is missing, JavaScript path answers and server behaves exactly as before. adapter is only module that knows TokenSave exists, so integration can be disabled in one place. probe is injected and client is injected, so both are testable without live graph. plan in docs/plans/tokensave-integration.md now has its foundation.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Call TokenSave only through agent's MCP gateway, never from server
1. Shell out to tokensave CLI for every call with no fallback layer
1. Skip adapter and keep existing suppression-only integration
