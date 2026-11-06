# 012 - SSE server with Bearer auth

- **Status:** accepted
- **Date:** 2026-07-19
- **Tags:** architecture, security
- **Author:** Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

SSE server was exposed without authentication. Anyone could connect and send messages. CORS was open to all origins.

## Decision

SSE server generates bearer token at startup, needs Authorization: Bearer on /sse and /message, CORS deny-by-default, body limit 1MB.

## Consequences

Server secure by default. Token printed to stderr for client. Compatible with any MCP client.

## Alternatives Considered

- Hardcoded API key (rejected)
- No authentication (rejected: insecure)
