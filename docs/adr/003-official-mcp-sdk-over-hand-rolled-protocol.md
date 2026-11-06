# 002 - Official MCP SDK over Hand-Rolled Protocol

**Status**: Accepted
**Date**: 2026-06-23
**Deciders**: Project owner

## Context

initial implementation used custom JSON-RPC protocol for MCP communication. This needed maintaining:

- Message framing (JSON-RPC 2.0)
- Request/response matching
- Error serialization
- Transport abstraction (stdio, SSE)
- Capability negotiation
- Protocol versioning

## Decision

Replace hand-rolled protocol with `@modelcontextprotocol/sdk` v1.29.0.

## Rationale

1. **Standard compliance** - SDK guarantees compatibility with all MCP clients (Claude, Cursor, VS Code, etc.).
2. **Feature completeness** - SDK provides transport (StdioServerTransport, SSEServerTransport), capability negotiation, logging, and completion handlers out of box.
3. **Reduced maintenance** - Protocol changes are handled by SDK updates. No custom protocol bugs.
4. **Future-proof** - SDK evolves with MCP specification. New MCP features (streaming, batching, etc.) become available without reimplementation.

## Consequences

- SDK is runtime dependency (`@modelcontextprotocol/sdk` 1.29.0).
- SDK API changes need version pinning in package.json.
- old `src/mcp/protocol.js` and `src/mcp/stdio.js` were deleted (∼400 lines removed).
- `src/server.js` now uses `Server` from SDK with `setRequestHandler` for tools, resources, prompts, and completions.
